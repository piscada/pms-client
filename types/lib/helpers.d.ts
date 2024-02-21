/**
 * Compare major versions of two semantic version strings
 * @param {string} version1
 * @param {string} version2
 * @returns {boolean} - true if major versions are equal, false otherwise
 *
 * @example
 * const version1 = 'v1.2.3'
 * const version2 = 'v1.3.4'
 * console.log(compareMinorVersions(version1, version2)) // Output will be false
 */
export declare function compareMinorVersions(version1: string, version2: string): boolean;
export declare function getVersionPart(version: string, partIndex: number): string | null;
export declare function extractMajorMinorVersion(versionString: string): string;
//# sourceMappingURL=helpers.d.ts.map