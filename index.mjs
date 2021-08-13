import express from 'express'
import { spawn } from 'child_process'
import cron from 'node-cron'

import { getDataFromLastReportby } from './src/file-reading.mjs'

const app = express()
const port = 3001

const ENVS = Object.freeze({
    STAGING: 1,
    PROD: 2,
})

app.get('/', (req, res) => {
    res.send('Hello World!')
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

const main = () => {
    getDataFromLastReportby(ENVS.STAGING)
}
main()

app.listen(port, () => {
    console.log(`Server running on  http://localhost:${port} 🚀🚀🚀 `)
})

export { ENVS }
