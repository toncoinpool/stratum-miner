import { resolve } from 'path'
import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron' // eslint-disable-line import/no-extraneous-dependencies
import TonPoolClient from './client'
import readConfig, { ConfigJson } from './client/config'
import Miner from './client/miner'

const isDev = process.env.NODE_ENV === 'development'
const baseConfig = readConfig()

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        height: 450,
        width: 350,
        resizable: false,
        maximizable: false,
        webPreferences: {
            preload: resolve(__dirname, 'preload.js')
        }
    })

    void mainWindow.loadURL(isDev ? 'http://127.0.0.1:5000' : `file://${resolve(__dirname, '..', 'index.html')}`)

    TonPoolClient.on('connect', () => mainWindow.webContents.send('connect'))
    TonPoolClient.on('error', (error) => mainWindow.webContents.send('error', error))
    TonPoolClient.on('hashrate', (gpuId, hashrate) => mainWindow.webContents.send('hashrate', gpuId, hashrate))
    TonPoolClient.on('reconnect', () => mainWindow.webContents.send('reconnect'))
    TonPoolClient.on('stop', () => mainWindow.webContents.send('stop'))
    TonPoolClient.on('submit', () => mainWindow.webContents.send('submit'))
    TonPoolClient.on('submitDuplicate', () => mainWindow.webContents.send('submitDuplicate'))
    TonPoolClient.on('submitInvalid', () => mainWindow.webContents.send('submitInvalid'))
    TonPoolClient.on('submitStale', () => mainWindow.webContents.send('submitStale'))

    if (isDev) {
        mainWindow.webContents.openDevTools()
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    if (baseConfig.headless) {
        TonPoolClient.start(baseConfig)
        TonPoolClient.on('stop', () => app.exit())
    } else {
        createWindow()

        app.on('activate', function () {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })
    }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on('miningStart', (event: IpcMainEvent, config: ConfigJson) => {
    baseConfig.minerPath = resolve(baseConfig.baseBinaryPath, config.binary)

    TonPoolClient.start(Object.assign(baseConfig, config))

    event.reply('miningStart', true)
})

ipcMain.on('miningStop', (event: IpcMainEvent) => {
    void TonPoolClient.stop()

    event.reply('miningStop', true)
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ipcMain.on('getDevices', async (event: IpcMainEvent, binary: string) => {
    try {
        const path = resolve(baseConfig.baseBinaryPath, binary)
        const devices = await Miner.getDevices(path)

        event.reply('getDevices', null, devices)
    } catch (error) {
        event.reply('getDevices', error, [])
    }
})
