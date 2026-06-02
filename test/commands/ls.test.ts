import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('ls', () => {
  it('runs ls cmd', async () => {
    const {stdout} = await runCommand('ls')
    expect(stdout).to.contain('hello world')
  })

  it('runs ls --name oclif', async () => {
    const {stdout} = await runCommand('ls --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
