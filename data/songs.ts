export type ExternalMusicUrl = `https://${string}`;

export type Song = {
  id: string;
  title: string;
  artist: string;
  note?: string;
  sharedOn?: string;
  favorite?: boolean;
} & (
  | {
      spotifyUrl: ExternalMusicUrl;
      youtubeUrl?: ExternalMusicUrl;
    }
  | {
      spotifyUrl?: ExternalMusicUrl;
      youtubeUrl: ExternalMusicUrl;
    }
);

const spotifySearch = (query: string): ExternalMusicUrl =>
  `https://open.spotify.com/search/${encodeURIComponent(query)}`;

const youtubeSearch = (query: string): ExternalMusicUrl =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

export const songs: Song[] = [
  {
    id: "protection",
    title: "Protection",
    artist: "Alcest",
    spotifyUrl: spotifySearch("Alcest Protection"),
    youtubeUrl: youtubeSearch("Alcest Protection official"),
    note: "For the nights that felt enormous, and somehow still gentle.",
    sharedOn: "2025-02-14",
    favorite: true,
  },
  {
    id: "feral-love",
    title: "Feral Love",
    artist: "Chelsea Wolfe",
    spotifyUrl: spotifySearch("Chelsea Wolfe Feral Love"),
    youtubeUrl: youtubeSearch("Chelsea Wolfe Feral Love official"),
    note: "A little darkness, held with both hands.",
    sharedOn: "2025-03-01",
  },
  {
    id: "entombed",
    title: "Entombed",
    artist: "Deftones",
    spotifyUrl: spotifySearch("Deftones Entombed"),
    youtubeUrl: youtubeSearch("Deftones Entombed official"),
    note: "The kind of song that makes a room feel infinite.",
    sharedOn: "2025-03-18",
  },
  {
    id: "love-you-to-death",
    title: "Love You to Death",
    artist: "Type O Negative",
    spotifyUrl: spotifySearch("Type O Negative Love You to Death"),
    youtubeUrl: youtubeSearch("Type O Negative Love You to Death official"),
    note: "Dramatic in exactly the right way.",
    sharedOn: "2025-04-04",
    favorite: true,
  },
  {
    id: "the-love-you-want",
    title: "The Love You Want",
    artist: "Sleep Token",
    spotifyUrl: spotifySearch("Sleep Token The Love You Want"),
    youtubeUrl: youtubeSearch("Sleep Token The Love You Want official"),
    note: "A beautiful ache, sent after midnight.",
    sharedOn: "2025-04-22",
  },
  {
    id: "my-twin",
    title: "My Twin",
    artist: "Katatonia",
    spotifyUrl: spotifySearch("Katatonia My Twin"),
    youtubeUrl: youtubeSearch("Katatonia My Twin official"),
    note: "Still circling back to this one.",
    sharedOn: "2025-05-09",
  },
];

export function primarySongUrl(song: Song): ExternalMusicUrl {
  return song.spotifyUrl ?? song.youtubeUrl;
}

export function validateSongs(collection: Song[]): void {
  const ids = new Set<string>();

  for (const song of collection) {
    if (ids.has(song.id)) {
      throw new Error(`Duplicate song id: ${song.id}`);
    }
    ids.add(song.id);

    const links = [
      ["spotify", song.spotifyUrl],
      ["youtube", song.youtubeUrl],
    ] as const;

    for (const [service, value] of links) {
      if (!value) continue;

      const url = new URL(value);
      if (url.protocol !== "https:") {
        throw new Error(`${song.id}: ${service} URL must use HTTPS`);
      }

      const validHost =
        service === "spotify"
          ? url.hostname === "open.spotify.com"
          : url.hostname === "www.youtube.com" ||
            url.hostname === "youtube.com" ||
            url.hostname === "youtu.be";

      if (!validHost) {
        throw new Error(`${song.id}: invalid ${service} host`);
      }
    }
  }
}

validateSongs(songs);
