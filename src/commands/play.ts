import {
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
    joinVoiceChannel,
    AudioPlayerStatus,
    AudioResource,
    VoiceConnection,
    AudioPlayer,
    entersState,
} from "@discordjs/voice";
import {
    ButtonInteraction,
    Collection,
    CommandInteraction,
    Guild,
    InteractionCollector,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    Snowflake,
    StageChannel,
    TextBasedChannels,
    User,
    VoiceChannel
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import * as ytdl from "ytdl-core";
import { channel } from "diagnostics_channel";

const playerCollection = new Collection<Snowflake, AudioPlayer>();

const info = new SlashCommandBuilder();
info
    .setName('play')
    .setDescription("Play a song from youtube")
    .addStringOption(option =>
        option.setName("input")
            .setDescription("Youtube Link with the song")
            .setRequired(true));

const handleCommand = async (interaction: CommandInteraction) => {
    if (!interaction.guild.available) return;
    const { guild, user } = interaction;
    const url = interaction.options.getString("input", true);
    if (!/http(s)?:\/\/www.youtube.com\/.*/.test(url)) {
        await interaction.reply({ content: "Only youtube links are supported", ephemeral: true })
        return;
    }
    const voiceChannel = await getVoiceChannel(guild, user);
    if (voiceChannel instanceof Error) {
        await interaction.reply({ content: voiceChannel.message, ephemeral: true });
        return;
    }
    const player = getPlayer(voiceChannel.guild);
    playSong(player, voiceChannel, url);
    await interaction.reply({
        content: `Now Playing: ${url}`,
        components: [getPlayerButtons(url)],
    });
}

const handleButton = async (interaction: ButtonInteraction) => {
    const context = JSON.parse(interaction.customId);
    const { guild, user } = interaction;
    const voiceChannel = await getVoiceChannel(guild, user);
    if (voiceChannel instanceof Error) {
        await interaction.reply({ content: voiceChannel.message, ephemeral: true });
        return;
    }
    if (isPlayButton(context)) {
        const player = getPlayer(voiceChannel.guild);
        playSong(player, voiceChannel, context.url);
    } else if (isPauseButton(context)) {
        const player = getPlayer(voiceChannel.guild);
        player.pause();
    } else if (isStopButton(context)) {
        const player = getPlayer(voiceChannel.guild);
        player.stop();
    }
    await interaction.deferUpdate();
}

const playSong = (player: AudioPlayer, voiceChannel: VoiceChannel | StageChannel, url: string) => {
    if(player.state.status === AudioPlayerStatus.Playing) {
        player.stop();   
    }
    const connection = getConnection(voiceChannel);
    connection.subscribe(player);
    if(connection.state.status === VoiceConnectionStatus.Ready) {
        player.play(getSong(url));
    } else {
        connection.on(VoiceConnectionStatus.Ready, () => {
            player.play(getSong(url));
        })
    }
}

const getPlayer = (guild: Guild): AudioPlayer => {
    if (!playerCollection.has(guild.id)) {
        playerCollection.set(guild.id, createAudioPlayer());
    }
    return playerCollection.get(guild.id);
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
        connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            } catch (error) {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                connection.destroy();
            }
        });
    }
    return connection;
}

const getVoiceChannel = async (guild: Guild, user: User): Promise<(VoiceChannel | StageChannel) | Error> => {
    const voiceChannel = (await guild.channels.fetch())
        .filter((channel): channel is VoiceChannel | StageChannel => channel.isVoice())
        .filter(channel => channel.members.has(user.id))
        .first();
    if (!voiceChannel) {
        return new Error("You are not connected to any voice channels!");
    }
    if (!voiceChannel.joinable) {
        return new Error("I can't join your voice channel");
    }
    return voiceChannel;
}

const isPlayButton = (context: any): context is { id: "play", command: string, url: string } => {
    return context.id === "play" && typeof context.command === "string" && typeof context.url === "string";
}

const isPauseButton = (context: any): context is { id: "pause", command: string } => {
    return context.id === "pause" && typeof context.command === "string"
}

const isStopButton = (context: any): context is { id: "stop", command: string } => {
    return context.id === "stop" && typeof context.command === "string"
}

const getPlayerButtons = (url: string): MessageActionRow => {
    return new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(JSON.stringify({
                    id: "play",
                    command: info.name,
                    url
                }))
                .setLabel('Play')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId(JSON.stringify({
                    id: "pause",
                    command: info.name,
                }))
                .setLabel('Pause')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId(JSON.stringify({
                    id: "stop",
                    command: info.name,
                }))
                .setLabel('Stop')
                .setStyle('PRIMARY'),
        );
}

export default {
    info, executors: {
        command: handleCommand,
        button: handleButton
    }
};