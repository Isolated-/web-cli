import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('tools/checksum', () => {
  it('runs tools/checksum cmd', async () => {
    const {stdout} = await runCommand('tools/checksum')
    expect(stdout).to.contain('hello world')
  })

  it('runs tools/checksum --name oclif', async () => {
    const {stdout} = await runCommand('tools/checksum --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
