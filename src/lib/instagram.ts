/**
 * Instagram Basic Display API integration
 * Fetches recent posts from the OIO Racing Instagram account
 */

export interface InstagramPost {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
}

const INSTAGRAM_ACCESS_TOKEN = import.meta.env.INSTAGRAM_ACCESS_TOKEN || '';

/**
 * Fetch latest Instagram posts
 */
export async function getLatestPosts(limit: number = 12): Promise<InstagramPost[]> {
  // If no access token is set, return mock data for development
  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.warn('Instagram API credentials not configured. Using mock data.');
    return getMockPosts(limit);
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/me/media?` +
        `fields=id,caption,media_type,media_url,permalink,timestamp` +
        `&limit=${limit}` +
        `&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    return getMockPosts(limit);
  }
}

/**
 * Mock Instagram posts for development/demo purposes
 */
function getMockPosts(count: number): InstagramPost[] {
  const captions = [
    'Track day prep 🏁',
    'New suspension setup looking clean',
    'Race weekend vibes',
    'Testing the new build',
    'Behind the scenes',
    'Got the car dialed in',
    'Shakedown run complete',
    'Making progress on the build',
    'Track walk before the session',
    'Post-race debrief',
    'Working on the setup',
    'Ready for the next event',
  ];

  return Array.from({ length: Math.min(count, captions.length) }, (_, i) => ({
    id: `mock-post-${i}`,
    caption: captions[i],
    media_type: 'IMAGE' as const,
    media_url: '/placeholder-instagram.jpg',
    permalink: 'https://instagram.com/oioracing',
    timestamp: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
