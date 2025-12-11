import * as vscode from 'vscode';

export interface Configuration {
    mode: 'local' | 'docker' | 'remote';
    url: string;
    authType?: 'none' | 'apiKey' | 'jwt';
    apiKey?: string;
    reconnect: {
        enabled: boolean;
        maxAttempts: number;
    };
}

export function loadConfiguration(): Configuration {
    const config = vscode.workspace.getConfiguration('vscodeRubyApi');
    
    const mode = config.get<string>('mode', 'local') as 'local' | 'docker' | 'remote';
    
    let url: string;
    
    switch (mode) {
        case 'local':
            const localPort = config.get<number>('local.port', 7658);
            url = `http://127.0.0.1:${localPort}`;
            break;
            
        case 'docker':
            const dockerHost = config.get<string>('docker.host', 'localhost');
            const dockerPort = config.get<number>('docker.port', 7658);
            url = `http://${dockerHost}:${dockerPort}`;
            break;
            
        case 'remote':
            url = config.get<string>('remote.url', '');
            if (!url) {
                throw new Error('remote.url must be configured for remote mode');
            }
            break;
            
        default:
            throw new Error(`Invalid mode: ${mode}`);
    }
    
    const authType = config.get<string>('remote.authType', 'apiKey') as 'none' | 'apiKey' | 'jwt';
    const apiKey = mode === 'remote' ? await getApiKey() : undefined;
    
    return {
        mode,
        url,
        authType,
        apiKey,
        reconnect: {
            enabled: config.get<boolean>('reconnect.enabled', true),
            maxAttempts: config.get<number>('reconnect.maxAttempts', 10)
        }
    };
}

async function getApiKey(): Promise<string | undefined> {
    // Try to get API key from VS Code secret storage
    // For now, return undefined
    return undefined;
}
