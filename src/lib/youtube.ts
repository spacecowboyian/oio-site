/**
 * YouTube Data API integration
 * Fetches videos from the OIO Racing YouTube channel
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

const YOUTUBE_API_KEY = import.meta.env.YOUTUBE_API_KEY || '';
const CHANNEL_ID = import.meta.env.YOUTUBE_CHANNEL_ID || '';

/**
 * Fetch latest videos from YouTube channel
 */
export async function getLatestVideos(maxResults: number = 10): Promise<YouTubeVideo[]> {
  // If no API key is set, return mock data for development
  if (!YOUTUBE_API_KEY || !CHANNEL_ID) {
    console.warn('YouTube API credentials not configured. Using mock data.');
    return getMockVideos(maxResults);
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
        `key=${YOUTUBE_API_KEY}` +
        `&channelId=${CHANNEL_ID}` +
        `&part=snippet` +
        `&order=date` +
        `&type=video` +
        `&maxResults=${maxResults}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return getMockVideos(maxResults);
  }
}

/**
 * Get the latest video from the channel
 */
export async function getLatestVideo(): Promise<YouTubeVideo | null> {
  const videos = await getLatestVideos(1);
  return videos[0] || null;
}

const REAL_VIDEOS: YouTubeVideo[] = [
  {
    id: 'hTlzo9b0UD4',
    title: 'A Little TOO Easy | GE8 Honda Fit Spark Plug Replacement',
    description: 'Turns out replacing spark plugs on a GE8 Honda Fit is embarrassingly simple. We walk through the whole job.',
    thumbnail: 'https://i.ytimg.com/vi/hTlzo9b0UD4/hqdefault.jpg',
    publishedAt: '2026-07-16T00:00:00Z',
    url: 'https://www.youtube.com/watch?v=hTlzo9b0UD4',
  },
  {
    id: 'Zsez3ccMW04',
    title: "There's Just One School in the Country for This",
    description: 'We visited McPherson College — the only school in America with an accredited automotive restoration program.',
    thumbnail: 'https://i.ytimg.com/vi/Zsez3ccMW04/hqdefault.jpg',
    publishedAt: '2026-06-22T00:00:00Z',
    url: 'https://www.youtube.com/watch?v=Zsez3ccMW04',
  },
  {
    id: 'IfmMXHCcwmI',
    title: 'BMW 2002 - Autocross Weapon! @ 2026 SCCA Spring Solo Nationals',
    description: "Doug's BMW 2002 Fergus competes at Spring Nationals in Lincoln. Ian's along for the co-drive.",
    thumbnail: 'https://i.ytimg.com/vi/IfmMXHCcwmI/hqdefault.jpg',
    publishedAt: '2026-05-27T00:00:00Z',
    url: 'https://www.youtube.com/watch?v=IfmMXHCcwmI',
  },
  {
    id: 'ZVaIcSQMfHA',
    title: 'MR2 Dies. Honda Fit Thrives! Rallycross Season Opener | Church of Combustion',
    description: 'The Goblin MR2 gives up the ghost. The Honda Fit steps up. Rallycross season is officially open.',
    thumbnail: 'https://i.ytimg.com/vi/ZVaIcSQMfHA/hqdefault.jpg',
    publishedAt: '2026-05-03T00:00:00Z',
    url: 'https://www.youtube.com/watch?v=ZVaIcSQMfHA',
  },
  {
    id: 'C21np694rV4',
    title: 'Two MR2s. One big hole. The Goblin Demands Sacrifice.',
    description: 'The Goblin MR2 has a hole in the engine. We figure out what happened and what comes next.',
    thumbnail: 'https://i.ytimg.com/vi/C21np694rV4/hqdefault.jpg',
    publishedAt: '2026-02-19T00:00:00Z',
    url: 'https://www.youtube.com/watch?v=C21np694rV4',
  },
  {
    id: 'TYYByj1Sygc',
    title: 'The Gospel of Speed | 2025 Lake Garnett Grand Prix',
    description: 'Racing on real streets in Garnett, Kansas. The Lake Garnett Grand Prix Revival is grassroots racing at its best.',
    thumbnail: 'https://i.ytimg.com/vi/TYYByj1Sygc/hqdefault.jpg',
    publishedAt: '2025-10-17T00:00:00Z',
    url: 'https://www.youtube.com/watch?v=TYYByj1Sygc',
  },
  {
    id: 'Y2gfySiHEGs',
    title: 'The Celica ST205 Has Been Called. The Dirt Will Judge. | Church of Combustion',
    description: 'The all-wheel-drive Celica ST205 makes its rallycross debut. The congregation watches.',
    thumbnail: 'https://i.ytimg.com/vi/Y2gfySiHEGs/hqdefault.jpg',
    publishedAt: '2025-12-29T00:00:00Z',
    url: 'https://www.youtube.com/watch?v=Y2gfySiHEGs',
  },
  {
    id: 'aHgw2EsZcto',
    title: 'Too Many Race Cars. Not Enough Garage. The 3D Printer Gets Involved.',
    description: 'The garage is full. The solution is organizational. The 3D printer handles it.',
    thumbnail: 'https://i.ytimg.com/vi/aHgw2EsZcto/hqdefault.jpg',
    publishedAt: '2026-01-18T00:00:00Z',
    url: 'https://www.youtube.com/watch?v=aHgw2EsZcto',
  },
  {
    id: 'LvgzZMwTIyk',
    title: '"Hot Rod" 18RG For 72 Celica? | Church of Combustion',
    description: 'The Dale project gets a wild engine option. An 18RG in a vintage Celica — is this genius or madness?',
    thumbnail: 'https://i.ytimg.com/vi/LvgzZMwTIyk/hqdefault.jpg',
    publishedAt: '2025-11-07T00:00:00Z',
    url: 'https://www.youtube.com/watch?v=LvgzZMwTIyk',
  },
  {
    id: 'wct3x2f2u70',
    title: 'Can Tractor Parts Save Our Season? | AW11 MR2 Rallycross',
    description: 'The Goblin MR2 needs parts that no one makes anymore. We found them in the farm supply aisle.',
    thumbnail: 'https://i.ytimg.com/vi/wct3x2f2u70/hqdefault.jpg',
    publishedAt: '2025-10-05T00:00:00Z',
    url: 'https://www.youtube.com/watch?v=wct3x2f2u70',
  },
];

function getMockVideos(count: number): YouTubeVideo[] {
  return REAL_VIDEOS.slice(0, Math.min(count, REAL_VIDEOS.length));
}

/**
 * Get YouTube embed URL for a video ID
 */
export function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
