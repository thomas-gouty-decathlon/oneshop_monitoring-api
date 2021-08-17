import express from 'express'
import { spawn } from 'child_process'
// import EventEmitter from

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
    main()
})

app.listen(port, () => {
    console.log(`Server running on  http://localhost:${port} 🚀🚀🚀 `)
})

function generateNewReports() {
    const child = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', [
        'run',
        'new_report',
    ])

    child.stdout.on('data', (data) => {
        console.log(`${data}`)
    })
    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`)
    })

    child.on('error', (error) => {
        console.error(`error: ${error.message}`)
        res.send('Error!')
    })
    child.on('close', (code) => {
        res.send(`done`)
        console.log(`child process exited with code 0`)
        child.kill()
    })
}

const main = async () => {
    lastReportS = await getDataFromLastReportby(ENVS.STAGING)
    lastReportP = await getDataFromLastReportby(ENVS.PROD)
    initBotDiscord()
}
main()

export { ENVS, lastReportS, lastReportP }
