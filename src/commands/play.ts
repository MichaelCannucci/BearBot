import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getPlayer, isYoutubeLink } from "../services/bear-audio-player";
import { getConnection, getVoiceChannel } from "../helper";
import { AudioPlayerStatus } from "@discordjs/voice";

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

const execute = async (interaction: CommandInteraction) => {
  if (!interaction?.guild?.available) return;
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
      await player.play(url);
      await interaction.reply({
        content:
          player.status === AudioPlayerStatus.Buffering ||
          player.status === AudioPlayerStatus.Idle
            ? `Now Playing: ${url}`
            : `Adding to queue`,
      });
    })
    .catch(async (exception) => {
      await interaction.reply({ content: exception, ephemeral: true });
    });
};

export default {
  info,
  executor: execute,
};
