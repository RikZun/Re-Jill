import {data, database} from './firebase'
import {client} from '../bot'
import {VoiceState, VoiceChannel} from 'discord.js'
import { get, print, arrayDelValue } from '../py';

client.on('voiceStateUpdate', async (before: VoiceState, after: VoiceState) => {
    if (!get(data.privates, after.guild.id, false)) return
    if (data.privates[after.guild.id].original !== after.channelID) return;
    if (!after.guild.me.hasPermission(['MANAGE_CHANNELS', 'MOVE_MEMBERS'])) return;

    try {
        const category = (await client.channels.fetch(data.privates[after.guild.id].original) as VoiceChannel).parent
        const channel = await after.guild.channels.create(
            after.member.user.username, {
                type: 'voice', userLimit: 1, parent: category,
                permissionOverwrites: [
                    {
                        id: after.member.id,
                        allow: ['MANAGE_CHANNELS', 'ADMINISTRATOR', 'MANAGE_ROLES', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS'],
                    },
                ],
            })

        data.privates[after.guild.id].createdChannels.push(channel.id)
        database.child(`/privates/${after.guild.id}/createdChannels`).update({[channel.id]: "0"})
    
        try {
            await after.setChannel(channel)
        } catch (error) {}

    } catch (error) {}
})

setInterval(() => {
    (async() => {

        //удаление созданных каналов
        for (let guild in data.privates) {

            //проверка на существование original
            try {
                await client.channels.fetch(data.privates[guild].original) as VoiceChannel
            } catch (error) {
                delete data.privates[guild]
                database.child(`/privates/${guild}`).remove()
                continue
            }

            if (!get(data.privates[guild], 'createdChannels', false)) continue;

            //удаление каналов
            data.privates[guild].createdChannels.forEach((v, i, a) => {
                (async()=> {
                    try {
                        const channel = await client.channels.fetch(v) as VoiceChannel
                        if (channel.members.array().length > 0) return;

                        arrayDelValue(data.privates[guild].createdChannels, v)
                        database.child(`/privates/${guild}/createdChannels/${v}`).remove()
                        channel.delete()
                    } catch (error) {
                        switch (error['code']) {
                            case '10003':
                                arrayDelValue(data.privates[guild].createdChannels, v)
                                database.child(`/privates/${guild}/createdChannels/${v}`).remove()
                                break;
                        }
                    }
                })()
            })
        }
    })()
}, 20000)