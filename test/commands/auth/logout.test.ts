import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('auth/logout', () => {
  it('runs auth/logout cmd', async () => {
    const {stdout} = await runCommand('auth/logout')
    expect(stdout).to.contain('hello world')
  })

  it('runs auth/logout --name oclif', async () => {
    const {stdout} = await runCommand('auth/logout --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
