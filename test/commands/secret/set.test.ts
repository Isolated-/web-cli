import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('secret/set', () => {
  it('runs secret/set cmd', async () => {
    const {stdout} = await runCommand('secret/set')
    expect(stdout).to.contain('hello world')
  })

  it('runs secret/set --name oclif', async () => {
    const {stdout} = await runCommand('secret/set --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
