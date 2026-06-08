import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('config/init', () => {
  it('runs config/init cmd', async () => {
    const {stdout} = await runCommand('config/init')
    expect(stdout).to.contain('hello world')
  })

  it('runs config/init --name oclif', async () => {
    const {stdout} = await runCommand('config/init --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
