// TODO: add dry run --dry-run flag
// and bump version (--version or --bump)
import {Args, Command, Flags} from '@oclif/core'
import {BaseCommand} from '../../base.js'
import {join, relative} from 'node:path'
import {createReadStream, existsSync, readdirSync, statSync} from 'node:fs'
import {cp, rm, mkdir} from 'node:fs/promises'
import {AuthService} from '../../auth-util.js'
import ora, {Ora} from 'ora'
import chalk from 'chalk'
import {
  ArtifactBuilder,
  ArtifactConfig,
  ArtifactRegistryUploadClient,
  ArtifactUploader,
  ArtifactValidator,
} from '@xgsd/registry-sdk'
import {createHash} from 'node:crypto'
import {pipeline} from 'node:stream/promises'
import {confirm} from '@inquirer/prompts'

async function sha256(path: string) {
  if (!existsSync(path)) {
    throw new Error(`path does not exist`)
  }

  const hash = createHash('sha256')
  await pipeline(createReadStream(path), hash)

  return hash.digest('base64')
}

export default class ArtifactsPublish extends BaseCommand {
  static override args = {}
  static override description = 'publish a versioned artifact to the registry'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    ...BaseCommand.flags,
    clean: Flags.boolean({char: 'C'}),
  }

  protected async setup2() {
    const artifactYml = join(this.cwd, 'artifact.yml')

    const validator = new ArtifactValidator()
    let artifactConfig: ArtifactConfig
    try {
      artifactConfig = await validator.validate(artifactYml)
    } catch (error) {
      this.error(`failed to validate config`)
    }

    if (!this.userConfig.exists('registry')) {
      this.error(`"registry" not configured, use "web config set registry {url}"`)
    }

    console.log(this.userConfig.get('registry'))
    const auth = new AuthService(this.userConfig)
    const registryClient = new ArtifactRegistryUploadClient({
      url: this.userConfig.get('registry')!,
      accessToken: (await auth.getAccessToken()).accessToken,
      config: artifactConfig,
    })

    const filename = `${artifactConfig.name}-${artifactConfig.version}.tgz`
    const buildDir = join(this.cwd, '.web', 'tmp')
    const outDir = join(this.cwd, '.web', 'out')
    const outPath = join(outDir, filename)

    const builder = new ArtifactBuilder(buildDir, outPath)
    const uploader = new ArtifactUploader(outPath)

    const {name, version} = artifactConfig

    return {
      fullName: `${name}@${version}`,
      artifactYml,
      artifactConfig,
      registryClient,
      builder,
      uploader,
      alreadyBuilt: existsSync(outPath),
      outDir,
      outPath,
      buildDir,
    }
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ArtifactsPublish)
    await this.initClient(flags)

    const {fullName, artifactYml, outDir, buildDir, outPath, alreadyBuilt, builder, uploader, registryClient} =
      await this.setup2()

    /**
     *  RESERVE
     */
    const spinner = ora()
    spinner.start(chalk.gray(`reserving ${fullName}`))

    const {ok, reason, data} = await registryClient.reserve()

    if (!ok) {
      spinner.fail()
      const msg = `${fullName} - ${reason?.split('-').join(' ')}`

      this.error(msg)
    }

    spinner.succeed(chalk.gray(`[1/4] reserved ${fullName}`))

    /**
     *  BUILD
     */
    let contentHash: string = ''
    spinner.start(chalk.gray(`checking build status`))
    if (!alreadyBuilt || flags.clean) {
      spinner.stop()

      // clean old files
      await rm(buildDir, {recursive: true, force: true})
      await mkdir(buildDir, {recursive: true})
      await mkdir(outDir, {recursive: true})

      // copy builder files -> .web/tmp
      await cp(join(this.cwd, 'artifacts'), buildDir, {recursive: true})
      await cp(artifactYml, join(buildDir, 'artifact.yml'))

      const files = readdirSync(buildDir, {recursive: true}).filter((r) => statSync(r).isFile()) as string[]

      if (files.length === 0) {
        this.log(chalk.gray('nothing to upload'))
        return
      }

      spinner.start(chalk.gray(`compressing ${fullName} to ${outPath}`))
      try {
        // build
        const {hash} = await builder.build()

        contentHash = hash
      } catch (error) {
        await registryClient.abort()
        this.error(`build failed for ${fullName}`)
      } finally {
        spinner.stop()
      }
    } else {
      contentHash = await sha256(outPath)
    }

    spinner.succeed(chalk.gray(`[2/4] ${relative(outDir, outPath)} (sha256:${contentHash})`))

    /**
     *  CONFIRM
     */

    if (!(await confirm({message: 'upload?'}))) {
      await registryClient.abort()
      this.log(`aborted`)
      return
    }

    /**
     *  UPLOAD
     */
    const {url, method} = data?.upload!

    try {
      await uploader.upload({url, method, contentHash})
    } catch (error: any) {
      spinner.stop()
      this.error(`failed to upload ${fullName}`)
    }

    spinner.succeed(chalk.gray(`[3/4] uploaded ${fullName}`))

    /**
     *  PUBLISH
     */
    try {
      const {ok: pubOk, reason: pubReason} = await registryClient.publish()
      if (!pubOk) {
        spinner.stop()
        this.error(`failed to publish ${fullName} - ${pubReason?.split('-').join(' ')}`)
      }
    } catch {
      spinner.stop()
      this.error(`failed to publish ${fullName} - unknown error`)
    }

    spinner.succeed(chalk.gray(`[4/4] published ${fullName}`))

    await rm(buildDir, {recursive: true, force: true})
    await rm(outPath, {recursive: false})

    this.log(chalk.green(`+ ${fullName}`))
  }
}
