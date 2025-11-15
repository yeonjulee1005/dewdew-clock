import * as vscode from 'vscode';
import { ClockViewProvider } from './clockViewProvider';

console.log('🔥 DewDew Clock: Module loaded!');

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 DewDew Clock: Extension is now active!');

  // Clock View Provider 등록
  const provider = new ClockViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ClockViewProvider.viewType,
      provider
    )
  );
}

export function deactivate() {}
