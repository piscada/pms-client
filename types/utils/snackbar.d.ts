export namespace snack {
    function info(msg: any, timeout?: number): void;
    function info(msg: any, timeout?: number): void;
    function success(msg: any, timeout?: number): void;
    function success(msg: any, timeout?: number): void;
    function warning(msg: any, timeout?: number): void;
    function warning(msg: any, timeout?: number): void;
    function error(msg: any, timeout?: number): void;
    function error(msg: any, timeout?: number): void;
}
export default snackbar;
/**
 * Snackbar which can be imported anywhere
 * @param {string} msg  - Message to display
 * @param {string} type - info, warning, error, success
 * @param {number} timeout - how long to suspend snackbar
 */
declare function snackbar(msg: string, type?: string, timeout?: number): void;
//# sourceMappingURL=snackbar.d.ts.map