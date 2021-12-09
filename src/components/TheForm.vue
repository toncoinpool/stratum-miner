<template>
    <div class="app__form">
        <el-form>
            <el-form-item class="app__form-item">
                <el-select-v2
                    v-model="pool"
                    placeholder="Select pool"
                    style="width: 100%;"
                    :options="pools"
                    :disabled="isMiningStarted"
                    :height="120"
                />
            </el-form-item>
            <el-form-item class="app__form-item">
                <el-select-v2
                    v-model="binary"
                    placeholder="Select mining binary"
                    style="width: 100%;"
                    :options="binaries"
                    :disabled="isMiningStarted"
                    :height="120"
                    @change="getDevices"
                />
            </el-form-item>
            <el-form-item class="app__form-item">
                <el-select-v2
                    v-model="gpus"
                    placeholder="Select GPUs"
                    style="width: 100%;"
                    multiple
                    :disabled="!devices.length || isMiningStarted"
                    :options="devices"
                    :height="120"
                />
            </el-form-item>
            <el-form-item class="app__form-item">
                <el-input
                    v-model="wallet"
                    placeholder="Wallet address"
                    :disabled="isMiningStarted"
                />
            </el-form-item>
            <el-form-item class="app__form-item">
                <el-input
                    v-model="rig"
                    placeholder="Rig name"
                    :disabled="isMiningStarted"
                />
            </el-form-item>
        </el-form>
        <div class="app__form-button-wrapper">
            <el-button
                v-if="isMiningStarted"
                round
                class="app__form-button"
                type="danger"
                :disabled="!fieldsCompleted"
                @click="onToggleMining"
                v-text="'Stop mining'"
            />
            <el-button
                v-else-if="isLoadingGpus"
                round
                class="app__form-button"
                disabled
                loading
                @click="onToggleMining"
                v-text="'Loading GPUs...'"
            />
            <el-button
                v-else
                round
                class="app__form-button"
                :disabled="!fieldsCompleted"
                @click="onToggleMining"
                v-text="'Start mining'"
            />
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent, ref, computed } from 'vue'

    import { ElButton, ElForm, ElFormItem, ElInput, ElSelect, ElSelectV2, ElOption } from 'element-plus'
    import 'element-plus/es/components/button/style/css'
    import 'element-plus/es/components/form/style/css'
    import 'element-plus/es/components/form-item/style/css'
    import 'element-plus/es/components/input/style/css'
    import 'element-plus/es/components/select/style/css'
    import 'element-plus/es/components/select-v2/style/css'
    import 'element-plus/es/components/option/style/css'

    interface MiningConfig {
        gpus: string[]
        pool: string
        wallet: string
        rig: string
        binary: string
    }

    export default defineComponent({
        name: 'toncoinpool',
        components: {
            ElButton,
            ElForm,
            ElFormItem,
            ElInput,
            ElSelect,
            ElSelectV2,
            ElOption
        },
        setup () {
            const pools = ref([
                { label: 'TON Coin Pool - PPLNS', value: 'wss://pplns.toncoinpool.io/stratum' }
            ])
            const binaries = ref([
                { label: 'Windows CUDA', value: 'pow-miner-cuda.exe' },
                { label: 'Windows OpenCL', value: 'pow-miner-opencl.exe' },
                { label: 'Ubuntu 20.04 CUDA', value: 'pow-miner-cuda-ubuntu-20' },
                { label: 'Ubuntu 18.04 CUDA', value: 'pow-miner-cuda-ubuntu-18' },
                { label: 'Ubuntu 20.04 OpenCL', value: 'pow-miner-opencl-ubuntu-20' },
                { label: 'Ubuntu 18.04 OpenCL', value: 'pow-miner-opencl-ubuntu-18' },
                { label: 'Mac OpenCL', value: 'pow-miner-opencl-mac' }
            ])
            const pool = ref('wss://pplns.toncoinpool.io/stratum')
            const binary = ref('')
            const devices = ref<{ label: string, value: number }[]>([])
            const gpus = ref([])
            const wallet = ref('')
            const rig = ref('')

            const isMiningStarted = ref(false)
            const isLoadingGpus = ref(false)

            const fieldsCompleted = computed(() =>
                pool.value
                && binary.value
                && devices.value.length
                && gpus.value.length
                && wallet.value.length
                && rig.value.length
            )

            const onToggleMining = () => {
                if (isMiningStarted.value) {
                    miningStop()
                } else {
                    minigStart()
                }
            }

            const minigStart = () => {
                const config: MiningConfig = {
                    pool: pool.value,
                    binary: binary.value,
                    gpus: gpus.value.map(el => el),
                    wallet: wallet.value,
                    rig: rig.value
                }

                window.ipcRenderer.send('miningStart', config)
            }

            const miningStop = () => {
                window.ipcRenderer.send('miningStop')
            }

            const getDevices = async (binary: string) => {
                isLoadingGpus.value = true
                devices.value = []
                gpus.value = []

                window.ipcRenderer.send('getDevices', binary)
            }

            window.ipcRenderer.on('miningStart', () => { isMiningStarted.value = true })
            window.ipcRenderer.on('miningStop', () => { isMiningStarted.value = false })
            window.ipcRenderer.on('getDevices', (_event: any, data: any) => {
                devices.value = data
                isLoadingGpus.value = false
            })

            return {
                isLoadingGpus,
                isMiningStarted,
                fieldsCompleted,
                pools,
                binaries,
                pool,
                binary,
                devices,
                gpus,
                wallet,
                rig,
                onToggleMining,
                getDevices
            }
        }
    })
</script>

<style>
    .app__form-item {
        margin-bottom: 8px;
    }

    .app__form-item--centered {
        text-align: center;
    }

    .app__form-button {
        display: inline-block;
        width: 240px;
    }

    .app__form-button-wrapper {
        display: flex;
        flex-direction: row;
        justify-content: center;
        margin-top: 26px;
    }

    .el-select-v2__input-wrapper:not(:first-of-type) {
        display: none;
    }

    .is-disabled .el-select-v2__placeholder,
    .is-disabled .el-select-v2__tags-text {
        color: rgb(192, 196, 204);
    }
</style>
