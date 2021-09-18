require('dotenv').config();
import { Client, Collection, Intents } from 'discord.js';
import commands, {CommandExecutor} from './commands';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

client.once('ready', () => {
    console.log('Ready!');
});
client.login(process.env.TOKEN);

const collection = new Collection<string, CommandExecutor>();
commands.forEach(command => {
    collection.set(command.info.name, command.execute);
});
// 
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = collection.get(interaction.commandName);
    if (!command) return;
    try {
        await command(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});
