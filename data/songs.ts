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

const songCatalog = [
  ["Beauty School", "Deftones"],
  ["Do You Dream of Me?", "Tiamat"],
  ["C'mere", "Interpol"],
  ["Unintended", "Muse"],
  ["Song #3", "Stone Sour"],
  ["Stellar", "Incubus"],
  ["Option", "††† (Crosses)"],
  ["Kiss", "Korn"],
  ["Tourniquet", "TesseracT"],
  ["All I Need", "Within Temptation"],
  ["Just Like Heaven", "The Cure"],
  ["Ever Dream", "Nightwish"],
  ["I Always Knew", "The Vaccines"],
  ["Give", "Sleep Token"],
  ["Credence", "Opeth"],
  ["Dreaming Light (Live)", "Anathema"],
  ["Benighted (Remastered)", "Opeth"],
  ["I'll Be Yours", "Placebo"],
  ["Stand Inside Your Love", "The Smashing Pumpkins"],
  ["3 Libras", "A Perfect Circle"],
  ["On Hold", "Leprous"],
  ["Sorry", "Nothing But Thieves"],
  ["Jenny", "Nothing More"],
  ["Sacrifice", "TesseracT"],
  ["Twenty One", "Wage War"],
  ["Misanthrope", "Blade and Bath"],
  ["Tears of Broken Memories", "Blade and Bath, Saad"],
  ["NAIL5", "Wage War"],
  ["Manic", "Wage War"],
  ["Hellscape", "Dead Rabbitts"],
  ["Deer In The Headlights", "The Dead Rabbitts"],
  ["Personal Forest", "Psychonaut 4"],
  ["Childhood Died", "Lost Souls"],
  ["Shot", "Blade and Bath"],
  ["Jealous", "Blade and Bath/ Decalius"],
  ["Bloody Sink", "Blade and Bath"],
  ["Tears of Broken Memories", "Blade and Bath, Saad"],
  ["Make Me Believe It (feat. Caleb Shomo)", "The Dead Rabbitts"],
  [
    "Mistake",
    "Dead Rabbitts & Escape the Fate & Lauren Babic & Judge & Jury",
  ],
  [
    "Dead Again",
    "The Dead Rabbitts",
  ],
  [
    "Misleading",
    "Dead Rabbitts, Escape the Fate, Judge & Jury",
  ],
  [
    "Meat HOOK",
    "Dead Rabbitts, Escape the Fate, Judge & Jury",
  ],
  [
    "Broken (Are Little Victories by the Ship of Life)",
    "Krobak",
  ],
  [
    "It's Snowing Like It's the End of the World",
    "Krobak",
  ],
  ["Cryingon Land", "Pylo"],
  ["NUMB", "Bleed Token"],
  ["Save me from myself", "Bleed Token"],
  ["AFRAID", "Bleed Token"],
  ["Curse or Grace", "Bleed Token"],
  ["BROKEN", "Bleed Token"],
  ["I Wasn't Enough", "Bleed Token"],
  ["Nothing Hurts Like Love", "Bleed Token"],
  [
    "Hear Them Singing (feat. Amin Yahyazadeh)",
    "Demonic Ecstasy, Amin Yahyazadeh",
  ],
  ["you_used_to_be_beautiful", "buffalo_farm"],
  ["Beneath My Skin / Mirror Image (P O R T A L S)", "TesseracT"],
  ["No Help Is Coming", "Deadlife"],
  ["Stay In My Veins", "Fraxriel"],
  ["High to Death", "Car Seat Headrest"],
  ["I Don't Care", "Violent Vira"],
  ["Burn Me With A Bible", "Violent Vira"],
  ["is that love?", "Cloudyfield"],
  ["Suicidal Thoughts", "Josh A & Iamjakehill"],
  ["unknown feelings", "Novulent"],
  ["always been you", "Novulent"],
  ["scars", "Novulent"],
  ["Dead and Beloved", "616"],
  ["I Won't See You Tonight Part 1", "Avenged Sevenfold"],
  ["I Won't See You Tonight Part 2", "Avenged Sevenfold"],
  ["So Far Away", "Avenged Sevenfold"],
  ["Requiem for My Harlequin", "Poets Of The Fall"],
  ["Late Goodbye", "Poets Of The Fall"],
  ["The Sweet Escape", "Poets of the Fall"],
  ["Carnival of Rust", "Poets of the Fall"],
  ["Late Goodbye", "Poets Of The Fall"],
  ["The Poet and the Muse", "Old Gods of Asgard"],
  ["End of Time", "Lacuna Coil"],
  ["Jealous", "Eyedress"],
  ["Colossus", "In Mourning"],
  ["Celestial Tear", "In Mourning"],
  ["Repeated Apology", "Late 9"],
  ["I Wanna Get Lost With You", "Stereophonics"],
  ["I Wanna Get Lost With You (Acoustic 2015)", "Stereophonics"],
  ["Stellar Tombs", "Draconian"],
  ["I'll Be Yours", "Placebo"],
  ["Ever Dream", "Nightwish"],
  ["C'mere", "Interpol"],
  ["Still Worth Fighting For", "My Darkest Days"],
  ["Come Undone", "My Darkest Days"],
  ["You", "Breaking Benjamin"],
  ["Awaken", "Breaking Benjamin"],
  ["Venus As A Boy", "Björk"],
  ["Zombie Apocalypse", "Mortician"],
  ["Rabid", "Mortician"],
  ["Poison", "The Symposium"],
  ["God Complex", "Violent Vira"],
  ["Lonely", "Palaye Royale"],
  ["FEEL NOTHING", "The Plot In You"],
  ["Memories Of A Broken Heart", "Crown The Empire"],
  ["Zero", "Crown The Empire"],
  ["Machines", "Crown The Empire"],
  ["The Fallout", "Crown The Empire"],
  ["Shallow", "Magnolia Park"],
  ["WORSHIP", "Magnolia Park, PLVTINUM, Vana"],
  ["Killing Season", "Thy Art Is Murder"],
  ["Brackish", "Kittie"],
  ["FEEL NOTHING", "The Plot In You"],
  ["Lately", "SETYØURSAILS"],
  ["Deadline", "SETYØURSAILS"],
] as const;

const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const songs: Song[] = songCatalog.map(([title, artist], index) => {
  const query = `${artist} ${title}`;

  return {
    id: `${slugify(title) || "song"}-${index + 1}`,
    title,
    artist,
    spotifyUrl: spotifySearch(query),
    youtubeUrl: youtubeSearch(`${query} official`),
  };
});

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
