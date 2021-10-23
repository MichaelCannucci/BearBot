import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getPlayer } from "../services/bear-audio-player";
import { getConnection, getVoiceChannel } from "../helper";

const info = new SlashCommandBuilder()
  .setName("force")
  .setDescription("force song to play");

const execute = async (interaction: CommandInteraction) => {
  if (!interaction?.guild?.available) return;
  const { guild, user } = interaction;
  getVoiceChannel(guild, user)
    .then(async (voiceChannel) => {
      const player = getPlayer(voiceChannel.guild, getConnection(voiceChannel));
      player.pause();
      await interaction.reply({ content: `Pausing`, ephemeral: true });
    })
    .catch(async (exception) => {
      await interaction.reply({ content: exception, ephemeral: true });
    });
};

export default {
  info,
  executor: execute,
};
