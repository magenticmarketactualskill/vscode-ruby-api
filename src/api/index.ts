import * as vscode from 'vscode';
import { JSONRPCClient } from '../client/jsonrpc';

export class VSCodeAPIProxy implements vscode.Disposable {
    private client: JSONRPCClient;
    private context: vscode.ExtensionContext;
    private disposables: vscode.Disposable[] = [];

    constructor(client: JSONRPCClient, context: vscode.ExtensionContext) {
        this.client = client;
        this.context = context;

        this.registerHandlers();
    }

    private registerHandlers(): void {
        // Register handler for window.showInformationMessage
        this.client.onNotification(async (method, params) => {
            if (method === 'window.showInformationMessage') {
                await this.handleShowInformationMessage(params);
            } else if (method === 'window.showWarningMessage') {
                await this.handleShowWarningMessage(params);
            } else if (method === 'window.showErrorMessage') {
                await this.handleShowErrorMessage(params);
            }
        });

        // Listen for document save events
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument((document) => {
                this.client.notify('event.workspace.didSaveTextDocument', {
                    document: {
                        uri: document.uri.toString(),
                        languageId: document.languageId,
                        version: document.version
                    }
                });
            })
        );

        // Listen for document open events
        this.disposables.push(
            vscode.workspace.onDidOpenTextDocument((document) => {
                this.client.notify('event.workspace.didOpenTextDocument', {
                    document: {
                        uri: document.uri.toString(),
                        languageId: document.languageId,
                        version: document.version
                    }
                });
            })
        );

        // Listen for selection change events
        this.disposables.push(
            vscode.window.onDidChangeTextEditorSelection((event) => {
                this.client.notify('event.window.onDidChangeTextEditorSelection', {
                    textEditor: {
                        document: {
                            uri: event.textEditor.document.uri.toString()
                        }
                    },
                    selections: event.selections.map(s => ({
                        start: { line: s.start.line, character: s.start.character },
                        end: { line: s.end.line, character: s.end.character }
                    }))
                });
            })
        );
    }

    private async handleShowInformationMessage(params: any): Promise<void> {
        const message = params.message;
        const items = params.items || [];
        
        const result = await vscode.window.showInformationMessage(message, ...items);
        
        // Send result back to Ruby (if this was a request, not a notification)
        // For now, we're treating these as notifications
    }

    private async handleShowWarningMessage(params: any): Promise<void> {
        const message = params.message;
        const items = params.items || [];
        
        await vscode.window.showWarningMessage(message, ...items);
    }

    private async handleShowErrorMessage(params: any): Promise<void> {
        const message = params.message;
        const items = params.items || [];
        
        await vscode.window.showErrorMessage(message, ...items);
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
