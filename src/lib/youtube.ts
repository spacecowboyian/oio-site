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

/**
 * Mock video data for development/demo purposes
 */
function getMockVideos(count: number): YouTubeVideo[] {
  const titles = [
    'First Track Day of the Season - Learning the Limits',
    'Building the Perfect Budget Track Car - Part 1',
    'Suspension Setup Guide for Beginners',
    'Race Day Prep: What You Actually Need',
    'Upgrading Brakes on a Budget',
    'My Biggest Mistakes (And What I Learned)',
    'Track Walk and Racing Line Analysis',
    'Installing a Roll Cage - Full Process',
    'Grassroots Racing: Getting Started',
    'Best Modifications for Track Performance',
  ];

  return Array.from({ length: Math.min(count, titles.length) }, (_, i) => ({
    id: `mock-video-${i}`,
    title: titles[i],
    description: 'This is a placeholder video. Configure your YouTube API credentials to see real videos.',
    thumbnail: '/placeholder-video.jpg',
    publishedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://youtube.com/@oioracing',
  }));
}

/**
 * Get YouTube embed URL for a video ID
 */
export function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
