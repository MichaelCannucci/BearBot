import { AudioResource, createAudioResource } from "@discordjs/voice";
import { isA } from "ts-type-checked";
import ytdl from "ytdl-core";
import ytsr, { Video } from "ytsr";
import { MetadataFetcher, SongFetcher, SongInfo } from "./bear-audio-player";

export const isYoutubeLink = (url: string): url is YoutubeLink => {
    return ytdl.validateURL(url);
};

const getRequestHeaders = () => {
return process.env.YT_COOKIE && process.env.YT_ID
    ? {
        headers: {
        cookie: process.env.YT_COOKIE,
        "x-youtube-identity-token": process.env.YT_ID,
        },
    }
    : {};
};

export const youtubeSearch = async (query: string): Promise<SongInfo<YoutubeLink>|false> => {
    const results = await ytsr(query, { limit: 10,  })
    const result = results.items.filter(value => value.type === "video").pop()
    if(isA<Video>(result) && isYoutubeLink(result.url)) {
        return {
            duration: result.duration ?? "0:00",
            name: result.title,
            uri: result.url
        }
    }
    return false
}

export const getYoutubeAudioResource: SongFetcher<YoutubeLink> = (url, config) => {
    const video = ytdl(url, {
        requestOptions: getRequestHeaders(),
        begin: (config?.durationInMili || 0) + "ms"
    });
    return createAudioResource(video);
};

export const getYoutubeMetadata: MetadataFetcher<YoutubeLink> = async (url) => {
    const info = await ytdl.getBasicInfo(url, {
        requestOptions: getRequestHeaders(),
    });
    return {
        name: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        uri: url,
    }
}

export type YoutubeLink = string & { type: "yt" };

export type YoutubeInfo = {
  name: string;
  duration: string;
  link: YoutubeLink;
};