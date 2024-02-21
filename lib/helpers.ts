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

export function compareMinorVersions(
  version1: string,
  version2: string
): boolean {
  // Extracting minor versions from the version strings
  const minorVersion1 = getVersionPart(version1, 1)
  const minorVersion2 = getVersionPart(version2, 1)

  // Comparing minor versions
  return minorVersion1 === minorVersion2
}

// Helper function to extract a specific part of the version string
export function getVersionPart(
  version: string,
  partIndex: number
): string | null {
  const parts = version.split('.')
  if (parts.length > partIndex) {
    return parts[partIndex]
  } else {
    return null
  }
}

export function extractMajorMinorVersion(versionString: string): string {
  // Split the version string by dot delimiter
  let parts = versionString.split('.')

  // Extract the major and minor versions
  let majorVersion = parts[0]
  let minorVersion = parts[1]

  // Return an object containing the major and minor versions
  return 'v' + majorVersion + '.' + minorVersion
}
