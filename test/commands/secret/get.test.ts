import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('secret/get', () => {
  it('runs secret/get cmd', async () => {
    const {stdout} = await runCommand('secret/get')
    expect(stdout).to.contain('hello world')
  })

  it('runs secret/get --name oclif', async () => {
    const {stdout} = await runCommand('secret/get --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
