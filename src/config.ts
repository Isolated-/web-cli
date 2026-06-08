import {existsSync, readFileSync, mkdirSync, writeFileSync} from 'fs'
import {dirname} from 'path'

function getByPath(obj: any, path: string): any {
  if (!path) return obj

  return path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined

    // support numeric indexes
    const k = /^\d+$/.test(key) ? Number(key) : key

    return acc?.[k]
  }, obj)
}

function setByPath(obj: any, path: string, value: any): void {
  const keys = path.split('.')

  let current = obj

  for (let i = 0; i < keys.length; i++) {
    const key = /^\d+$/.test(keys[i]) ? Number(keys[i]) : keys[i]

    const isLast = i === keys.length - 1

    if (isLast) {
      current[key] = value
      return
    }

    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = {}
    }

    current = current[key]
  }
}

function unsetByPath(obj: any, path: string): boolean {
  const keys = path.split('.')

  const stack: {obj: any; key: string | number}[] = []

  let current = obj

  for (let i = 0; i < keys.length; i++) {
    const rawKey = keys[i]
    const key = /^\d+$/.test(rawKey) ? Number(rawKey) : rawKey

    stack.push({obj: current, key})

    current = current?.[key]

    if (current == null && i !== keys.length - 1) {
      return false
    }
  }

  // delete target
  const last = stack.pop()
  if (!last) return false

  delete last.obj[last.key]

  for (let i = stack.length - 1; i >= 0; i--) {
    const {obj, key} = stack[i]
    const val = obj[key]

    if (val && typeof val === 'object' && Object.keys(val).length === 0) {
      delete obj[key]
    } else {
      break
    }
  }

  return true
}

export type ConfigType = {
  app: string
  username?: string
  auth?: {
    domain?: string
    clientId?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export class UserConfig {
  static exists(path: string): boolean {
    if (!path) return false

    return existsSync(path)
  }

  static new(partial?: Partial<ConfigType>): UserConfig {
    return new UserConfig({
      ...partial,
      app: partial?.app ?? 'web-cli',
      username: partial?.username,
      auth: {
        domain: partial?.auth?.domain,
        clientId: partial?.auth?.clientId,
      },
    })
  }

  static fromPath(path: string): UserConfig | null {
    if (!existsSync(path)) {
      throw new Error(`"${path}" does not exist`)
    }

    const content = readFileSync(path, 'utf-8')

    try {
      return new UserConfig(JSON.parse(content))
    } catch {
      throw new Error('cannot parse config/invalid data')
    }
  }

  private constructor(private _content: ConfigType) {}

  async save(path: string) {
    mkdirSync(dirname(path), {recursive: true})
    writeFileSync(path, JSON.stringify(this._content, null, 2))
  }

  get content() {
    return this._content
  }

  clone() {
    return structuredClone(this._content)
  }

  get<T = unknown>(key?: string, defaultValue?: T): T | null {
    if (!key) return this._content as T

    const value = key.split('.').reduce((acc: any, part) => {
      if (acc == null) return undefined
      return acc[part]
    }, this._content)

    return (value as T) ?? defaultValue ?? null
  }

  exists(key?: string): boolean {
    if (!key) return false

    return getByPath(this._content, key) !== undefined
  }

  set<T = unknown>(key: string, data: T): void {
    if (!key) {
      throw new Error('config key is required')
    }

    setByPath(this._content, key, data)
  }

  unset(key: string): void {
    if (!key) {
      throw new Error('config key is required')
    }

    unsetByPath(this._content, key)
  }
}
