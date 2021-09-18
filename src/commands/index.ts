import { SlashCommandBuilder } from "@discordjs/builders";
import { Interaction } from "discord.js";
import clear from "./clear";
import ping from "./ping";
import play from "./play";

export type CommandExecutor = (interaction: Interaction) => void;

type Command = { info: SlashCommandBuilder, execute: CommandExecutor};

const commands: Command[] = [
    ping,
    play,
    clear
]

export default commands;