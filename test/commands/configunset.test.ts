import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('configunset', () => {
  it('runs configunset cmd', async () => {
    const {stdout} = await runCommand('configunset')
    expect(stdout).to.contain('hello world')
  })

  it('runs configunset --name oclif', async () => {
    const {stdout} = await runCommand('configunset --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
