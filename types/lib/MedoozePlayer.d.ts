import MediaServerClient from './MediaServerClient';
import TransactionManager from 'transaction-manager';
import PeerConnectionClient from './PeerConnectionClient';
interface PlayerConfig {
    id: string;
    pms: {
        ws: WebSocket;
        tm: any;
    };
    instanceID: string;
    panelNumber?: number;
    onReconnect?: Function;
}
export default class MedoozePlayer {
    id: string;
    onReconnect?: Function;
    instanceID: string;
    panelNumber: number;
    pcc: PeerConnectionClient;
    ws: WebSocket;
    tm: TransactionManager;
    viewerId: string | null;
    client: MediaServerClient;
    streamPromise: Promise<MediaStream | null>;
    stream: MediaStream | null;
    reconnect: () => void;
    constructor(config: PlayerConfig);
    createPlayer(config: PlayerConfig): void;
    createPeerConnection(cli: MediaServerClient, resolve: Function, camId: string): Promise<PeerConnectionClient>;
    stop(): void;
    reConnectListener(): void;
}
export {};
//# sourceMappingURL=MedoozePlayer.d.ts.map