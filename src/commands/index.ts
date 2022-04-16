import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import clear from "./clear";
import pause from "./pause";
import ping from "./ping";
import play from "./play";
import search from "./search";
import queue from "./show-queue";
import stop from "./stop";
import unpause from "./unpause";
import clearQueue from "./clear-queue"
import skip from "./skip";

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
  search,
  clearQueue,
  skip
];

export default commands;
