import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getPlayer } from "../services/bear-audio-player";
import { getConnection, getVoiceChannel } from "../helper";
import { isYoutubeLink } from "../services/youtube";

const info = new SlashCommandBuilder();
info
  .setName("play")
  .setDescription("Play a song from youtube")
  .addStringOption((option) =>
    option
      .setName("input")
      .setDescription("Youtube link with the song")
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
      const message = player.empty
        ? `Now Playing: ${url}`
        : `Adding to queue: ${url}`;
      await player.play(url);
      await interaction.reply({
        content: message,
      });
    })
    .catch(async (exception) => {
      console.log(exception)
      await interaction.reply({ content: exception || "Unknown error", ephemeral: true });
    });
};

export default {
  info,
  executor: execute,
};
