import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('artifacts', () => {
  it('runs artifacts cmd', async () => {
    const {stdout} = await runCommand('artifacts')
    expect(stdout).to.contain('hello world')
  })

  it('runs artifacts --name oclif', async () => {
    const {stdout} = await runCommand('artifacts --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
