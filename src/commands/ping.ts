import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

const info = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

const execute = async (interaction: CommandInteraction) => {
  await interaction.reply("Pong!");
};

export default {
  info,
  executors: {
    command: execute,
  },
};
