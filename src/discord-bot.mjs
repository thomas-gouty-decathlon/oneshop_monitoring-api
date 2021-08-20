import { Client, MessageEmbed } from 'discord.js'
import cron from 'node-cron'
import {
    lastReportS,
    lastReportP,
    generatingNewReports,
    config,
} from '../index.mjs'

const client = new Client({})

const monitoringChanId = '852560928192462859'
const serverId = '850111368451326046'
const PREFIX = '!'

const embedWithoutFails = (data) =>
    new MessageEmbed()
        .setTitle(data.collectionName)
        .setColor('#6AFF00')
        .setDescription('- at: ' + data.launchTime)
        .addFields(
            {
                name: `Request Failed: ${data.failReqNumber}/${data.totalReq}`,
                value: `- Done in: ${data.executionTime}s`,
            },
            {
                name: `Details here -->`,
                value: `${data.htmlLogsFile}`,
            }
        )

const embedWithFails = (data) => {
    let cloneErrors = data.failures.errors.slice(0) // copy object
    //remove404errors
    cloneErrors = cloneErrors.filter((error) => {
        if (error.errorCode !== 404) {
            return error
        }
    })
    const MAX_ITERATION_FIELD = 6

    function mappingOneBatchOfDataErrors() {
        const tmp = []
        cloneErrors.forEach((error, i) => {
            if (i < MAX_ITERATION_FIELD) {
                tmp.push(
                    'Error on /' +
                        error.issueType +
                        ', Country: ' +
                        error.country +
                        ' - ' +
                        error.envId +
                        '\n' +
                        error.errorCode +
                        ' on GET - ' +
                        error.request +
                        '\n' +
                        '\n'
                )
            }
        })
        cloneErrors = cloneErrors.slice(6)
        return tmp.length !== 0 ? tmp.join(' ') : ''
    }
    const embed = new MessageEmbed()
        .setTitle(data.collectionName)
        .setColor(0xff0000)
        .setDescription('- at: ' + data.launchTime)
        .addFields(
            {
                name: `Request Failed: ${data.failReqNumber}/${data.totalReq}`,
                value: `- Done in: ${data.executionTime}s`,
            },
            {
                name: `Details here -->`,
                value: `${data.htmlLogsFile}`,
            },
            { name: '\u200B', value: '\u200B' },
            {
                name: 'Errors details',
                value: `${mappingOneBatchOfDataErrors()}`,
            }
        )

    while (cloneErrors.length != 0) {
        embed.addField('\u200B', `${mappingOneBatchOfDataErrors()}`)
    }

    return embed
}

async function initBotDiscord() {
    async function sendMessageTemplateFrom(data) {
        const guild = await client.guilds.fetch(serverId)
        if (guild) {
            const channel = client.channels.cache.find(
                (channel) => channel.id === monitoringChanId
            )

            const embed =
                data.failures == null || data.failures.errors.length === 0
                    ? embedWithoutFails(data)
                    : embedWithFails(data)

            channel.send(embed)
            console.log(
                `[${new Date().toISOString()}] - Report sent on discord, with name: '${
                    data.collectionName
                }' - at channelId: '${channel.id}'`
            )
        }
    }

    client.on('ready', async () => {
        console.log(`Bot ${client.user.tag} is on 🤖🤖🤖`)
        // display the reports at every 8:30 AM of the week
        cron.schedule('25 8 * * 0-5', async () => {
            await sendMessageTemplateFrom(lastReportS)
            await sendMessageTemplateFrom(lastReportP)
        })
    })

    client.on('message', (msg) => {
        if (msg.channel.id === monitoringChanId) {
            if (msg.author.bot && msg.content.charAt(0) !== PREFIX) return
            const textMessage = msg.content
            const isGoodChannelAndPrefix =
                msg.channel.id === monitoringChanId &&
                textMessage.charAt(0) === PREFIX

            if (isGoodChannelAndPrefix) {
                switch (textMessage.trim().toLowerCase()) {
                    case '!newreports': {
                        msg.channel
                            .send(`Start generatingNewReports...`)
                            .then(() => {
                                try {
                                    generatingNewReports().then(() => {
                                        msg.channel.send(
                                            `End generatingNewReports...`
                                        )
                                        msg.channel.send(`!lastProdReport`)
                                        msg.channel.send(`!lastStagingReport`)
                                    })
                                } catch (error) {
                                    console.error(
                                        'something go wrong with' + error
                                    )
                                }
                            })
                        break
                    }
                    case '!lastprodreport': {
                        sendMessageTemplateFrom(lastReportS)
                        break
                    }
                    case '!laststagingreport': {
                        sendMessageTemplateFrom(lastReportP)
                        break
                    }
                    default:
                        break
                }
            }
        }
    })
    // when new member come in --> welcome
    client.on('guildMemberAdd', (member) => {
        member.guild.channels
            .get('850111368451326053')
            .send(`Welcome ${member.user.username} :)`)
    })

    client.login(config.TOKEN)
}

export { initBotDiscord }
