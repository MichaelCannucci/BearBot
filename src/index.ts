require("dotenv").config();
import { Client, Collection, CommandInteraction, Intents } from "discord.js";
import commands from "./commands";

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
});

client.once("ready", () => {
  console.log("Ready!");
});
client.login(process.env.TOKEN);

const collection = new Collection<
  string,
  (interaction: CommandInteraction) => void
>();
commands.forEach((command) => {
  collection.set(command.info.name, command.executor);
});

process.on("unhandledRejection", async (error) => {
  console.error(error);
});

process.on("uncaughtException", async (error) => {
  console.error(error);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = collection.get(interaction.commandName);

  if (!command) return;

  try {
    await command(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

// For Heroku :)
var http = require("http");

var server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("OK");
});
server.listen(process.env.PORT ?? 80);
