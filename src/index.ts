require("dotenv").config();
import {
  ButtonInteraction,
  Client,
  Collection,
  CommandInteraction,
  Intents,
} from "discord.js";
import commands, { Executors } from "./commands";

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
});

const hasCommandConext = (context: any): context is { command: string } => {
  return context.command !== undefined && typeof context.command === "string";
};

client.once("ready", () => {
  console.log("Ready!");
});
client.login(process.env.TOKEN);

const collection = new Collection<string, Executors>();
commands.forEach((command) => {
  collection.set(command.info.name, command.executors);
});

client.on("interactionCreate", async (interaction) => {
  // Probably an better way to do this
  if (interaction.isCommand()) {
    try {
      const command = collection.get(interaction.commandName).command;
      await command(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  } else if (interaction.isButton()) {
    try {
      const context = JSON.parse(interaction.customId);
      if (hasCommandConext(context)) {
        const command = collection.get(context.command).button;
        await command(interaction);
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});
