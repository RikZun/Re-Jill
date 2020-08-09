import {Message, WebhookClient, TextChannel, MessageEmbed} from 'discord.js'
import {data, database} from '../events/firebase'
import {print, get} from '../py'
import {client} from '../bot'

const zerodict = /(#\d{4})#0000/
client.on('message', async (message: Message) => {
    if (!message.guild) return;
    if (get(get(data, 'webhooks', {}), message.guild.id, {channelID: false}).channelID !== message.channel.id) return;
    if (message.author.bot || message.webhookID) return;
    if (data.bans.includes(message.author.id)) {
        try {
            await message.delete()
        } catch (error) {}
        return;
    }
    if (message.content.startsWith('./') || message.content.startsWith('!')) return;
    if (message.content.includes('discord.gg')) {

        //add to ban list
        database.child(`/bans`).update({[message.author.id]: '0'})
        data.bans.push(message.author.id)

        //ban message to moder guild
        const channel = await client.channels.fetch('693480909269368933') as TextChannel
        const msg = new MessageEmbed()
            .setThumbnail(message.author.avatarURL({format: "png", size: 512}))
            .addFields(
                {name: 'Banned', 
                value: `Name: ${message.author.username}\nID: ${message.author.id}`},
                {name: 'Ban issued', 
                value: `Name: ${client.user.username}\nID: ${client.user.id}\nReason: discord.gg trigger`}
            )
        channel.send(msg)

        //ban alert
        const banMessage = new MessageEmbed()
            .setTitle('Вы были забанены')
            .setDescription('Бан выдан модератором Jill.\nПричина: Ссылка-приглашение')
        message.channel.send(banMessage)
        try {
            await message.delete()
        } catch (error) {}
        return;
    }
    
    //grab all attachments
    let attachments: string[] = new Array()
    message.attachments.forEach(v => {
        attachments.push(v.url)
    })
    const messageInfo = 
        `\n>>> \`\`\`md\n[${message.id}](MESSAGE)\n` +
        `[${message.author.id}](USER)\n` +
        `[${message.guild.id}](GUILD)\`\`\``;

    let messageIds = {}
    messageIds[message.channel.id] = message.id

    const zerotrigger = message.content.match(zerodict)
    if (zerotrigger) {
        message.content = message.content.replace(zerotrigger[0], zerotrigger[1])}

    const originalContent = message.content
    
    for (let guild in data.webhooks) {
        try {
            if (data.webhooks[guild].channelID == message.channel.id) continue;
            if (client.guilds.cache.get(guild) == undefined) throw {code: '10015'};
            
            const webhook = new WebhookClient(
                data.webhooks[guild].id, data.webhooks[guild].token);

            let webhookName = message.author.username + '#' + message.author.discriminator
            message.content = originalContent

            //highlight mooders
            if (data.moderators.includes(message.author.id)) {
                webhookName += '[M]'
            }

            //additional info for moders
            if (guild == '693480389586583553') {
                message.content += messageInfo
            }
        
            const sendedMessage = await webhook.send(message.cleanContent, {
                username: webhookName,
                avatarURL: message.author.avatarURL({format: 'png'}) ?? message.author.defaultAvatarURL,
                disableMentions: 'everyone',
                files: attachments
            });
            messageIds[sendedMessage['channel_id']] = sendedMessage.id
        } catch (error) {
            switch (error['code']) {
                case '10015':
                    delete data.webhooks[guild]
                    database.child(`/webhooks/${guild}`).remove()
                    break;
            }
        }
        
    }
    data.messages[message.id] = {...messageIds}
    database.child(`/nmessages/${message.id}`).update(messageIds)

    }
)

client.on('messageDelete', async (message: Message) => {
    if ( get(data.messages, message.id, false) ) {
        if (data.bans.includes(message.author.id)) return;
        if (message.content.includes('discord.gg')) {
            data.bans.push(message.author.id)
            database.child(`/bans`).update({[data.bans.length]: message.author.id})
            const channel = await client.channels.fetch('693480909269368933') as TextChannel
    
            const msg = new MessageEmbed()
                .setThumbnail(message.author.avatarURL({format: "png", size: 512}))
                .addFields(
                    {name: 'Banned', 
                    value: `Name: ${message.author.username}\nID: ${message.author.id}`},
                    {name: 'Ban issued', 
                    value: `Name: ${client.user.username}\nID: ${client.user.id}\nReason: discord.gg trigger`}
                )
            channel.send(msg)
            return
        }

        //delete message on all guilds
        for (let ch in data.messages[message.id]) {
            if (data.messages[message.id][ch] == message.id) continue;

            try {
                const channel = await client.channels.fetch(ch) as TextChannel
                const msg = await channel.messages.fetch(data.messages[message.id][ch])
                await msg.delete()
                
            } catch (error) {
                continue
            }
        }
    }
})