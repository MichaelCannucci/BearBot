import { CommandInteraction, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getPlayer } from "../services/bear-audio-player";
import { getConnection, getVoiceChannel } from "../helper";

const info = new SlashCommandBuilder()
  .setName("show-queue")
  .setDescription("Show songs current in the queue");

const execute = async (interaction: CommandInteraction) => {
  if (!interaction?.guild?.available) return;
  const player = getPlayer(interaction.guild);
  if(player.empty) {
    await interaction.reply({ content: "No songs are in the queue" });
    return;
  }
  const nowPlayingName = player.currentSong?.name ?? "N/A";
  const queueEmbed = new MessageEmbed()
    .setColor("DARK_NAVY")
    .setTitle("Audio Player Queue")
    .addField(
      `Now Playing: ${nowPlayingName}`,
      player.currentSong?.uri ?? "N/A"
    )
    .addFields(
      player.songQueue.map((info, index) => {
        return {
          name: `(${++index}) ${info.name}`,
          value: info.uri,
        };
      })
    );
  await interaction.reply({ embeds: [queueEmbed] });
};

export default {
  info,
  executor: execute,
};
