/**
 * Helper to parse various YouTube URL formats and return a clean embed URL
 */
export function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Match:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://www.youtube.com/watch?v=VIDEO_ID&t=10s&feature=share
  // - https://youtu.be/VIDEO_ID?si=xyz
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  const match = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );

  return match ? match[1] : null;
}

export function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  }
  if (url.includes("/embed/")) {
    return url;
  }
  return null;
}

export function getYouTubeThumbnailUrl(url?: string | null): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
}
