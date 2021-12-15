import readConfig from './config'
import TonPoolClient from '.'

const config = readConfig()

TonPoolClient.start(config)
TonPoolClient.on('stop', () => process.exit())
