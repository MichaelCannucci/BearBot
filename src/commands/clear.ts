import { SlashCommandBuilder } from "@discordjs/builders";
import { channel } from "diagnostics_channel";
import { Collection, CommandInteraction, Message, TextBasedChannels, TextChannel } from "discord.js";

const info = new SlashCommandBuilder();
info
    .setName('clear')
    .setDescription("Clear messages from a user")
    .addUserOption(option =>
        option
            .setName("target")
            .setDescription("Who to delete messages from")
            .setRequired(true)
    )

const execute = async (interaction: CommandInteraction) => {
    const target = interaction.options.getUser("target");
    const channel = interaction.channel;
    if (!channel.isText()) {
        interaction.reply({ content: "Not in a text channel", ephemeral: true })
        return;
    }
    if (!isGuildTextChannel(channel)) {
        interaction.reply({ content: "Not in server", ephemeral: true })
        return;
    }
    let fetched: Collection<string, Message>;
    do {
        let fetched = await channel.messages.fetch({
            limit: 100
        });
        fetched = fetched.filter(msg => msg.author.id === target.id);
        channel.bulkDelete(fetched);
    } while (fetched && fetched.size >= 2);
    await interaction.reply({ content: "Done!", ephemeral: true })
}

const isGuildTextChannel = (channel: TextBasedChannels): channel is TextChannel => {
    return channel.type === "GUILD_TEXT";
}

export default {
    info,
    executors: {
        command: execute
    }
}