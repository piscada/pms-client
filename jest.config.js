module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  injectGlobals: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}
