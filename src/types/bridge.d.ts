import { bridgeRenderer } from '../electron/preload'

declare global {
    interface Window {
        ipcRenderer: typeof bridgeRenderer
    }
}
