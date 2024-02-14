const { test, expect } = require('@playwright/test')
const { MedoozeConnector, MedoozePlayer } = require('../../index.js')
Object.assign(global, { WebSocket: require('ws') });



test('basic test', async ({ page }) => {
  await page.goto('https://playwright.dev/')

  // Inject the MedoozeConnector and MedoozePlayer into the web application
  const connectionConfig = {
    host: '172.25.25.151',
    httpOnly: true,
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MDAzNDczMTR9.WsryoZ6JGRHXeBopzH-SMcZUXhMvjdYc5YDwFci5F0Y',
    port: 8000,
    isCloudServer: false
  }

  const pmsConnection = await MedoozeConnector(connectionConfig)

  srcObject = await new MedoozePlayer({ pms: pmsConnection }).streamPromise
})

// test('pmsConnection.cameraList should exist and be an array with length > 1', async () => {
//   expect(pmsConnection.cameraList).toBeDefined()
//   expect(Array.isArray(pmsConnection.cameraList)).toBe(true)
//   expect(pmsConnection.cameraList.length).toBeGreaterThan(1)
// })

// test('srcObject should exist', async () => {
//   expect(srcObject).toBeDefined()
// })
