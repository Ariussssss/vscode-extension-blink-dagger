import { resolve } from 'dns'
import { homedir } from 'os'
import {
  Uri,
  window,
  Disposable,
  commands,
  ExtensionContext,
  QuickPickItem,
  workspace,
  QuickPick,
} from 'vscode'
import { BlinkDaggerConfig } from './model'
import { ensurePath, isDir } from './utils'
const cp = require('child_process')

const quickPick = async ({
  title,
  initalItems = [],
  onChange,
  onDone,
}: {
  title: string
  initalItems: Array<string>
  onChange?: (value: string, input: QuickPick<QuickPickItem>) => void
  onDone?: (value: string) => void
}) => {
  const disposables: Disposable[] = []
  try {
    return await new Promise((resolve) => {
      const input = window.createQuickPick<QuickPickItem>()
      input.items = initalItems.map((label) => ({ label }))
      input.placeholder = 'Type to search for files'
      if (onChange)
        disposables.push(
          input.onDidChangeValue((value: string) => onChange(value, input))
        )
      disposables.push(
        input.onDidChangeSelection((items) => {
          const item = items[0]
          if (item) {
            onDone?.(item.label)
            resolve()
            input.hide()

            input.dispose()
          }
        }),
        input.onDidHide(() => {
          resolve()
          input.dispose()
        })
      )
      input.show()
    })
  } finally {
    disposables.forEach((d) => d.dispose())
  }
}

// export async function fetch() {
//   const config = workspace.getConfiguration('conf.blinkDagger');
//   quickPick('Search repo from Github', (value, input) => {})
// }

const getFileMap = () =>
  new Promise((resolve) => {
    const config = workspace.getConfiguration('conf.blinkDagger')
    const { rootDir: baseRootDir, useNamespace } = config as any
    let rootDir = baseRootDir.endsWith('/') ? baseRootDir : `${baseRootDir}/`
    rootDir = rootDir.replace('~', homedir)
    ensurePath(rootDir)
    const projectScheme = [rootDir, useNamespace ? '*/*/' : '*/'].join('')
    cp.exec(`ls -d ${projectScheme}`, {}, (err: Error, stdout: string) => {
      const fileMap: { [key: string]: Uri } = Object.fromEntries(
        stdout
          .split('\n')
          .filter((e: string) => isDir(`${e}/.git`))
          .map((repo: string) => {
            const repoArr = repo.split('/').filter(Boolean)
            const key = useNamespace
              ? repoArr.slice(repoArr.length - 2, repoArr.length).join('/')
              : repoArr[repoArr.length - 1]
            return [key, Uri.file(repo)]
          })
      )
      resolve(fileMap)
    })
  })

export const open = async () => {
  const fileMap = await getFileMap()
  quickPick({
    title: 'Open local workspace',
    initalItems: Object.keys(fileMap),
    onDone(value) {
      const uri = fileMap[value]
      if (uri) {
        commands.executeCommand('vscode.openFolder', uri, {
          forceNewWindow: Boolean(workspace.getConfiguration(
            'conf.blinkDagger.useNewWindow'
          )),
        })
      }
    },
  })
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand('blinkDagger.open', open))
}

export function deactivate() {}
