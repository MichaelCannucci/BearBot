import { CommandInteraction, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getPlayer } from "../services/bear-audio-player";
import { getConnection, getVoiceChannel } from "../helper";

const info = new SlashCommandBuilder()
  .setName("show-queue")
  .setDescription("Show songs current in the queue");

const execute = async (interaction: CommandInteraction) => {
  if (!interaction?.guild?.available) return;
  const { guild, user } = interaction;
  const player = getPlayer(interaction.guild);
  const nowPlayingName = player.currentSong?.name ?? "N/A";
  const queueEmbed = new MessageEmbed()
    .setColor("DARK_NAVY")
    .setTitle("Audio Player Queue")
    .addField(
      `Now Playing: ${nowPlayingName}`,
      player.currentSong?.link ?? "N/A"
    )
    .addFields(
      player.songQueue.map((info, index) => {
        return {
          name: `(${index++}) info.name`,
          value: info.link,
        };
      })
    );
  await interaction.reply({ embeds: [queueEmbed] });
};

export default {
  info,
  executor: execute,
};
