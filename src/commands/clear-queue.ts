import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getPlayer } from "../services/bear-audio-player";
import { getConnection, getVoiceChannel } from "../helper";

const info = new SlashCommandBuilder()
  .setName("clear-queue")
  .setDescription("Clear all queued songs and stop player");

const execute = async (interaction: CommandInteraction) => {
  if (!interaction?.guild?.available) return;
  const { guild, user } = interaction;
  getVoiceChannel(guild, user)
    .then(async (voiceChannel) => {
      const player = getPlayer(voiceChannel.guild, getConnection(voiceChannel));
      player.reset();
      await interaction.reply({ content: `Songs cleared`, ephemeral: true });
    })
    .catch(async (exception) => {
      await interaction.reply({ content: exception, ephemeral: true });
    });
};

export default {
  info,
  executor: execute,
};
