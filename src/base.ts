import {Command, Flags} from '@oclif/core'
import {Artifact, ArtifactStorage} from '@xgsd/artifact-sdk'
import chalk from 'chalk'
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs'
import {mkdir, readFile} from 'node:fs/promises'
import {dirname, join, relative, resolve} from 'node:path'
import prettyMs from 'pretty-ms'
import {runPool} from './util.js'
import ora from 'ora'
import prettyBytes from 'pretty-bytes'
import {createHash} from 'node:crypto'

export function sha256File(path: string) {
  const raw = readFileSync(path)

  return createHash('sha256').update(raw).digest('hex')
}

export abstract class BaseCommand extends Command {
  static flags = {
    cwd: Flags.string({
      char: 'c',
      default: process.cwd(),
    }),

    dry: Flags.boolean({
      char: 'd',
      default: false,
      aliases: ['dry-run'],
    }),

    simple: Flags.boolean({
      char: 's',
      default: false,
    }),

    signUrl: Flags.string({
      char: 'u',
      env: 'SIGN_URL',
      required: true,
    }),

    signToken: Flags.string({
      char: 't',
      env: 'SIGN_API_TOKEN',
      required: true,
    }),
  }

  protected artifact!: ArtifactStorage

  protected cwd!: string

  protected async initClient(flags: any) {
    this.cwd = resolve(flags.cwd)

    this.artifact = new ArtifactStorage(flags.signUrl, flags.signToken)
  }

  protected get indexPath() {
    return join(this.cwd, 'artifacts.index.json')
  }

  protected async loadIndex() {
    if (!existsSync(this.indexPath)) {
      this.error(`No index exists at ${this.indexPath}, run "web init" first.`)
    }

    const content = await readFile(this.indexPath, 'utf-8')

    return this.artifact.toLocalIndex(this.cwd, JSON.parse(content))
  }

  protected async loadRemoteIndex() {
    const remote = await this.artifact.getIndex()
    return this.artifact.toLocalIndex(this.cwd, remote)
  }

  protected localFiles() {
    const artifactDir = join(this.cwd, 'artifacts')

    return readdirSync(artifactDir, {recursive: true})
      .map((p) => join(artifactDir, String(p)))
      .filter((p) => statSync(p).isFile())
      .map((p) => relative(this.cwd, p).replace(/\\/g, '/'))
  }

  protected getSize(files: {size: number}[]): number {
    return files.map((a) => a.size).reduce((a, b) => a + (b ?? 0), 0)
  }

  async transferArtifacts(opts: {
    type: 'upload' | 'download'
    artifacts: Artifact[]
    dryRun?: boolean
    simple?: boolean
  }) {
    const {type, artifacts, dryRun, simple} = opts

    const successful = new Map<string, Artifact>()
    const entries = Object.entries(artifacts)

    const start = Date.now()
    const size = this.getSize(Object.values(artifacts))

    let completed = 0
    let transferredBytes = 0

    // -----------------------------
    // ORA (global progress)
    // -----------------------------
    const spinner = ora(chalk.gray(`${type}ing ${entries.length} artifacts ...`))

    spinner.start()

    function formatProgress() {
      const elapsed = Math.max((Date.now() - start) / 1000, 0.001)
      const rate = transferredBytes / elapsed
      const remainingBytes = size - transferredBytes
      const eta = rate > 0 ? remainingBytes / rate : 0

      spinner.text = chalk.gray(
        `${type}ing ${completed}/${entries.length} ` +
          `(${prettyBytes(transferredBytes)}/${prettyBytes(size)}) ` +
          `${prettyBytes(rate)}/s ETA ${prettyMs(eta * 1000)}`,
      )
    }

    const timer = simple ? setInterval(formatProgress, 250) : undefined

    // -----------------------------
    // WORK
    // -----------------------------
    await runPool(entries, async ([key, artifact]: [string, Artifact], workerId: number, pos: number) => {
      const filePath = join(this.cwd, key)

      const total = artifact.size ?? 0

      if (simple) {
        spinner.start(chalk.gray(`${type}ing ${key} (${pos}/${entries.length})`))
      }

      try {
        if (!dryRun && type === 'upload') {
          await this.artifact.uploadFile(filePath, `crawldb:${key}`)
        }

        if (!dryRun && type === 'download') {
          await mkdir(dirname(filePath), {recursive: true})
          await this.artifact.downloadFile(`crawldb:${key}`, filePath)
        }

        transferredBytes += total
        completed++

        successful.set(key, {
          ...artifact,
          checksum: !dryRun ? sha256File(filePath) : 'not calculated',
          path: relative(this.cwd, filePath),
        })

        if (simple) {
          spinner.succeed(chalk.gray(`${type}ed ${key} (${pos}/${entries.length})`))
        }
      } catch (err: any) {
        console.log(err)
        if (simple) {
          spinner.fail(
            chalk.red(`failed to ${type} ${key} (${pos}/${entries.length}) - ${err?.message ?? 'unknown error'}`),
          )
        } else {
          this.log(chalk.red(`failed to ${type} ${key} - ${err?.message ?? 'unknown error'}`))
        }
      }
    })

    // -----------------------------
    // CLEANUP
    // -----------------------------
    clearInterval(timer)

    spinner.succeed(
      chalk.gray(
        `${type}ed ${successful.size}/${entries.length} artifacts ` +
          `(${prettyBytes(size / ((Date.now() - start) / 1000))}/s)`,
      ),
    )

    return successful
  }

  protected done(dry: boolean, started: number) {
    const duration = Date.now() - started
    this.log(chalk.green(`done in ${prettyMs(duration)}!`))

    if (dry) {
      this.log(chalk.gray('dry mode enabled - no real changes were made'))
    }
  }
}
