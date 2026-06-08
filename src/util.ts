import {sha256File, sha256, stableStringify} from '@xgsd/artifact-sdk'
import chalk from 'chalk'
import {existsSync} from 'fs'
import {stat} from 'fs/promises'
import {relative} from 'path'

export class Secret {
  constructor(private readonly keytar: any) {}

  async get(key: string) {
    return this.keytar.getPassword('web-cli', key)
  }

  async exists(key: string) {
    return (await this.keytar.getPassword('web-cli', key)) !== undefined
  }

  async set(key: string, value: string) {
    await this.keytar.setPassword('web-cli', key, value)
  }

  async delete(key: string) {
    await this.keytar.deletePassword('web-cli', key)
  }
}

export async function runPool(items: any[], workerFn: any, concurrency: number = 8) {
  let index = 0

  async function worker(workerId: number) {
    while (true) {
      const i = index++

      if (i >= items.length) {
        return
      }

      await workerFn(items[i], workerId, i + 1)
    }
  }

  await Promise.all(Array.from({length: concurrency}, (_, i) => worker(i + 1)))
}

export async function checksumFiles(
  files: any[],
  cwd?: string,
): Promise<{path: string; checksum: string; size: number}[]> {
  return (
    await Promise.all(
      files.map(async (f) => {
        if (!existsSync(f)) return

        const checksum = await sha256File(f, 'utf-8')
        const size = (await stat(f)).size
        const path = cwd ? relative(cwd, f) : f

        return {
          path,
          checksum,
          size,
        }
      }),
    )
  )
    .sort((a, b) => a?.path.localeCompare(b?.path))
    .filter(Boolean) as any[]
}

export function version(checksums: {path: string; checksum: string; size: number}[]): string {
  return sha256(stableStringify(checksums), 'utf-8', 'base64url').slice(0, 16)
}

export function warn(message: string, action: string = 'WARN') {
  return `${chalk.yellow(action.toUpperCase().trim())} ${message.trim()}`
}

export function error(message: string, action: string = 'ERROR') {
  return `${chalk.red(action.toUpperCase().trim())} ${message.trim()}`
}

export function success(message: string, action: string = 'DONE') {
  return `${chalk.green(action.toUpperCase().trim())} ${message.trim()}`
}

export function info(message: string, action: string = 'INFO') {
  return `${chalk.blue(action.toUpperCase().trim())} ${message.trim()}`
}
