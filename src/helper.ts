import {
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Guild, StageChannel, User, VoiceChannel } from "discord.js";

export const getConnection = (
  channel: VoiceChannel | StageChannel
): VoiceConnection => {
  let connection = getVoiceConnection(channel.guild.id);
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    connection.on(
      VoiceConnectionStatus.Disconnected,
      async (_oldState, _newState) => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Seems to be reconnecting to a new channel - ignore disconnect
        } catch (error) {
          // Seems to be a real disconnect which SHOULDN'T be recovered from
          connection.destroy();
        }
      }
    );
  }
  return connection;
};

export const getVoiceChannel = async (
  guild: Guild,
  user: User
): Promise<VoiceChannel | StageChannel> => {
  const voiceChannel = (await guild.channels.fetch())
    .filter((channel): channel is VoiceChannel | StageChannel =>
      channel.isVoice()
    )
    .filter((channel) => channel.members.has(user.id))
    .first();
  if (!voiceChannel) {
    return Promise.reject("You are not connected to any voice channels!");
  }
  if (!voiceChannel.joinable) {
    return Promise.reject("I can't join your voice channel");
  }
  return voiceChannel;
};
