require("dotenv").config();
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import commands from "../commands";

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN!);

console.log(`deploying for ${process.env.GUILD_ID || "All"}`);
console.log(`deploying: ${commands.map((x) => x.info.name).join(",")}`);

(async () => {
  try {
    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(
          process.env.CLIENT_ID!,
          process.env.GUILD_ID
        )
      : Routes.applicationCommands(process.env.CLIENT_ID!);
    await rest.put(route, {
      body: Array.from(
        commands.map((command) => command.info.toJSON()).values()
      ),
    });
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error(error);
  }
})();
