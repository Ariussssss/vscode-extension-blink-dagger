import { workspace } from 'vscode'
import cp from 'child_process'
import { ensurePath, isDir, homedir } from '../utils'
import { log, quickPick, redirect } from './base'

const getFileMap = () =>
  new Promise<{ [key: string]: string }>((resolve) => {
    const config = workspace.getConfiguration('conf.blinkDagger')
    const { rootDir: baseRootDir, useNamespace } = config as any
    let rootDir = baseRootDir.endsWith('/')
      ? baseRootDir.slice(0, baseRootDir.length - 1)
      : baseRootDir
    rootDir = rootDir.replace('~', homedir)
    ensurePath(rootDir)

    cp.exec(
      `find ${rootDir} -type d -name '.git' -maxdepth 4`,
      {},
      (err, stdout: string) => {
        console.info('stdout', stdout)

        const fileMap: { [key: string]: string } = Object.fromEntries(
          stdout.split('\n').map((repo: string) => {
            const target = repo.replace('/.git', '')
            const key = repo.replace(`${rootDir}/`, '').replace('/.git', '')
            return [key, target]
          })
        )
        resolve(fileMap)
      }
    )
  })

export const open = async () => {
  try {
    const fileMap = await getFileMap()
    console.info('fileMap', fileMap)

    await quickPick({
      title: 'Open local workspace',
      initalItems: Object.keys(fileMap),
      onDone(value) {
        const uri = fileMap[value]
        if (uri) {
          redirect(uri)
        }
      },
    })
  } catch (e) {
    log('Open Error:', e)
  }
}
