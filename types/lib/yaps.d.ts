interface Yaps {
    subscribe: (topic: string, func: (...args: any[]) => void) => string;
    unsubscribe: (token: string) => Yaps;
    publish: (topic: string, ...rest: any[]) => Yaps;
}
export declare const yaps: Yaps;
export default yaps;
//# sourceMappingURL=yaps.d.ts.map