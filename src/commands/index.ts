import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import clear from "./clear";
import pause from "./pause";
import ping from "./ping";
import play from "./play";
import queue from "./show-queue";
import stop from "./stop";
import unpause from "./unpause";
import force from "./force";

type Command = {
  info: SlashCommandBuilder;
  executor: (interaction: CommandInteraction) => void;
};

const commands: Command[] = [
  ping,
  play,
  pause,
  stop,
  unpause,
  queue,
  clear,
  force,
];

export default commands;
