import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import TSConfigPaths from 'vite-tsconfig-paths'
import ElementPlus from 'unplugin-element-plus/vite'

export default defineConfig({
    server: {
        port: 5000,
        host: '0.0.0.0'
    },
    base: './',
    plugins: [
        TSConfigPaths(),
        ElementPlus(),
        vue()
    ]
})
