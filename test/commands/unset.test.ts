import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('unset', () => {
  it('runs unset cmd', async () => {
    const {stdout} = await runCommand('unset')
    expect(stdout).to.contain('hello world')
  })

  it('runs unset --name oclif', async () => {
    const {stdout} = await runCommand('unset --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
