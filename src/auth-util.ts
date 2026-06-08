import axios, {Axios, AxiosResponse} from 'axios'
import {UserConfig} from './config.js'
import {Secret} from './util.js'
import keytar from 'keytar'

type AuthResponse = {
  accessToken: string
  expiresAt: number
}

export class AuthService {
  private readonly secret: Secret
  private readonly axios: Axios

  constructor(private readonly config: UserConfig) {
    this.secret = new Secret(keytar)
    this.axios = axios
  }

  get accessTokenKey(): string {
    return 'user:accessToken'
  }

  get accessTokenExpiresAtKey(): string {
    return 'user:accessTokenExpiresAt'
  }

  get refreshTokenKey(): string {
    return 'user:refreshToken'
  }

  get clientSecretKey(): string {
    return 'user:clientSecret'
  }

  get authConfig(): {username: string; domain: string; clientId: string; audience: string} {
    const auth = this.config.get<any>('auth')
    const username = this.config.get<string>('username')

    if (!username) {
      throw new Error('config missing username')
    }

    if (!auth.domain || !auth.clientId) {
      throw new Error('config missing domain/clientId')
    }

    return {
      username,
      domain: auth.domain,
      clientId: auth.clientId,
      audience: auth.audience ?? 'web-analysis.xgsd.internal',
    }
  }

  // auth0
  async loginUsernamePassword(password: string, opts?: {scopes?: string[]; returnType?: 'minimal' | 'accessToken'}) {
    const {username, domain, clientId, audience} = this.authConfig

    const requiredScopes = ['offline_access']
    const scope = [...(opts?.scopes ?? []), ...requiredScopes].map((s) => s.toLowerCase().trim()).join(',')

    const url = `https://${domain}/oauth/token`
    const res = await axios.post(
      url,
      {
        username,
        password,
        client_id: clientId,
        scope,
        grant_type: 'password',
        audience,
      },
      {validateStatus: () => true},
    )

    const data = this.validateAuthResponse<{access_token: string; expires_in: number; refresh_token?: string}>(res)

    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()

    await this.secret.set(this.accessTokenKey, data.access_token)
    await this.secret.set(this.accessTokenExpiresAtKey, expiresAt)

    if (data.refresh_token) {
      await this.secret.set(this.refreshTokenKey, data.refresh_token)
    }

    if (opts?.returnType === 'accessToken') {
      return {accessToken: data.access_token, expiresAt}
    }

    return {expiresAt}
  }

  async loginRefreshToken(opts?: {returnType?: 'minimal' | 'accessToken'; scopes?: string[]}) {
    const {domain, clientId, audience, username} = this.authConfig

    if (!(await this.secret.exists(this.refreshTokenKey))) {
      throw new Error('refresh token not found')
    }

    const scope = (opts?.scopes ?? []).map((s) => s.toLowerCase().trim()).join(',')

    const refreshToken = await this.secret.get(this.refreshTokenKey)!
    const url = `https://${this.authConfig.domain}/oauth/token`
    const res = await this.axios.post(url, {
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      audience,
      scope,
    })

    const data = this.validateAuthResponse<{access_token: string; expires_in: number; refresh_token?: string}>(res)

    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
    await this.secret.set(this.accessTokenKey, data.access_token)
    await this.secret.set(this.accessTokenExpiresAtKey, expiresAt)

    if (opts?.returnType === 'accessToken') {
      return {accessToken: data.access_token, expiresAt}
    }

    return {expiresAt}
  }

  async logout() {
    const url = `https://${this.authConfig.domain}/logout`
    const http = await this.createHttpClient()

    await http.post(url)

    await Promise.all([
      this.secret.delete(this.accessTokenKey),
      this.secret.delete(this.accessTokenExpiresAtKey),
      this.secret.delete(this.refreshTokenKey),
    ])
  }

  private validateAuthResponse<T = unknown>(
    response: AxiosResponse,
    opts?: {isLoginAttempt?: boolean; isTokenCreation?: boolean},
  ): T {
    if (response.status === 401) {
      throw new Error('invalid client credentials')
    }

    if (response.status === 403) {
      throw new Error('bad permissions or credentials')
    }

    if (response.status === 404) {
      throw new Error('bad server config')
    }

    if (response.status >= 400) {
      throw new Error(`unknown http-${response.status}`)
    }

    return response.data as T
  }

  async createHttpClient(type?: 'id' | 'pat'): Promise<Axios> {
    const accessToken = await this.secret.get(this.accessTokenKey)
    const accessTokenExpiresAt = await this.secret.get(this.accessTokenExpiresAtKey)

    if (!accessToken || !accessTokenExpiresAt) {
      throw new Error('not authenticated')
    }

    return axios.create({
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  async getAccessToken() {
    const accessToken = await this.secret.get(this.accessTokenKey)
    const accessTokenExpiresAt = await this.secret.get(this.accessTokenExpiresAtKey)

    if (!accessToken || !accessTokenExpiresAt) {
      throw new Error('not authenticated')
    }

    return {
      accessToken,
      accessTokenExpiresAt,
    }
  }

  // pats/service tokens/actor tokens
  async createPersonalAccessToken() {}
}
