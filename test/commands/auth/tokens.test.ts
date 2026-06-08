import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('auth/tokens', () => {
  it('runs auth/tokens cmd', async () => {
    const {stdout} = await runCommand('auth/tokens')
    expect(stdout).to.contain('hello world')
  })

  it('runs auth/tokens --name oclif', async () => {
    const {stdout} = await runCommand('auth/tokens --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
