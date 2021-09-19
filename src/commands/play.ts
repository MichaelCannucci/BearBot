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
  CommandInteraction,
  Guild,
  MessageActionRow,
  MessageButton,
  StageChannel,
  User,
  VoiceChannel,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getPlayer, isYoutubeLink } from "../services/bear-audio-player";
const ytdl = require("ytdl-core");

const info = new SlashCommandBuilder();
info
  .setName("play")
  .setDescription("Play a song from youtube")
  .addStringOption((option) =>
    option
      .setName("input")
      .setDescription("Youtube Link with the song")
      .setRequired(true)
  );

const handleCommand = async (interaction: CommandInteraction) => {
  if (!interaction.guild.available) return;
  const { guild, user } = interaction;
  const url = interaction.options.getString("input", true);
  if (!isYoutubeLink(url)) {
    await interaction.reply({
      content: "Only youtube links are supported",
      ephemeral: true,
    });
    return;
  }
  getVoiceChannel(guild, user)
    .then(async (voiceChannel) => {
      const player = getPlayer(voiceChannel.guild, getConnection(voiceChannel));
      player.play(url);
      await interaction.reply({
        content: `Now Playing: ${url}`,
        components: [getPlayerButtons(url)],
      });
    })
    .catch(async (exception) => {
      await interaction.reply({ content: exception, ephemeral: true });
    });
};

const handleButton = async (interaction: ButtonInteraction) => {
  const context = JSON.parse(interaction.customId);
  const { guild, user } = interaction;
  getVoiceChannel(guild, user)
    .then(async (voiceChannel) => {
      const connection = getConnection(voiceChannel);
      const player = getPlayer(voiceChannel.guild, connection);
      if (!isYoutubeLink(context.url)) {
        await interaction.deferUpdate();
        return;
      }
      if (isPlayButton(context)) {
        player.play(context.url);
      } else if (isPauseButton(context)) {
        player.pause();
      } else if (isStopButton(context)) {
        player.stop();
      }
      await interaction.deferUpdate();
    })
    .catch(async (exception) => {
      await interaction.reply({ content: exception, ephemeral: true });
    });
};

const getConnection = (
  channel: VoiceChannel | StageChannel
): VoiceConnection => {
  let connection = getVoiceConnection(channel.guild.id);
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    connection.on(
      VoiceConnectionStatus.Disconnected,
      async (oldState, newState) => {
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
      }
    );
  }
  return connection;
};

const getVoiceChannel = async (
  guild: Guild,
  user: User
): Promise<VoiceChannel | StageChannel> => {
  const voiceChannel = (await guild.channels.fetch())
    .filter((channel): channel is VoiceChannel | StageChannel =>
      channel.isVoice()
    )
    .filter((channel) => channel.members.has(user.id))
    .first();
  if (!voiceChannel) {
    return Promise.reject("You are not connected to any voice channels!");
  }
  if (!voiceChannel.joinable) {
    return Promise.reject("I can't join your voice channel");
  }
  return voiceChannel;
};

const isPlayButton = (
  context: any
): context is { id: "play"; command: string; url: string } => {
  return (
    context.id === "play" &&
    typeof context.command === "string" &&
    typeof context.url === "string"
  );
};

const isPauseButton = (
  context: any
): context is { id: "pause"; command: string } => {
  return context.id === "pause" && typeof context.command === "string";
};

const isStopButton = (
  context: any
): context is { id: "stop"; command: string } => {
  return context.id === "stop" && typeof context.command === "string";
};

const getPlayerButtons = (url: string): MessageActionRow => {
  return new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(
        JSON.stringify({
          id: "play",
          command: info.name,
          url,
        })
      )
      .setLabel("Play")
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId(
        JSON.stringify({
          id: "pause",
          command: info.name,
        })
      )
      .setLabel("Pause")
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId(
        JSON.stringify({
          id: "stop",
          command: info.name,
        })
      )
      .setLabel("Stop")
      .setStyle("PRIMARY")
  );
};

export default {
  info,
  executors: {
    command: handleCommand,
    button: handleButton,
  },
};
