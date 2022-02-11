export default function MedoozeConnector(settings: any): Promise<PMSConnector>;
export class PMSConnector {
    constructor(settings: any);
    serverConnect(settings: any): void;
    settings: any;
    host: any;
    httpOnly: any;
    token: any;
    port: any;
    isCloudServer: any;
    url: string;
    api: string;
    isReconnecting: any;
    cameraList: any;
    createWebSocket(): any;
    ws: WebSocket;
    tm: any;
    fetchCamList(): Promise<any>;
    reconnectWebSocket(settings: any): void;
}
//# sourceMappingURL=MedoozeConnector.d.ts.map