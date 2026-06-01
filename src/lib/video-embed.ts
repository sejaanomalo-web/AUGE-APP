// Detecta provedores de vídeo a partir da URL colada pelo personal
// e devolve embedUrl/thumbnail prontos pra renderizar preview no form.

export type VideoProvider = "youtube" | "vimeo" | "instagram" | "tiktok";

export type ParsedVideo = {
  provider: VideoProvider;
  id: string;
  embedUrl: string;
  thumbnailUrl?: string;
};

// matches youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
const YOUTUBE_RE =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;

const INSTAGRAM_RE = /instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/;

// tiktok.com/@user/video/123 ou vm.tiktok.com/SLUG
const TIKTOK_LONG_RE = /tiktok\.com\/@[^/]+\/video\/(\d+)/;
const TIKTOK_SHORT_RE = /vm\.tiktok\.com\/([a-zA-Z0-9]+)/;

export function extractYoutubeId(url: string): string | null {
  const m = url.match(YOUTUBE_RE);
  return m ? m[1] : null;
}

export function parseVideoUrl(url: string): ParsedVideo | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const yt = trimmed.match(YOUTUBE_RE);
  if (yt) {
    const id = yt[1];
    return {
      provider: "youtube",
      id,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vm = trimmed.match(VIMEO_RE);
  if (vm) {
    const id = vm[1];
    return {
      provider: "vimeo",
      id,
      embedUrl: `https://player.vimeo.com/video/${id}`,
    };
  }

  const ig = trimmed.match(INSTAGRAM_RE);
  if (ig) {
    const id = ig[1];
    return {
      provider: "instagram",
      id,
      embedUrl: `https://www.instagram.com/p/${id}/embed`,
    };
  }

  const tkLong = trimmed.match(TIKTOK_LONG_RE);
  if (tkLong) {
    const id = tkLong[1];
    return {
      provider: "tiktok",
      id,
      embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
    };
  }

  const tkShort = trimmed.match(TIKTOK_SHORT_RE);
  if (tkShort) {
    const id = tkShort[1];
    return {
      provider: "tiktok",
      id,
      embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
    };
  }

  return null;
}
