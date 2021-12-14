import BigDecimal from 'decimal.js'

const formatHashes = (value: string): string => {
    const bitness = Math.ceil(value.length / 3) || 1
    const divider = bitness === 1 ? 1 : new BigDecimal(`1${[...Array(bitness - 1)].map(() => '000').join('')}`)
    const hashes = new BigDecimal(value).div(divider).toFixed(2)

    switch (bitness) {
        case 1: 
            return `${hashes} `
        case 2:
            return `${hashes} K`
        case 3:
            return `${hashes} M`
        case 4:
            return `${hashes} G`
        case 5:
            return `${hashes} T`
        case 6:
            return `${hashes} P`
        default:
            return `${hashes} `
    }
}

export { formatHashes }