import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('secret/delete', () => {
  it('runs secret/delete cmd', async () => {
    const {stdout} = await runCommand('secret/delete')
    expect(stdout).to.contain('hello world')
  })

  it('runs secret/delete --name oclif', async () => {
    const {stdout} = await runCommand('secret/delete --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
