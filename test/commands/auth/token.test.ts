import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('auth/token', () => {
  it('runs auth/token cmd', async () => {
    const {stdout} = await runCommand('auth/token')
    expect(stdout).to.contain('hello world')
  })

  it('runs auth/token --name oclif', async () => {
    const {stdout} = await runCommand('auth/token --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
