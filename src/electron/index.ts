import { resolve } from 'path'
import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron' // eslint-disable-line import/no-extraneous-dependencies
import TonPoolClient from './client'
import readConfig from './client/config'
import readGPUs, { GPU } from './client/read-gpus'

const isDev = process.env.NODE_ENV === 'development'
const config = readConfig()

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        height: 480,
        width: 350,
        resizable: false,
        maximizable: false,
        webPreferences: {
            preload: resolve(__dirname, 'preload.js')
        }
    })
    mainWindow.setMenuBarVisibility(false)

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

    mainWindow.webContents.on('new-window', (e, url) => {
        e.preventDefault()

        void require('electron').shell.openExternal(url) // eslint-disable-line import/no-extraneous-dependencies, @typescript-eslint/no-var-requires
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    if (config.headless) {
        readGPUs(config.baseBinaryPath, config.boost, config.excludeGPUs, config.binary).then(
            (gpus) => {
                TonPoolClient.on('stop', () => app.quit())
                TonPoolClient.start(config, gpus)
            },
            () => {} // eslint-disable-line @typescript-eslint/no-empty-function
        )
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
        TonPoolClient.stop().finally(() => app.quit())
    }
})

interface GUIConfig {
    gpus: string[]
    pool: string
    wallet: string
    rig: string
    binary: string
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ipcMain.on('miningStart', async (event: IpcMainEvent, guiConfig: GUIConfig) => {
    const gpus: GPU[] = []

    for (const bin of guiConfig.binary.split(',')) {
        const binGPUs = await readGPUs(config.baseBinaryPath, config.boost, config.excludeGPUs, bin)

        for (const binGPU of binGPUs) {
            gpus.push(binGPU)
        }
    }

    config.binary = guiConfig.binary.split(',').length > 1 ? '' : guiConfig.binary
    config.pool = guiConfig.pool
    config.rig = guiConfig.rig
    config.wallet = guiConfig.wallet

    const selectedGpus = guiConfig.gpus.map((idString) => Number.parseInt(idString, 10))
    const filteredGpus = gpus.filter((gpu, index) => selectedGpus.includes(index))

    TonPoolClient.start(config, filteredGpus)

    event.reply('miningStart', true)
})

ipcMain.on('miningStop', (event: IpcMainEvent) => {
    TonPoolClient.stop().finally(() => void event.reply('miningStop', true))
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ipcMain.on('getDevices', async (event: IpcMainEvent, binary: string) => {
    try {
        const gpus: GPU[] = []

        for (const bin of binary.split(',')) {
            const binGPUs = await readGPUs(config.baseBinaryPath, config.boost, config.excludeGPUs, bin)

            for (const binGPU of binGPUs) {
                gpus.push(binGPU)
            }
        }

        const gpuNames = gpus.map<string>((gpu) => {
            const id = gpu.type === 'CUDA' ? gpu.deviceId.toString(10) : `${gpu.platformId}:${gpu.deviceId}`

            return `${id}. ${gpu.name}`
        })

        event.reply('getDevices', null, gpuNames)
    } catch (error) {
        event.reply('getDevices', error, [])
    }
})
