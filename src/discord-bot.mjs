import { Client, MessageEmbed } from 'discord.js'
import dotenv from 'dotenv'
import cron from 'node-cron'
import { lastReportS, lastReportP } from '../index.mjs'

const client = new Client({})
const config = dotenv.config({ path: './environements/.env' }).parsed

const monitoringChanId = '852560928192462859'
const serverId = '850111368451326046'
const PREFIX = '!'

async function initBotDiscord(report) {
    async function sendSimpleMessage(text) {
        const guild = await client.guilds.fetch(serverId)
        if (guild) {
            const channel = client.channels.cache.find(
                (channel) => channel.id === monitoringChanId
            )
            channel.send(text)
            console.log()
        }
    }
    async function sendMessageTemplateFrom(data) {
        const guild = await client.guilds.fetch(serverId)
        if (guild) {
            const channel = client.channels.cache.find(
                (channel) => channel.id === monitoringChanId
            )

            const embed = new MessageEmbed()
                // Set the title of the field
                .setTitle(data.collectionName)
                // Set the color of the embed
                .setColor(0xff0000)
                // Set the main content of the embed
                .setDescription('- ' + data.launchTime)
                .addFields(
                    {
                        name: `Request Failed: ${data.failReqNumber}/${data.totalReq}`,
                        value: `- Done in: ${data.executionTime}s`,
                    },
                    { name: '\u200B', value: '\u200B' }, // for /n
                    //add conditional error if not
                    {
                        name: 'Errors details',
                        value: '\u200B',
                        inline: false,
                    },
                    {
                        name: 'Inline field title',
                        value: 'Some value here',
                        inline: true,
                    },
                    {
                        name: 'Inline field title',
                        value: 'Some value here',
                        inline: true,
                    }
                )
            channel.send(embed)
            console.log(
                `[${new Date().toISOString}]: sent on discord: ${
                    data.collectionName
                } - on channelId: ${channel.id}`
            )
        }
    }

    function sendStagingAndProd() {
        sendMessageTemplateFrom(lastReportS).then(() => {
            sendMessageTemplateFrom(lastReportP)
        })
    }

    client.on('ready', () => {
        console.log(`Bot ${client.user.tag} is on 🤖🤖🤖`)
        // test after init:
        sendMessageTemplateFrom(lastReportS)

        cron.schedule('15 09 16 * * 0-5', () => {
            console.log('running a message at every 8:30 AM of the week')
            sendStagingAndProd()
        })
    })

    client.on('message', async (msg) => {
        if (msg.author.bot) return
        console.log(`[${msg.author.tag}]: ${msg.content}`)
        console.log(msg.channel)

        // Monitoring channel -->
        if (msg.channel.id === monitoringChanId) {
            msg.channel.send(`hi ${msg.author.username}`)
            console.log(report)
        }
    })
    // when new member come in --> welcome
    client.on('guildMemberAdd', (member) => {
        member.guild.channels
            .get('850111368451326053')
            .send(`Welcome ${member.user.username}`)
    })

    client.login(config.TOKEN)
}

export { initBotDiscord }
