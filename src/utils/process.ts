import cp from 'child_process'

export const runShellSync = (cmd: string, options = {}) =>
  cp.execSync(cmd, options)?.toString()?.trim()

export const runShellASync = (cmd: string, options = {}, callback = () => {}) =>
  cp.exec(cmd, options, callback)
