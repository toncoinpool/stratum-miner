/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { platform } from 'process'
import log from './logger'

export interface CudaGPU {
    boost: number
    deviceId: number
    id: string
    minerPath: string
    name: string
    type: 'CUDA'
}

export interface OpenCLGPU {
    boost: number
    deviceId: number
    id: string
    minerPath: string
    name: string
    platformId: number
    type: 'OpenCL'
}

export type GPU = CudaGPU | OpenCLGPU

interface BoostFactor {
    boost: number
    deviceId: number
    platformId?: number
    type: 'CUDA' | 'OpenCL' | 'both'
}

interface ExcludeGPUFilter {
    deviceId: number
    platformId?: number
    type: 'CUDA' | 'OpenCL'
}

/**
 * Read all CUDA and OpenCL GPUs on the system
 * @param baseBinaryPath - path to directory with miner binaries
 * @param boosts - a --boost string to apply boosts to specific gpus by id
 * @param excludeGPUs - an --exclude-gpus string to filter out specific gpus by id
 * @param bin - miner binary name, if set, only those GPUs will be read
 */
export default async function readGPUs(
    baseBinaryPath: string,
    boosts = '',
    excludeGPUs = '',
    bin = ''
): Promise<GPU[]> {
    const boostFactors = parseBoosts(boosts)
    const gpuFilters = parseFilters(excludeGPUs)
    const gpus: GPU[] = []

    if (bin === '' || /cuda/.test(bin)) {
        try {
            const defaultBoost = /^\d+$/.test(boosts) ? Number.parseInt(boosts, 10) : 2048
            const cudaGPUs = await parseCudaGPUs(baseBinaryPath, bin, boostFactors, gpuFilters, defaultBoost)

            for (const cudaGPU of cudaGPUs) {
                gpus.push(cudaGPU)
            }
        } catch (err) {
            log.warn(`Failed to parse CUDA GPUs: ${(err as Error).message}`)
        }
    }

    if (bin === '' || /opencl/.test(bin)) {
        try {
            const defaultBoost = /^\d+$/.test(boosts) ? Number.parseInt(boosts, 10) : 64
            const openCLGPUs = await parseOpenCLGPUs(baseBinaryPath, bin, boostFactors, gpuFilters, defaultBoost)

            for (const openCLGPU of openCLGPUs) {
                gpus.push(openCLGPU)
            }
        } catch (err) {
            log.warn(`Failed to parse OpenCL GPUs: ${(err as Error).message}`)
        }
    }

    return gpus
}

function parseBoosts(boostArg: string): BoostFactor[] {
    const boosts: BoostFactor[] = []
    const boostStrings = boostArg.split(',').map((filter) => filter.trim()).filter(Boolean) // prettier-ignore

    if (boostStrings.length === 1 && /^\d+$/.test(boostStrings[0]!)) {
        return []
    }

    for (const boostString of boostStrings) {
        if (/^\d+:\d+$/.test(boostString)) {
            const matches = boostString.match(/^(\d+):(\d+)$/)!
            let boost = Number.parseInt(matches[2]!, 10)
            boost = Math.min(boost, 16384)
            boost = Math.max(boost, 1)
            boosts.push({
                boost,
                deviceId: Number.parseInt(matches[1]!, 10),
                type: 'CUDA'
            })
        } else if (/^\d+:\d+:\d+$/.test(boostString)) {
            const matches = boostString.match(/^(\d+):(\d+):(\d+)$/)!
            let boost = Number.parseInt(matches[3]!, 10)
            boost = Math.min(boost, 16384)
            boost = Math.max(boost, 1)
            boosts.push({
                boost,
                deviceId: Number.parseInt(matches[2]!, 10),
                platformId: Number.parseInt(matches[1]!, 10),
                type: 'OpenCL'
            })
        } else {
            log.error(`invalid --boost ${boostArg}`)

            return []
        }
    }

    return boosts
}

function parseFilters(excludeGPUsArg: string): ExcludeGPUFilter[] {
    const filters: ExcludeGPUFilter[] = []
    const filterStrings = excludeGPUsArg.split(',').map((filter) => filter.trim()).filter(Boolean) // prettier-ignore

    for (const filter of filterStrings) {
        if (/^\d+$/.test(filter)) {
            filters.push({
                deviceId: Number.parseInt(filter, 10),
                type: 'CUDA'
            })
        } else if (/^\d+:\d+$/.test(filter)) {
            const [, platform, id] = filter.match(/^(\d+):(\d+)$/) || []
            filters.push({
                deviceId: Number.parseInt(id!, 10),
                type: 'OpenCL',
                platformId: Number.parseInt(platform!, 10)
            })
        } else {
            log.error(`invalid --exclude-gpus ${excludeGPUsArg}`)

            return []
        }
    }

    return filters
}

async function parseCudaGPUs(
    baseBinaryPath: string,
    bin: string,
    boosts: BoostFactor[],
    filters: ExcludeGPUFilter[],
    defaultBoost = 512
): Promise<CudaGPU[]> {
    let minerPath: string

    if (bin !== '') {
        minerPath = resolve(baseBinaryPath, bin)
    } else {
        if (platform === 'win32') {
            minerPath = resolve(baseBinaryPath, 'cuda.exe')
        } else if (existsSync(resolve(baseBinaryPath, 'cuda-20'))) {
            minerPath = resolve(baseBinaryPath, 'cuda-20')
        } else if (existsSync(resolve(baseBinaryPath, 'cuda-18'))) {
            minerPath = resolve(baseBinaryPath, 'cuda-18')
        } else {
            return Promise.reject(new Error('no binaries to parse CUDA GPUs'))
        }
    }

    const cudaGPUs = (await listDevices(minerPath))
        .map((line) => line.replace('\u001b[0m', ''))
        .filter((line) => /^CUDA: device_id #\d+ device_name [ \w]+/.test(line))
        .map((line) => line.match(/^CUDA: device_id #(\d+) device_name ([ \w]+)/)!)
        .map<[number, string]>(([, id, name]) => [Number.parseInt(id!, 10), name!])
        .map<CudaGPU>(([deviceId, name]) => {
            const customBoost = boosts.find((boost) => boost.type === 'CUDA' && boost.deviceId === deviceId)

            return {
                boost: customBoost ? customBoost.boost : defaultBoost,
                deviceId,
                id: deviceId.toString(10),
                minerPath,
                name,
                type: 'CUDA'
            }
        })
        .filter(
            (cudaGPU) =>
                filters.findIndex((filter) => filter.type === 'CUDA' && filter.deviceId === cudaGPU.deviceId) === -1
        )

    return cudaGPUs
}

async function parseOpenCLGPUs(
    baseBinaryPath: string,
    bin: string,
    boosts: BoostFactor[],
    filters: ExcludeGPUFilter[],
    defaultBoost = 64
): Promise<OpenCLGPU[]> {
    let minerPath: string

    if (bin !== '') {
        minerPath = resolve(baseBinaryPath, bin)
    } else {
        if (platform === 'win32') {
            minerPath = resolve(baseBinaryPath, 'opencl.exe')
        } else if (existsSync(resolve(baseBinaryPath, 'opencl-20'))) {
            minerPath = resolve(baseBinaryPath, 'opencl-20')
        } else if (existsSync(resolve(baseBinaryPath, 'opencl-18'))) {
            minerPath = resolve(baseBinaryPath, 'opencl-18')
        } else {
            return Promise.reject(new Error('no binaries to parse OpenCL GPUs'))
        }
    }

    const openCLGPUs = (await listDevices(minerPath))
        .map((line) => line.replace('\u001b[0m', ''))
        .filter((line) => /^OpenCL: platform #\d+ device_id #\d+ device_name [ \w]+/.test(line))
        .map((line) => line.match(/^OpenCL: platform #(\d+) device_id #(\d+) device_name ([ \w]+)/)!)
        .map<[number, number, string]>(([, platformId, id, name]) => {
            return [Number.parseInt(platformId!, 10), Number.parseInt(id!, 10), name!]
        })
        .map<OpenCLGPU>(([platformId, deviceId, name]) => {
            const customBoost = boosts.find(
                (boost) => boost.type === 'OpenCL' && boost.platformId === platformId && boost.deviceId === deviceId
            )

            return {
                boost: customBoost ? customBoost.boost : defaultBoost,
                deviceId,
                id: `${platformId}:${deviceId}`,
                minerPath,
                name,
                platformId,
                type: 'OpenCL'
            }
        })
        .filter(
            (openCLGPU) =>
                filters.findIndex(
                    (filter) =>
                        filter.type === 'OpenCL' &&
                        filter.platformId === openCLGPU.platformId &&
                        filter.deviceId === openCLGPU.deviceId
                ) === -1
        )

    return openCLGPUs
}

function listDevices(minerPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        execFile(minerPath, ['--list-devices'], (error, stdout, stderr) => {
            if (error) {
                return reject(error)
            }

            return resolve(stderr.trim().split(/\r?\n/))
        })
    })
}
