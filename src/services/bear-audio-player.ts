import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  VoiceConnection,
} from "@discordjs/voice";
import { Collection, Guild, Snowflake } from "discord.js";
import { getYoutubeAudioResource, getYoutubeMetadata, YoutubeLink } from "./youtube";

const playerCollection = new Collection<Snowflake, BearAudioPlayer<YoutubeLink>>();

export type SongInfo<T> = {
  name: string;
  duration: string;
  uri: T;
}

const isSongInfo = (info: unknown): info is SongInfo<any> => {
  if(typeof info != 'object') {
    return false;
  }
  return "name" in (info as object) && "duration" in (info as object)
}

export type MetadataFetcher<T> = (uri: T) => Promise<SongInfo<T>>
export type SongFetcher<T> = (uri: T, config?: { durationInMili: number }) => AudioResource

class BearAudioPlayer<SongUri> {
  private _songQueue: SongInfo<SongUri>[] = [];
  private _currentSong?: SongInfo<SongUri>;

  private _connection?: VoiceConnection;

  private _audioPlayer: AudioPlayer;
  private _metadataFetcher: MetadataFetcher<SongUri>;
  private _songFetcher: SongFetcher<SongUri>;

  constructor(
    audioPlayer: AudioPlayer, 
    metadataFetcher: MetadataFetcher<SongUri>,
    songFetcher: SongFetcher<SongUri>
  ) {
    this._audioPlayer = audioPlayer;
    this._metadataFetcher = metadataFetcher;
    this._songFetcher = songFetcher;
    this._audioPlayer.on("stateChange", (state) => {
      console.log(state.status)
    })
    this._audioPlayer.on(AudioPlayerStatus.Idle, () => {
        const info = this._songQueue.pop();
        if (info) {
          this.play(info.uri);
        }
      }
    );
    this._audioPlayer.on("error", error => {
      console.log(error)
      if(this.currentSong) {
        const resource = this._songFetcher(this.currentSong.uri, {
          durationInMili: error.resource.playbackDuration
        })
        this.loadSong(this.currentSong, resource)
      }
    })
  }
  get currentSong(): SongInfo<SongUri> | undefined {
    return this._currentSong;
  }
  get songQueue(): SongInfo<SongUri>[] {
    return this._songQueue;
  }
  get empty(): boolean {
    return (
      this._audioPlayer.state.status === AudioPlayerStatus.Idle &&
      this.songQueue.length <= 0
    );
  }
  async play(uri: SongInfo<SongUri>);
  async play(uri: SongUri);
  async play(uri: unknown) {
    const info: SongInfo<SongUri> = isSongInfo(uri) ? uri : await this._metadataFetcher(uri as SongUri)
    if(this.empty) {
      this.loadSong(info, this._songFetcher(info.uri))
    } else {
      this._songQueue.push(info)
    }
  }
  pause() {
    this._audioPlayer.pause();
  }
  stop() {
    this._audioPlayer.stop();
  }
  reset() {
    this._audioPlayer.stop();
    this._songQueue = [];
  }
  unpause() {
    this._audioPlayer.unpause();
  }
  getState(): AudioPlayerStatus {
    return this._audioPlayer.state.status;
  }
  updateConnection(connection: VoiceConnection): this {
    this._connection = connection;
    return this;
  }
  private loadSong = (info: SongInfo<SongUri>, resource: AudioResource): void => {
    if (!this._connection) {
      throw new Error("no active connection for this player");
    }
    this._connection.subscribe(this._audioPlayer);
    this._audioPlayer.play(resource);
    this._currentSong = info;
  };
}

export const getPlayer = (guild: Guild, connection?: VoiceConnection) => {
  if (!playerCollection.has(guild.id)) {
    // Only youtube for now
    playerCollection.set(guild.id, new BearAudioPlayer<YoutubeLink>(
        createAudioPlayer(), 
        getYoutubeMetadata,
        getYoutubeAudioResource,
      )
    );
  }
  const player = playerCollection.get(guild.id)!;
  if (connection) {
    player.updateConnection(connection);
  }
  return player;
};
