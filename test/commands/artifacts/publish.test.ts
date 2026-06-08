import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('artifacts/publish', () => {
  it('runs artifacts/publish cmd', async () => {
    const {stdout} = await runCommand('artifacts/publish')
    expect(stdout).to.contain('hello world')
  })

  it('runs artifacts/publish --name oclif', async () => {
    const {stdout} = await runCommand('artifacts/publish --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
