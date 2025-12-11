import * as vscode from 'vscode';
import { JSONRPCClient } from './client/jsonrpc';
import { VSCodeAPIProxy } from './api';
import { loadConfiguration, Configuration } from './config';

let client: JSONRPCClient | undefined;
let apiProxy: VSCodeAPIProxy | undefined;
let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
    console.log('VS Code Ruby API extension is now active');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(plug) Ruby API: Connecting...";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Load configuration
    const config = loadConfiguration();

    // Create and connect client
    try {
        client = new JSONRPCClient(config);
        await client.connect();

        // Create API proxy
        apiProxy = new VSCodeAPIProxy(client, context);
        
        // Update status
        statusBarItem.text = "$(check) Ruby API: Connected";
        statusBarItem.tooltip = `Connected to ${config.mode} mode`;

        console.log('Successfully connected to Ruby server');
    } catch (error) {
        console.error('Failed to connect to Ruby server:', error);
        statusBarItem.text = "$(x) Ruby API: Disconnected";
        statusBarItem.tooltip = `Failed to connect: ${error}`;
        
        // Show error message
        vscode.window.showErrorMessage(
            `Failed to connect to Ruby API server: ${error}. Make sure the Ruby server is running.`
        );
    }

    // Watch for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async (e) => {
            if (e.affectsConfiguration('vscodeRubyApi')) {
                console.log('Configuration changed, reconnecting...');
                await reconnect(context);
            }
        })
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('vscodeRubyApi.reconnect', async () => {
            await reconnect(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscodeRubyApi.disconnect', () => {
            disconnect();
        })
    );
}

export function deactivate() {
    disconnect();
}

async function reconnect(context: vscode.ExtensionContext) {
    disconnect();
    
    statusBarItem.text = "$(sync~spin) Ruby API: Reconnecting...";
    
    const config = loadConfiguration();
    
    try {
        client = new JSONRPCClient(config);
        await client.connect();
        
        apiProxy = new VSCodeAPIProxy(client, context);
        
        statusBarItem.text = "$(check) Ruby API: Connected";
        statusBarItem.tooltip = `Connected to ${config.mode} mode`;
        
        vscode.window.showInformationMessage('Successfully reconnected to Ruby API server');
    } catch (error) {
        console.error('Failed to reconnect:', error);
        statusBarItem.text = "$(x) Ruby API: Disconnected";
        statusBarItem.tooltip = `Failed to connect: ${error}`;
        
        vscode.window.showErrorMessage(`Failed to reconnect: ${error}`);
    }
}

function disconnect() {
    if (apiProxy) {
        apiProxy.dispose();
        apiProxy = undefined;
    }
    
    if (client) {
        client.disconnect();
        client = undefined;
    }
    
    statusBarItem.text = "$(x) Ruby API: Disconnected";
}
