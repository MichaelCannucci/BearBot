import {
  VoiceConnectionStatus,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnection,
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

type PlayButton = { id: "play"; command: string; url: string };
type PauseButton = { id: "pause"; command: string };
type StopButton = { id: "stop"; command: string };

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
      if (isPlayButton(context)) {
        if (!isYoutubeLink(context.url)) {
          console.log(`Failed link: ${context.url}`);
          await interaction.reply({content: "Link no longer valid", ephemeral: true});
          return;
        }
        player.play(context.url);
        await interaction.reply({content: "Playing", ephemeral: true});
      } else if (isPauseButton(context)) {
        player.pause();
        await interaction.reply({content: "Pausing", ephemeral: true});
      } else if (isStopButton(context)) {
        player.stop();
        await interaction.reply({content: "Stopping", ephemeral: true});
      } else {
        await interaction.reply({content: "Unrecognized action", ephemeral: true});
      }
    })
    .catch(async (exception) => {
      if(typeof exception !== "string") {
        console.error(exception);
        exception = "Unexpected error occured";
      }
      await interaction.reply({content: exception, ephemeral: true});
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
      async (_oldState, _newState) => {
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
): context is PlayButton => {
  return (
    context.id === "play" &&
    typeof context.command === "string" &&
    typeof context.url === "string"
  );
};

const isPauseButton = (
  context: any
): context is PauseButton => {
  return context.id === "pause" && typeof context.command === "string";
};

const isStopButton = (
  context: any
): context is StopButton => {
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
