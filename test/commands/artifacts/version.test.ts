import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('artifacts/version', () => {
  it('runs artifacts/version cmd', async () => {
    const {stdout} = await runCommand('artifacts/version')
    expect(stdout).to.contain('hello world')
  })

  it('runs artifacts/version --name oclif', async () => {
    const {stdout} = await runCommand('artifacts/version --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
