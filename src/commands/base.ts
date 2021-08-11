import {
  commands,
  ConfigurationTarget,
  Disposable,
  QuickPick,
  QuickPickItem,
  Uri,
  window,
  workspace,
} from 'vscode'
import {
  ensurePath,
  ifDirExist,
  homedir,
  runShellASync,
} from '../utils'

export const quickPick = async ({
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
    return await new Promise<void>((resolve) => {
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
            resolve()
            input.hide()
            input.dispose()
            onDone?.(item.label)
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

export const log = (k: string, e: unknown) => {
  window.showInformationMessage(`Blink Dagger ${k}: ${JSON.stringify(e)}`)
}

export const getToken = () => {
  const config = workspace.getConfiguration()
  return config.get('conf.blinkDagger.privateToken')
}

export const getRepoPath = (name: string) => {
  const { rootDir, useNamespace = true } = workspace.getConfiguration(
    'conf.blinkDagger'
  ) as any

  return useNamespace
    ? [rootDir, name]
        .map((e) => (e.endsWith('/') ? e.slice(0, e.length - 1) : e))
        .join('/')
        .replace('~', homedir)
    : name.split('/')?.[1] ?? name
}

export const checkIfRepoExist = (name: string) => {
  const targetPath = getRepoPath(name)
  return ifDirExist(targetPath) ? targetPath : false
}

export const redirect = (targetPath: string) => {
  commands.executeCommand('vscode.openFolder', Uri.file(targetPath), {
    forceNewWindow: Boolean(
      workspace.getConfiguration('conf.blinkDagger.useNewWindow')
    ),
  })
}

export const fetchIfNotExit = async (value?: string) => {
  if (!value) return
  const config = workspace.getConfiguration()
  const targetPath = getRepoPath(value)
  if (!ifDirExist(`${targetPath}/.git`)) {
    const token = getToken()
    const link = token
      ? `git@github.com:${value}.git`
      : `https://github.com/${value}.git`
    ensurePath(targetPath)
    log('Loading for', value)
    runShellASync(`cd ${targetPath} && git clone ${link} .`, () => {
      redirect(targetPath)
    })
  } else {
    redirect(targetPath)
  }
}
