import PeerConnectionClient from './PeerConnectionClient.js';
import TransactionManager from 'transaction-manager';
interface Options {
    sdpSemantics?: string;
    strictW3C?: boolean;
    forceSDPMunging?: boolean;
}
export default class MediaServerClient {
    tm: TransactionManager;
    ns: any;
    constructor(tm: TransactionManager);
    createManagedPeerConnection(options?: Options): Promise<PeerConnectionClient>;
    stop(): void;
}
export {};
//# sourceMappingURL=MediaServerClient.d.ts.map