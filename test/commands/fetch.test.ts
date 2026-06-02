import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('fetch', () => {
  it('runs fetch cmd', async () => {
    const {stdout} = await runCommand('fetch')
    expect(stdout).to.contain('hello world')
  })

  it('runs fetch --name oclif', async () => {
    const {stdout} = await runCommand('fetch --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
