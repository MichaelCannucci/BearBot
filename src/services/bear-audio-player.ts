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

export type YoutubeLink = string & { type: "yt" };

export type YoutubeInfo = {
  name: string;
  duration: string;
  link: YoutubeLink;
};

class BearAudioPlayer {
  private _songQueue: YoutubeInfo[] = [];
  private _currentSong?: YoutubeInfo;
  private _audioPlayer: AudioPlayer;
  private _connection?: VoiceConnection;

  constructor(audioPlayer: AudioPlayer) {
    this._audioPlayer = audioPlayer;
    this._audioPlayer.on(
      "stateChange",
      (_oldState: AudioPlayerState, newState: AudioPlayerState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
          const song = this._songQueue.pop();
          if (song) {
            this.startSong(song);
          }
        }
      }
    );
  }
  get currentSong(): YoutubeInfo | undefined {
    return this._currentSong;
  }
  get songQueue(): YoutubeInfo[] {
    return this._songQueue;
  }
  get empty(): boolean {
    return (
      this._audioPlayer.state.status === AudioPlayerStatus.Idle &&
      this.songQueue.length <= 0
    );
  }
  async play(url: YoutubeLink) {
    const info = await ytdl.getBasicInfo(url);
    const shouldStart = this.empty;
    this._songQueue.push({
      name: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      link: url,
    });
    if (shouldStart) {
      // Force queue to kick off
      this._audioPlayer.emit(
        "stateChange",
        { status: AudioPlayerStatus.Idle },
        { status: AudioPlayerStatus.Idle }
      );
    }
  }
  pause() {
    this._audioPlayer.pause();
  }
  stop() {
    this._audioPlayer.stop();
  }
  unpause() {
    this._audioPlayer.unpause();
  }
  getState(): AudioPlayerStatus {
    return this._audioPlayer.state.status;
  }
  withConnection(connection: VoiceConnection): this {
    this._connection = connection;
    return this;
  }
  private startSong = (song: YoutubeInfo): void => {
    if (!this._connection) {
      throw new Error("no active connection for this player");
    }
    this._connection.subscribe(this._audioPlayer);
    this._audioPlayer.play(getAudioResource(song.link));
    this._currentSong = song;
  };
}

const getAudioResource = (url: YoutubeLink): AudioResource<null> => {
  const video = ytdl(url, {
    filter: "audioonly",
  });
  return createAudioResource(video);
};

export const getPlayer = (guild: Guild, connection?: VoiceConnection) => {
  if (!playerCollection.has(guild.id)) {
    playerCollection.set(guild.id, new BearAudioPlayer(createAudioPlayer()));
  }
  const player = playerCollection.get(guild.id)!; // we set it in the collection
  if (connection) {
    player.withConnection(connection);
  }
  return player;
};

export const isYoutubeLink = (url: string): url is YoutubeLink => {
  return /http(s)?:\/\/www.youtube.com\/.*/.test(url);
};
