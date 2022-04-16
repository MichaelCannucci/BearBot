import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getPlayer } from "../services/bear-audio-player";
import { getConnection, getVoiceChannel } from "../helper";
import { youtubeSearch } from "../services/youtube";

const info = new SlashCommandBuilder();
info
  .setName("search")
  .setDescription("Play a song from youtube based on the search results")
  .addStringOption((option) =>
    option
      .setName("input")
      .setDescription("Text to search youtube with")
      .setRequired(true)
  );

const execute = async (interaction: CommandInteraction) => {
  if (!interaction?.guild?.available) return;
  const { guild, user } = interaction;
  const query = interaction.options.getString("input", true);
  getVoiceChannel(guild, user)
    .then(async (voiceChannel) => {
      const info = await youtubeSearch(query)
      if(info) {
        const player = getPlayer(voiceChannel.guild, getConnection(voiceChannel));
        const message = player.empty
          ? `Now Playing: ${info.uri}`
          : `Adding to queue: ${info.uri}`;
        await player.play(info);
        await interaction.reply({
          content: message,
        });
      } else {
        await interaction.reply({
            content: "No results",
        });
      }
    })
    .catch(async (exception) => {
      await interaction.reply({ content: exception, ephemeral: true });
    });
};

export default {
  info,
  executor: execute,
};
