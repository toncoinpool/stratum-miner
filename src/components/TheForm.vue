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
                round
                class="app__form-button"
                type="primary"
            >{{balance}} 💎</el-button>
            <el-popover
                v-if="isMiningStarted"
                placement="top"
                title="Statistics"
                :width="200"
                trigger="hover"
            >
                <template #reference>
                    <el-button
                        round
                        class="app__form-button"
                        type="danger"
                        @click="onToggleMining"
                    >
                        {{ hashrate }}H/s
                    </el-button>
                </template>
                <div>
                    <span>Hashrate: {{ hashrate }}H/s</span><br>
                    <span>Total shares: {{ sharesTotal }}</span><br><br>
                    <span>Valid: {{ submitted }}</span><br>
                    <span>Invalid: {{ invalid }}</span><br>
                    <span>Stale: {{ stale }}</span><br>
                    <span>Duplicated: {{ duplicated }}</span>
                </div>
            </el-popover>
            <el-button
                v-else-if="isLoadingGpus"
                round
                class="app__form-button"
                disabled
                loading
                @click="onToggleMining"
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
        <el-dialog
            v-model="isError"
            title="Error"
            fullscreen
            @closed="clearError"
        >
            {{ errorMessage }}
        </el-dialog>
    </div>
</template>

<script lang="ts">
    import { defineComponent, ref, toRefs, reactive, computed, watch } from 'vue'

    // import { Address } from 'ton'
    import { formatHashes } from '../composables/hashes-utils'
    import BigDecimal from 'decimal.js'
    import { ElButton, ElForm, ElFormItem, ElInput, ElSelectV2, ElDialog, ElPopover } from 'element-plus'
    import 'element-plus/es/components/button/style/css'
    import 'element-plus/es/components/form/style/css'
    import 'element-plus/es/components/form-item/style/css'
    import 'element-plus/es/components/input/style/css'
    import 'element-plus/es/components/select-v2/style/css'
    import 'element-plus/es/components/dialog/style/css'
    import 'element-plus/es/components/popover/style/css'

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
            ElSelectV2,
            ElDialog,
            ElPopover
        },
        setup () {
            const pools = ref([
                { label: 'TON Coin Pool - PPLNS', value: 'wss://pplns.toncoinpool.io/stratum' }
            ])
            const binaries =
                window.navigator.platform.substring(0, 3).toLowerCase() === 'win'
                    ? ref([
                          { label: 'Windows Nvidia/AMD', value: 'cuda.exe,opencl.exe' },
                          { label: 'Windows Nvidia', value: 'cuda.exe' },
                          { label: 'Windows AMD', value: 'opencl.exe' }
                      ])
                    : ref([
                          { label: 'Ubuntu 20 Nvidia/AMD', value: 'cuda-20,opencl-20' },
                          { label: 'Ubuntu 20 Nvidia', value: 'cuda-20' },
                          { label: 'Ubuntu 20 AMD', value: 'opencl-20' },
                          { label: 'Ubuntu 18 Nvidia/AMD', value: 'cuda-18,opencl-18' },
                          { label: 'Ubuntu 18 Nvidia', value: 'cuda-18' },
                          { label: 'Ubuntu 18 AMD', value: 'opencl-18' }
                      ])
            const pool = ref('wss://pplns.toncoinpool.io/stratum')
            const binary = ref(localStorage.getItem("binary") ?? '')
            const devices = ref<{ label: string, value: number }[]>([])
            const gpus = ref([])
            const wallet = ref(localStorage.getItem("wallet") ?? '')
            const rig = ref(localStorage.getItem("rig") ?? '')

            const isMiningStarted = ref(false)
            const isLoadingGpus = ref(false)
            const isError = ref(false)
            const errorMessage = ref('')

            const hashrates = ref<{ gpuId: string, hashrate: string }[]>([])
            const hashrate = computed(() => {
                if (hashrates.value.length === 0) return '0 '

                const reduced = hashrates.value.reduce((acc, el) => {
                    return new BigDecimal(el.hashrate).add(acc)
                }, new BigDecimal('0'))

                return formatHashes(reduced.toFixed(0))
            })
            const balance = ref('0.0000')

            const shares = reactive({
                submitted: 0,
                stale: 0,
                duplicated: 0,
                invalid: 0
            })

            const sharesTotal = computed(() => Object.entries(shares).reduce((acc, [ _key, value ]) => {
                acc += value

                return acc
            }, 0))

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
                    gpus: gpus.value.map((el: any) => el),
                    wallet: wallet.value,
                    rig: rig.value
                }

                window.ipcRenderer.send('miningStart', config)

                localStorage.setItem("binary", config.binary)
                localStorage.setItem("gpus", JSON.stringify(config.gpus))
                localStorage.setItem("wallet", config.wallet)
                localStorage.setItem("rig", config.rig)

                getBalance();
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
            if (localStorage.getItem("gpus")) getDevices(localStorage.getItem("binary") ?? '')

            const clearError = () => {
                isError.value = false
                errorMessage.value = ''
            }

            window.ipcRenderer.on('connect', () => isMiningStarted.value = true)
            window.ipcRenderer.on('stop', () => isMiningStarted.value = false)

            window.ipcRenderer.on('error', (_event: any, error: Error) => {
                console.log(error.message)
            })

            const getBalance = (): void => {
                fetch(`https://pplns.toncoinpool.io/api/v1/public/miners/${wallet.value}`)
                    .then((res) => res.json())
                    .then((data) => {
                        balance.value = (data.balance / 10**9).toFixed(4)
                    })
                    .catch((err) => console.log(`failed to get balance: ${err}`))
            }
            if (localStorage.getItem("wallet")) getBalance()

            let startTime = Date.now()
            window.ipcRenderer.on('hashrate', (_event: any, gpuId: string, hashrate: string) => {
                const result = hashrates.value.filter(el => el.gpuId !== gpuId)

                result.push({ gpuId, hashrate })

                hashrates.value = result

                if ((Date.now() - startTime) / 1000 >= 300 + Math.floor(Math.random() * 100)) {
                    startTime = Date.now()
                    getBalance()
                }
            })

            window.ipcRenderer.on('reconnect', () => console.log('reconnect event'))
            
            window.ipcRenderer.on('submit', () => shares.submitted += 1)
            window.ipcRenderer.on('submitDuplicate', () => shares.duplicated += 1)
            window.ipcRenderer.on('submitInvalid', () => shares.invalid += 1)
            window.ipcRenderer.on('submitStale', () => shares.stale += 1)

            window.ipcRenderer.on('getDevices', (_event: any, error: any, data: string[]): void => {
                isLoadingGpus.value = false

                if (error !== null) {
                    isError.value = true
                    errorMessage.value = error

                    return undefined
                }

                devices.value = data.map((el, i) => ({ label: el, value: i }))
                if (localStorage.getItem("gpus")) gpus.value = JSON.parse(localStorage.getItem("gpus") ?? '')

                return undefined
            })

            watch(isMiningStarted, (isMining): void => {
                if (isMining) {
                    return undefined
                }

                hashrates.value = []
                shares.submitted = 0
                shares.stale = 0
                shares.duplicated = 0
                shares.invalid = 0
            })

            return {
                isLoadingGpus,
                isMiningStarted,
                isError,
                errorMessage,
                fieldsCompleted,
                pools,
                binaries,
                pool,
                binary,
                devices,
                gpus,
                wallet,
                rig,
                balance,
                hashrate,
                sharesTotal,
                ...toRefs(shares),
                onToggleMining,
                getDevices,
                clearError
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
