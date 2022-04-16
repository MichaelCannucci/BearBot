import { SlashCommandBuilder } from "@discordjs/builders";
import {
  Collection,
  CommandInteraction,
  DiscordAPIError,
  Message,
  TextBasedChannel,
  TextChannel,
} from "discord.js";

const info = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Clear messages from the bot");

const execute = async (interaction: CommandInteraction) => {
  const target = interaction.client.user!;
  const channel = interaction.channel;
  if (!channel || !channel.isText()) {
    interaction.reply({ content: "Not in a text channel", ephemeral: true });
    return;
  }
  if (!isGuildTextChannel(channel)) {
    interaction.reply({ content: "Not in server", ephemeral: true });
    return;
  }
  let fetched: Collection<string, Message> = new Collection();
    do {
      let fetched = await channel.messages.fetch({
        limit: 100,
      });
      fetched = fetched.filter((msg) => msg.author.id === target.id);
      channel.bulkDelete(fetched);
    } while (fetched && fetched.size >= 2);
    await interaction.reply({ content: "Done!", ephemeral: true });
};

const isGuildTextChannel = (
  channel: TextBasedChannel
): channel is TextChannel => {
  return channel.type === "GUILD_TEXT";
};

export default {
  info,
  executor: execute,
};
