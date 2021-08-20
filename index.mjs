import express from 'express'
import { spawnSync } from 'child_process'
import cron from 'node-cron'
import dotenv from 'dotenv'
const config = dotenv.config({ path: './environements/.env' }).parsed

config.URL = process.env.PROD_URL || config.URL

import { getDataFromLastReportby } from './src/file-reading.mjs'
import { initBotDiscord } from './src/discord-bot.mjs'

const app = express()
const port = 3001

let lastReportS = null
let lastReportP = null

const ENVS = Object.freeze({
    STAGING: 1,
    PROD: 2,
})

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.send('ping!')
})

app.listen(port, () => {
    console.log(`Server running on  http://localhost:${port} 🚀🚀🚀 `)
})

async function generatingNewReports() {
    console.log('Start generatingNewReports...')
    let command = spawnSync(/^win/.test(process.platform) ? 'npx.cmd' : 'npx', [
        'zx',
        './newman_script.mjs',
    ])
    if (command.status !== 0) {
        console.error('something go wrong with the newman script', command)
        throw command
    }
    lastReportS = await getDataFromLastReportby(ENVS.STAGING)
    lastReportP = await getDataFromLastReportby(ENVS.PROD)
    console.log('... END generatingNewReports')
}

const main = async () => {
    lastReportS = await getDataFromLastReportby(ENVS.STAGING)
    lastReportP = await getDataFromLastReportby(ENVS.PROD)
    initBotDiscord()
    cron.schedule('00 8 * * 0-5', () => {
        generatingNewReports()
    })
}
main()

export { ENVS, lastReportS, lastReportP, generatingNewReports, config }
