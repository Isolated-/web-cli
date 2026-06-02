import {Args, Command, Flags} from '@oclif/core'
import {ArtifactStorage} from '@xgsd/artifact-sdk'
import {readFile} from 'fs/promises'
import {join} from 'path'

type ArtifactItem = {
  key: string
  kind?: string
  category?: string
  type?: string
  size?: number
  modified?: string
  path?: string | null
}

export default class Ls extends Command {
  static override args = {
    category: Args.string(),
  }

  static override flags = {
    cwd: Flags.string({
      char: 'c',
      default: process.cwd(),
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

    kind: Flags.string(),
    category: Flags.string(),
    type: Flags.string(),

    tree: Flags.boolean({
      description: 'group output by category',
      default: false,
    }),

    missing: Flags.boolean({
      description: 'show only missing local artifacts',
      default: false,
    }),
  }

  async loadLocalIndex(path: string) {
    return JSON.parse(await readFile(path, 'utf-8'))
  }

  private filterItem(item: ArtifactItem, flags: any, argCategory?: string) {
    if (argCategory && item.category !== argCategory) return false
    if (flags.category && item.category !== flags.category) return false
    if (flags.kind && item.kind !== flags.kind) return false
    if (flags.type && item.type !== flags.type) return false
    if (flags.missing && item.path) return false

    return true
  }

  private printFlat(items: ArtifactItem[]) {
    for (const item of items) {
      const size = item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'unknown'

      this.log(`${item.key}`)
      this.log(`  ${item.kind}/${item.category}/${item.type} • ${size}`)

      if (item.path) this.log(`  local: ${item.path}`)
      if (item.modified) this.log(`  modified: ${item.modified}`)
      this.log('')
    }

    this.log(`Total: ${items.length}`)
  }

  private printTree(items: ArtifactItem[]) {
    const tree = new Map<string, ArtifactItem[]>()

    for (const item of items) {
      const group = item.category ?? 'unknown'

      if (!tree.has(group)) {
        tree.set(group, [])
      }

      tree.get(group)!.push(item)
    }

    for (const [group, groupItems] of tree) {
      this.log(`\n${group}/`)

      for (const item of groupItems) {
        const missing = item.path ? '' : ' (missing)'
        this.log(`  - ${item.key}${missing}`)
      }
    }

    this.log(`\nTotal: ${items.length}`)
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Ls)

    const artifact = new ArtifactStorage(flags.signUrl, flags.signToken)

    const raw = await this.loadLocalIndex(join(flags.cwd, 'artifacts.index.json'))

    const index = artifact.toLocalIndex(flags.cwd, raw)

    const items = index.query((a: any) => this.filterItem(a, flags, args.category))

    if (!items.length) {
      this.log('No artifacts found')
      return
    }

    if (flags.tree) {
      this.printTree(items as any)
    } else {
      this.printFlat(items as any)
    }
  }
}
