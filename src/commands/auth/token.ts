import {Args, Command, Flags} from '@oclif/core'
import axios from 'axios'
import {BaseCommand} from '../../base.js'
import keytar from 'keytar'
import prettyMilliseconds from 'pretty-ms'
import ms from 'ms'
import {Secret, success, warn, error} from '../../util.js'

const MIN_TOKEN_TIME = 60 * 1000
const MAX_TOKEN_TIME = 365 * 24 * 60 * 60 * 1000

export default class AuthToken extends BaseCommand {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    ...BaseCommand.flags,

    expiry: Flags.string({
      char: 'x',
      default: '1d',
    }),

    permissions: Flags.string({
      char: 'p',
    }),

    type: Flags.string({
      char: 't',
      options: ['pat', 'actor'],
      default: 'pat',
    }),

    prefix: Flags.string({
      char: 'P',
      default: 'crwl',
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AuthToken)
    await this.initClient(flags)

    const permissions = flags.permissions?.split(',').map((p) => p.trim().toLocaleLowerCase()) ?? []

    if (permissions.length === 0) {
      this.error(`you must provide atleast 1 permission`)
    }

    const expiresIn = ms(flags.expiry as ms.StringValue)
    if (expiresIn < MIN_TOKEN_TIME || expiresIn > MAX_TOKEN_TIME) {
      this.error(`${flags.expiry} must be between ${ms(MIN_TOKEN_TIME)} and ${ms(MAX_TOKEN_TIME)}`)
    }

    const secret = new Secret(keytar)
    const accessToken = await secret.get('user:accessToken')
    const accessTokenExpiresAt = await secret.get('user:accessTokenExpiresAt')

    if (!accessToken || !accessTokenExpiresAt) {
      this.error(`you are not logged in, use "web auth login"`)
    }

    if (new Date() > new Date(accessTokenExpiresAt)) {
      this.error('your token has expired, use "web auth refresh"')
    }

    const url = `http://localhost:4200/tokens/create`
    const res = await axios.post(
      url,
      {
        type: flags.type,
        prefix: flags.prefix,
        permissions,
        expiresIn: ms(flags.expiry as ms.StringValue),
      },
      {headers: {Authorization: `Bearer ${accessToken}`}, validateStatus: () => true},
    )

    if (res.status >= 400) {
      this.error(`failed to obtain token`)
    }

    this.log(warn("your token won't be shown again"))

    const expiresAt = res.data.expiresAt
    const now = Date.now()
    const delta = expiresAt - now

    this.log(error(prettyMilliseconds(delta), 'EXPIRES'))

    this.log(success(res.data.accessToken, 'created'))
  }
}
