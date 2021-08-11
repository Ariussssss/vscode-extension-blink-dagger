import { commands, ExtensionContext } from 'vscode'
import { open, fetch } from './commands'

export function activate(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand('blinkDagger.open', open))
  context.subscriptions.push(
    commands.registerCommand('blinkDagger.fetch', fetch)
  )
}

export function deactivate() {}
