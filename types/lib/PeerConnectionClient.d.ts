export default class PeerConnectionClient {
    constructor(params: any);
    id: any;
    ns: any;
    pc: any;
    remote: any;
    localInfo: any;
    remoteInfo: any;
    streams: {};
    strictW3C: any;
    forceSDPMunging: any;
    forceRenegotiation: any;
    pending: any;
    processing: any;
    renegotiating: boolean;
    adding: any;
    removing: any;
    ontrack: (event: any) => void;
    ontrackended: (event: any) => void;
    onstatsended: (event: any) => void;
    renegotiate(): Promise<void>;
    getStats(selector: any): any;
    addTrack(track: any, stream: any, params: any): Promise<any>;
    removeTrack(sender: any): void;
    close(): void;
}
//# sourceMappingURL=PeerConnectionClient.d.ts.map