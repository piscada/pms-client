import TransactionManager from 'transaction-manager';
interface PMSConnectorSettings {
    host: string;
    httpOnly?: boolean;
    token: string;
    port?: number;
    isCloudServer: boolean;
    retries?: number;
    isReconnecting?: boolean;
}
interface ClientInfo {
    buildDate: string;
    version: string;
}
export declare class PMSConnector {
    settings: PMSConnectorSettings;
    host: string;
    httpOnly: boolean;
    token: string;
    port: number;
    isCloudServer: boolean;
    url: string;
    api: string;
    isReconnecting?: boolean;
    clientInfo: ClientInfo;
    requiredVersion: string;
    compatible: boolean | null;
    ws: WebSocket | null;
    tm: TransactionManager | null;
    cameraList: Promise<any>;
    constructor(settings: PMSConnectorSettings);
    serverConnect(settings: PMSConnectorSettings): void;
    createWebSocket(): Promise<any>;
    checkBuildVersion(): Promise<boolean>;
    fetchCamList(): Promise<any>;
    reconnectWebSocket(settings: PMSConnectorSettings): void;
}
export default function MedoozeConnector(settings: PMSConnectorSettings): Promise<PMSConnector>;
export {};
//# sourceMappingURL=MedoozeConnector.d.ts.map