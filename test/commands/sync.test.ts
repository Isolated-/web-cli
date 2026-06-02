import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('sync', () => {
  it('runs sync cmd', async () => {
    const {stdout} = await runCommand('sync')
    expect(stdout).to.contain('hello world')
  })

  it('runs sync --name oclif', async () => {
    const {stdout} = await runCommand('sync --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
