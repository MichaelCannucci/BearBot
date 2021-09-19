import {
  AudioPlayer,
  AudioPlayerState,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  VoiceConnection,
} from "@discordjs/voice";
import { Collection, Guild, Snowflake } from "discord.js";
import ytdl from "ytdl-core";

const playerCollection = new Collection<Snowflake, BearAudioPlayer>();

type YoutubeLink = string & { type: "yt" };

class BearAudioPlayer {
  songQueue: YoutubeLink[];
  currentSong: YoutubeLink;
  audioPlayer: AudioPlayer;
  connection: VoiceConnection;

  constructor(audioPlayer: AudioPlayer, connection: VoiceConnection) {
    this.audioPlayer = audioPlayer;
    this.connection = connection;
    this.audioPlayer.on(
      "stateChange",
      (_oldState: AudioPlayerState, newState: AudioPlayerState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
          const song = this.songQueue.pop();
          this.audioPlayer.play(getAudioResource(song));
        }
      }
    );
  }
  play(url: YoutubeLink) {
    if (url === this.currentSong) {
      this.audioPlayer.unpause();
    }
    this.songQueue.push(url);
  }
  pause() {
    this.audioPlayer.pause();
  }
  stop() {
    this.audioPlayer.stop();
  }
}

const getAudioResource = (url: string): AudioResource<null> => {
  const video = ytdl(url, {
    filter: "audioonly",
  });
  return createAudioResource(video);
};

export const getPlayer = (guild: Guild, connection: VoiceConnection) => {
  if (!playerCollection.has(guild.id)) {
    playerCollection.set(
      guild.id,
      new BearAudioPlayer(createAudioPlayer(), connection)
    );
  }
  return playerCollection.get(guild.id);
};

export const isYoutubeLink = (url: string): url is YoutubeLink => {
  return !/http(s)?:\/\/www.youtube.com\/.*/.test(url);
};
