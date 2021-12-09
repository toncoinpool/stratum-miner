import { contextBridge, ipcRenderer } from 'electron'

const bridgeRenderer = {
    on (event: string, callback: any) {
        ipcRenderer.on(event, callback)
    },
    send: (channel: string, data?: any) => {
        ipcRenderer.send(channel, data)
    }
}

contextBridge.exposeInMainWorld('ipcRenderer', bridgeRenderer)

export { bridgeRenderer }
