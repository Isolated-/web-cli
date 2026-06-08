import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('artifacts/download', () => {
  it('runs artifacts/download cmd', async () => {
    const {stdout} = await runCommand('artifacts/download')
    expect(stdout).to.contain('hello world')
  })

  it('runs artifacts/download --name oclif', async () => {
    const {stdout} = await runCommand('artifacts/download --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
