import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction } from "discord.js";
import clear from "./clear";
import ping from "./ping";
import play from "./play";

export type Executors = {
    command?: (interaction: CommandInteraction) => void,
    button?: (interaction: ButtonInteraction) => void
}

type Command = { info: SlashCommandBuilder, executors: Executors };

const commands: Command[] = [
    ping,
    play,
    clear
]

export default commands;