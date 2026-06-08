import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('auth/login', () => {
  it('runs auth/login cmd', async () => {
    const {stdout} = await runCommand('auth/login')
    expect(stdout).to.contain('hello world')
  })

  it('runs auth/login --name oclif', async () => {
    const {stdout} = await runCommand('auth/login --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
