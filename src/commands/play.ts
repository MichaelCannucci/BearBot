import {
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
    joinVoiceChannel,
    AudioPlayerStatus,
    AudioResource,
    VoiceConnection,
} from "@discordjs/voice";
import {
    CommandInteraction,
    Guild,
    MessageActionRow,
    MessageButton,
    StageChannel,
    VoiceChannel
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import * as ytdl from "ytdl-core";

const info = new SlashCommandBuilder();
info
    .setName('play')
    .setDescription("Play a song from youtube")
    .addStringOption(option =>
        option.setName("input")
            .setDescription("Youtube Link with the song")
            .setRequired(true));

const execute = async (interaction: CommandInteraction) => {
    if (!interaction.guild.available) return;
    const { guild, user } = interaction;
    const url = interaction.options.getString("input", true);
    if(!/http(s)?:\/\/www.youtube.com\/.*/.test(url)) {
        await interaction.reply({content: "Only youtube links are supported", ephemeral: true }) 
        return;
    }
    const player = createAudioPlayer();
    const channel = (await guild.channels.fetch())
        .filter((channel): channel is VoiceChannel | StageChannel => channel.isVoice())
        .filter(channel => channel.members.has(user.id))
        .first();
    if (!channel) {
        await interaction.reply({ content: "You are not connected to any voice channels!", ephemeral: true });
        return;
    }
    if (!channel.joinable) {
        await interaction.reply({ content: "I can't join your voice channel", ephemeral: true });
        return;
    }
    const connection = getConnection(channel);
    connection.subscribe(player);
    connection.on(VoiceConnectionStatus.Ready, () => {
        player.play(getSong(url));
    })
    const collector = interaction.channel.createMessageComponentCollector();
    collector.on("collect", async pressed => {
        switch(pressed.customId) {
            case "play":
                if(player.state.status === AudioPlayerStatus.Idle) {
                    player.play(getSong(url))
                } else {
                    player.unpause();
                }
            break;
            case "pause":
                player.pause();
            break;
            case "stop":
                player.stop();
            break;
        }
        await pressed.deferUpdate()
    })
    await interaction.reply({
        content: `Now Playing: ${url}`,
        components: [getPlayerButtons()]
    });
}

const getSong = (url: string): AudioResource<null> => {
    const video = ytdl(url, {
        filter: "audioonly"
    })
    return createAudioResource(video);
}

const getConnection = (channel: VoiceChannel | StageChannel): VoiceConnection => {
    let connection = getVoiceConnection(channel.guild.id);
    if (!connection) {
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator
        })
    }
    return connection;
}

const getPlayerButtons = (): MessageActionRow => {
    return new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('play')
                .setLabel('Play')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('pause')
                .setLabel('Pause')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('stop')
                .setLabel('Stop')
                .setStyle('PRIMARY'),
        );
}

export default { info, execute };