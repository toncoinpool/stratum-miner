import { contextBridge, ipcRenderer } from 'electron' // eslint-disable-line import/no-extraneous-dependencies

const bridgeRenderer = {
    on(event: string, callback: any) {
        ipcRenderer.on(event, callback) // eslint-disable-line @typescript-eslint/no-unsafe-argument
    },
    send: (channel: string, data?: any) => {
        ipcRenderer.send(channel, data)
    }
}

contextBridge.exposeInMainWorld('ipcRenderer', bridgeRenderer)

export { bridgeRenderer }
