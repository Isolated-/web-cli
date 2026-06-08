import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('config/unset', () => {
  it('runs config/unset cmd', async () => {
    const {stdout} = await runCommand('config/unset')
    expect(stdout).to.contain('hello world')
  })

  it('runs config/unset --name oclif', async () => {
    const {stdout} = await runCommand('config/unset --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
