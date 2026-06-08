import {Command, Flags} from '@oclif/core'
import {Artifact, Storage, Index} from '@xgsd/artifact-sdk'
import chalk from 'chalk'
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs'
import {mkdir, readFile} from 'node:fs/promises'
import {dirname, join, relative, resolve} from 'node:path'
import prettyMs from 'pretty-ms'
import {runPool, Secret} from './util.js'
import ora from 'ora'
import prettyBytes from 'pretty-bytes'
import {createHash} from 'node:crypto'
import {UserConfig} from './config.js'
import keytar from 'keytar'

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

    silent: Flags.boolean({
      char: 's',
      default: false,
      description: 'silence logging for some commands',
    }),

    dry: Flags.boolean({
      char: 'd',
      default: false,
      aliases: ['dry-run'],
    }),

    force: Flags.boolean({
      char: 'f',
      default: false,
    }),

    simple: Flags.boolean({
      char: 'S',
      default: false,
    }),
  }

  protected artifact!: Storage
  protected secret!: Secret
  protected userConfig!: UserConfig

  protected cwd!: string

  protected async initClient(flags: any) {
    this.cwd = resolve(flags.cwd)

    this.userConfig = (
      UserConfig.exists(this.userConfigPath) ? UserConfig.fromPath(this.userConfigPath) : UserConfig.new()
    ) as UserConfig

    this.secret = new Secret(keytar)
  }

  protected get userConfigPath() {
    return join(this.config.configDir, '.config.json')
  }
}
