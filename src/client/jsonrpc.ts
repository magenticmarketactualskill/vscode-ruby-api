import axios, { AxiosInstance } from 'axios';
import { Configuration } from '../config';

export interface JSONRPCRequest {
    jsonrpc: '2.0';
    method: string;
    params: any;
    id: number | string;
}

export interface JSONRPCResponse {
    jsonrpc: '2.0';
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: number | string;
}

export interface JSONRPCNotification {
    jsonrpc: '2.0';
    method: string;
    params: any;
}

type NotificationHandler = (method: string, params: any) => void;

export class JSONRPCClient {
    private config: Configuration;
    private http: AxiosInstance;
    private requestId: number = 0;
    private notificationHandlers: NotificationHandler[] = [];
    private connected: boolean = false;

    constructor(config: Configuration) {
        this.config = config;
        
        this.http = axios.create({
            baseURL: config.url,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add auth header if needed
        if (config.authType === 'apiKey' && config.apiKey) {
            this.http.defaults.headers.common['Authorization'] = `Bearer ${config.apiKey}`;
        }
    }

    async connect(): Promise<void> {
        // Test connection with a ping
        try {
            await this.call('ping', {});
            this.connected = true;
            console.log('Connected to Ruby server at', this.config.url);
        } catch (error) {
            // If ping fails, still mark as connected and let individual calls fail
            // This allows the extension to work even if the server doesn't implement ping
            this.connected = true;
            console.log('Connected to Ruby server at', this.config.url, '(ping not supported)');
        }
    }

    disconnect(): void {
        this.connected = false;
        console.log('Disconnected from Ruby server');
    }

    isConnected(): boolean {
        return this.connected;
    }

    async call(method: string, params: any): Promise<any> {
        if (!this.connected) {
            throw new Error('Not connected to Ruby server');
        }

        this.requestId++;

        const request: JSONRPCRequest = {
            jsonrpc: '2.0',
            method,
            params: this.addContext(params),
            id: this.requestId
        };

        console.log('Sending JSON-RPC request:', method);

        try {
            const response = await this.http.post('/', request);
            const data: JSONRPCResponse = response.data;

            if (data.error) {
                throw new Error(`JSON-RPC error: ${data.error.message} (code: ${data.error.code})`);
            }

            return data.result;
        } catch (error: any) {
            if (error.response) {
                throw new Error(`HTTP error: ${error.response.status} ${error.response.statusText}`);
            } else if (error.request) {
                throw new Error('No response from Ruby server. Is it running?');
            } else {
                throw error;
            }
        }
    }

    async notify(method: string, params: any): Promise<void> {
        if (!this.connected) {
            return;
        }

        const notification: JSONRPCNotification = {
            jsonrpc: '2.0',
            method,
            params: this.addContext(params)
        };

        try {
            await this.http.post('/', notification);
        } catch (error) {
            console.error('Failed to send notification:', error);
        }
    }

    onNotification(handler: NotificationHandler): void {
        this.notificationHandlers.push(handler);
    }

    private addContext(params: any): any {
        if (typeof params !== 'object' || params === null) {
            return params;
        }

        return {
            '@context': {
                '@vocab': 'https://vscode-api.org/vocab#'
            },
            ...params
        };
    }
}
