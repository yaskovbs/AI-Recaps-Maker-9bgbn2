import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PlaylistItemSnippet {
  title: string;
  thumbnails?: {
    medium?: { url: string };
    default?: { url: string };
  };
  resourceId?: {
    videoId: string;
  };
  position: number;
}

interface YouTubePlaylistItemResponse {
  nextPageToken?: string;
  pageInfo?: { totalResults: number };
  items?: Array<{
    snippet: PlaylistItemSnippet;
  }>;
  error?: {
    code: number;
    message: string;
  };
}

interface YouTubeVideoListResponse {
  items?: Array<{
    id: string;
    snippet: {
      title: string;
      thumbnails?: {
        medium?: { url: string };
        default?: { url: string };
      };
    };
    contentDetails?: {
      duration: string;
    };
  }>;
}

function extractPlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("list");
  } catch {
    if (/^PL[A-Za-z0-9_-]+$/.test(url)) return url;
    return null;
  }
}

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }
    return parsed.searchParams.get("v");
  } catch {
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
    return null;
  }
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h * 3600 + m * 60 + s;
}

async function fetchAllPlaylistItems(
  playlistId: string,
  apiKey: string
): Promise<
  Array<{
    videoId: string;
    title: string;
    thumbnail: string;
    position: number;
  }>
> {
  const items: Array<{
    videoId: string;
    title: string;
    thumbnail: string;
    position: number;
  }> = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: "snippet",
      playlistId,
      maxResults: "50",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
    );
    const data: YouTubePlaylistItemResponse = await res.json();

    if (data.error) {
      throw new Error(`YouTube API error: ${data.error.message}`);
    }

    if (data.items) {
      for (const item of data.items) {
        const videoId = item.snippet.resourceId?.videoId;
        if (!videoId) continue;
        items.push({
          videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.default?.url ||
            "",
          position: item.snippet.position,
        });
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

async function fetchSingleVideo(
  videoId: string,
  apiKey: string
): Promise<{
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
} | null> {
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    id: videoId,
    key: apiKey,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params}`
  );
  const data: YouTubeVideoListResponse = await res.json();

  if (!data.items || data.items.length === 0) return null;

  const item = data.items[0];
  return {
    videoId: item.id,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url ||
      "",
    duration: parseDuration(item.contentDetails?.duration || ""),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { url, youtube_api_key } = body;

    if (!url || !youtube_api_key) {
      return new Response(
        JSON.stringify({ error: "Missing url or youtube_api_key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const playlistId = extractPlaylistId(url);
    const videoId = extractVideoId(url);

    if (playlistId) {
      const items = await fetchAllPlaylistItems(playlistId, youtube_api_key);
      return new Response(
        JSON.stringify({
          type: "playlist",
          playlistId,
          items,
          totalCount: items.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (videoId) {
      const video = await fetchSingleVideo(videoId, youtube_api_key);
      if (!video) {
        return new Response(
          JSON.stringify({ error: "Video not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          type: "video",
          items: [
            {
              videoId: video.videoId,
              title: video.title,
              thumbnail: video.thumbnail,
              position: 0,
              duration: video.duration,
            },
          ],
          totalCount: 1,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid YouTube URL" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
