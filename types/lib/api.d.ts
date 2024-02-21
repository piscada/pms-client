export interface PmsCameraItem {
    id: string;
    type: string;
    url: string;
    state: string;
    viewers: number;
    recordings: number;
    stats: null;
    ports: null;
    remoteAddress: null;
}
export declare const fetchAllCamerasWithInstances: (api: string, token: string) => Promise<PmsCameraItem[]>;
//# sourceMappingURL=api.d.ts.map