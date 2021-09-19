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
  getVoiceChannel(guild, user)
    .then(async (voiceChannel) => {
      const player = getPlayer(voiceChannel.guild);
      const queueEmbed = new MessageEmbed()
        .setColor("DARK_NAVY")
        .setTitle("Audio Player Queue")
        .addField(
          player.currentSong?.name ?? "No song is playing",
          player.currentSong?.link ?? ""
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
    })
    .catch(async (exception) => {
      await interaction.reply({ content: exception, ephemeral: true });
    });
};

export default {
  info,
  executor: execute,
};
