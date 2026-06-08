import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('auth/refresh', () => {
  it('runs auth/refresh cmd', async () => {
    const {stdout} = await runCommand('auth/refresh')
    expect(stdout).to.contain('hello world')
  })

  it('runs auth/refresh --name oclif', async () => {
    const {stdout} = await runCommand('auth/refresh --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
