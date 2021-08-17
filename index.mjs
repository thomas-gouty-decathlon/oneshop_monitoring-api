import express from 'express'
import { spawn, spawnSync } from 'child_process'

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

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/change', (req, res) => {
    lastReportP = lastReportS
    res.send('ok!')
})

app.post('/new-reports', (req, res) => {
    // secure call once at a time
    try {
        generatingNewReports()
    } catch (error) {
        res.send('something go wrong!')
    }
    console.log('toto')
    res.send('done!')
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
}
main()

export { ENVS, lastReportS, lastReportP, generatingNewReports }
