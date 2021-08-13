const express = require('express')
const app = express()
const port = 3000
const { spawn } = require('child_process')
var cron = require('node-cron')

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/go', (req, res) => {
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
        main()
    })
})

app.listen(port, () => {
    console.log(`Server running on  http://localhost:${port} 🚀🚀🚀 `)
})

const fs = require('fs-extra')
const path = require('path')
const stringify = require('csv-stringify')

const REQ_BY_COUNTRY = 4
const COUNTRY_NUMBER = 30

// var from json file
let collectionName = null
let launchTime = null
let totalReq = null
let failReqNumber = null

let failRequests = null // mapping
// TODO csv mapping

const getMostRecentFile = (dir) => {
    const files = orderReccentFiles(dir)
    return files.length ? files[0] : undefined
}

const orderReccentFiles = (dir) => {
    return fs
        .readdirSync(dir)
        .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
        .map((file) => ({
            file,
            mtime: fs.lstatSync(path.join(dir, file)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
}

// With async/await:
async function readJsonResults(jsonPath) {
    try {
        const file = await fs.readJson(jsonPath)
        console.log(file)

        collectionName = file.Collection.Info.Name
        launchTime = new Date(file.Run.Timings.started).toLocaleString(
            'fr-FR',
            { timeZone: 'America/New_York' }
        )
        // console.log(launchTime)

        totalReq = file.Run.Stats.Assertions.total
        failReqNumber = file.Run.Stats.Assertions.failed

        failRequests = file.Run.Failures // mapping
        // console.dir(failRequests)
        // console.table(file)
    } catch (err) {
        console.error(
            'Something go wrong when reading the output.json file --> ',
            err
        )
    }
}

// TEST cli with Iteration but no report

const parse = require('csv-parse/lib/sync')
// call newman.run to pass `options` object and wait for callback
let data = fs.readFileSync('./csv/country_mapping.csv', {
    encoding: 'utf8',
    flag: 'r',
})
data = parse(data, {
    columns: true,
    skip_empty_lines: true,
})
console.log(data)

// //index doesn't consider header so 0 is first data row
// stringify(data.slice(0, 2), {
//     header: true
// }, function (err, output) {

//     fs.writeFileSync("temp.csv", output);

//     newman.run({
//         collection: require('./collections/staging/preprod.postman_collection.json'),
//         reporters: 'cli',
//         iterationData: require('./temp.csv')
//     }, function (err) {
//         if (err) { throw err; }
//         console.log('collection run complete!');
//     });
// })

const dotenv = require('dotenv').config({ path: './environements/.env' }).parsed
const { Client, APIMessage, TextChannel } = require('discord.js')
const client = new Client({})

const monitoringChanId = '852560928192462859'
const serverId = '850111368451326046'

const PREFIX = '!'

function initBotDiscord() {
    sendMessage = async (text) => {
        const guild = await client.guilds.fetch(serverId)
        if (guild) {
            const channel = client.channels.cache.find(
                (channel) => channel.id === monitoringChanId
            )
            channel.send(text)
        }
    }

    client.on('ready', () => {
        console.log(`Bot ${client.user.tag} is on 🤖🤖🤖`)

        cron.schedule('40 12 * * 0-5', () => {
            console.log('running a message at every 8:30 AM of the week')
            sendMessage('The report is comming')
        })
    })

    client.on('message', async (msg) => {
        if (msg.author.bot) return
        console.log(`[${msg.author.tag}]: ${msg.content}`)
        console.log(msg.channel)

        // Monitoring channel -->
        if (msg.channel.id === monitoringChanId) {
            msg.channel.send(`hi ${msg.author.username}`)
        }
    })

    // when new member come in --> welcome
    client.on('guildMemberAdd', (member) => {
        member.guild.channels
            .get('850111368451326053')
            .send(`Welcome ${member.user.username}`)
    })

    client.login(dotenv.TOKEN)
}

function main() {
    // run discord
    // initBotDiscord()

    // Get reports
    const dir = __dirname + '/reports/staging/'
    // console.count(dir.concat(getMostRecentFile(dir).file))
    // readJsonResults(dir.concat(getMostRecentFile(dir).file))

    // read mapping csv file
    const stringify = require('csv-stringify')
    const parse = require('csv-parse/lib/sync')
    // call newman.run to pass `options` object and wait for callback
    let data = fs.readFileSync('./csv/country_mapping.csv', {
        encoding: 'utf8',
        flag: 'r',
    })
    data = parse(data, {
        columns: true,
        skip_empty_lines: true,
    })
    console.log(data)
}
main()
