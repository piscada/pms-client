export default class MedoozePlayer {
    constructor(config: any);
    createPlayer(config: any): void;
    id: any;
    onReconnect: any;
    instanceID: any;
    panelNumber: any;
    pc: any;
    ws: any;
    tm: any;
    viewerId: any;
    stop(): void;
    client: MediaServerClient;
    reconnect: () => void;
    streamPromise: Promise<any>;
    createPeerConnection(cli: any, resolve: any): Promise<any>;
    stream: MediaStream;
    reConnectListener(): void;
}
import MediaServerClient from "./MediaServerClient";
//# sourceMappingURL=MedoozePlayer.d.ts.map