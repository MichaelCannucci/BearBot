import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import clear from "./clear";
import ping from "./ping";
import play from "./play";

type Command = { info: SlashCommandBuilder; executor: (interaction: CommandInteraction) => void; };

const commands: Command[] = [ping, play, clear];

export default commands;
