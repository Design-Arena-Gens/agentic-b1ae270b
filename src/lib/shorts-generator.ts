import ytch from "yt-channel-info";
import ytdl from "ytdl-core";
import { YoutubeTranscript, type TranscriptResponse } from "youtube-transcript";
import {
  buildCaption,
  extractKeywords,
  extractSentences,
  formatHashtags,
  sanitizeText,
  titleCase,
} from "./text-utils";

const WINDOW_MIN_SECONDS = 30;
const WINDOW_MAX_SECONDS = 60;

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  score: number;
  keywords: string[];
}

export interface ShortsIdea {
  clipTime: string;
  title: string;
  description: string;
  hashtags: string[];
  captions: string;
}

export interface GenerationContext {
  videoId: string;
  videoTitle: string;
  channelName?: string;
}

const POWER_WORDS = [
  "secret",
  "ultimate",
  "powerful",
  "unbelievable",
  "surprising",
  "hack",
  "tip",
  "moment",
  "insane",
  "crazy",
  "wild",
  "perfect",
  "epic",
  "biggest",
  "smart",
  "hidden",
  "formula",
  "lesson",
  "boost",
  "master",
  "level",
  "viral",
];

const HOOK_SUFFIXES = [
  "you need to try",
  "that changes everything",
  "to remember today",
  "to post right now",
  "to skyrocket engagement",
  "you can't miss",
  "that blew my mind",
];

const FALLBACK_TIMESTAMPS: Array<[string, string]> = [
  ["00:00", "00:45"],
  ["00:45", "01:30"],
  ["01:30", "02:15"],
];

export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }
    if (parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }
    const match = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return match[1];
    }
    const idCandidate = parsed.pathname.split("/").filter(Boolean).pop();
    if (idCandidate && idCandidate.length >= 10) {
      return idCandidate;
    }
  } catch {
    // Any parsing errors fall back to manual detection.
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&].*)?$/);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export function extractChannelPayload(url: string):
  | { channelId: string; channelIdType: number }
  | null {
  const clean = url.trim();
  const handleMatch = clean.match(/youtube\.com\/@([^/?]+)/i);
  if (handleMatch) {
    return { channelId: handleMatch[1], channelIdType: 3 };
  }

  const channelMatch = clean.match(/youtube\.com\/channel\/([^/?]+)/i);
  if (channelMatch) {
    return { channelId: channelMatch[1], channelIdType: 1 };
  }

  const customMatch = clean.match(/youtube\.com\/(?:c|user)\/([^/?]+)/i);
  if (customMatch) {
    return { channelId: customMatch[1], channelIdType: 2 };
  }

  return null;
}

function formatTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function scoreText(text: string, duration: number): number {
  const words = sanitizeText(text)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  let score = words.length;
  score += (WINDOW_MAX_SECONDS - Math.abs(duration - 45)) * 0.8;

  const keywordSet = new Set(words);
  POWER_WORDS.forEach((word) => {
    if (keywordSet.has(word)) {
      score += 12;
    }
  });

  const excitementMatches = text.match(/[!?]/g);
  if (excitementMatches) {
    score += excitementMatches.length * 3;
  }

  const uppercaseBursts = text.match(/\b[A-Z]{3,}\b/g);
  if (uppercaseBursts) {
    score += uppercaseBursts.length * 4;
  }

  return score;
}

function buildSegments(transcript: TranscriptResponse[]): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  if (!transcript.length) {
    return segments;
  }

  let startIndex = 0;
  let endIndex = 0;
  let durationSum = 0;
  const total = transcript.length;

  while (startIndex < total) {
    while (endIndex < total && durationSum < WINDOW_MIN_SECONDS) {
      durationSum += transcript[endIndex].duration;
      endIndex += 1;
    }

    if (durationSum >= WINDOW_MIN_SECONDS) {
      let candidateEnd = endIndex;
      let candidateDuration = durationSum;
      while (candidateEnd <= total && candidateDuration <= WINDOW_MAX_SECONDS + 10) {
        const slice = transcript.slice(startIndex, candidateEnd);
        const text = sanitizeText(slice.map((entry) => entry.text).join(" "));
        const startTime = transcript[startIndex].offset;
        const endTime =
          slice[slice.length - 1].offset + slice[slice.length - 1].duration;
        const keywords = extractKeywords(text, 6);
        const score = scoreText(text, endTime - startTime);

        segments.push({
          start: startTime,
          end: endTime,
          text,
          keywords,
          score,
        });

        if (
          candidateEnd === total ||
          candidateDuration + transcript[candidateEnd].duration > WINDOW_MAX_SECONDS
        ) {
          break;
        }

        candidateDuration += transcript[candidateEnd].duration;
        candidateEnd += 1;
      }
    }

    durationSum -= transcript[startIndex].duration;
    startIndex += 1;
  }

  return segments
    .filter(
      (segment) =>
        segment.end - segment.start >= WINDOW_MIN_SECONDS * 0.8 &&
        segment.end - segment.start <= WINDOW_MAX_SECONDS + 2,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function buildTitle(segment: TranscriptSegment, context: GenerationContext): string {
  const sourceKeywords = segment.keywords.length
    ? segment.keywords
    : extractKeywords(segment.text, 4);
  const primeKeyword = sourceKeywords[0] ?? context.videoTitle.split(" ")[0] ?? "Clip";
  const hookSuffix =
    HOOK_SUFFIXES[segment.score % HOOK_SUFFIXES.length] ??
    "that you need to see";

  const leadWord = segment.score > 90 ? "Insane" : "Must-See";
  const base = titleCase(`${primeKeyword} ${hookSuffix}`);

  if (!context.videoTitle) {
    return `${leadWord} ${base}`;
  }

  return `${leadWord} ${base}`;
}

function buildDescription(
  segment: TranscriptSegment,
  context: GenerationContext,
): string {
  const sentences = extractSentences(segment.text, 2);
  if (sentences.length >= 2) {
    return sentences.slice(0, 2).join(" ");
  }
  const topic = segment.keywords[0] ?? context.videoTitle;
  return `Highlighting ${topic} from ${context.videoTitle}.`;
}

function segmentToIdea(
  segment: TranscriptSegment,
  context: GenerationContext,
): ShortsIdea {
  const clipTime = `${formatTimestamp(segment.start)}-${formatTimestamp(segment.end)}`;
  const sentences = extractSentences(segment.text, 3);
  const hashtags = formatHashtags(segment.keywords);

  return {
    clipTime,
    title: buildTitle(segment, context),
    description: buildDescription(segment, context),
    hashtags,
    captions: buildCaption(sentences),
  };
}

async function fetchTranscript(videoId: string): Promise<TranscriptResponse[]> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
    });
    if (transcript?.length) {
      return transcript;
    }
  } catch {
    // Swallow transcript failures and fall back to description-based suggestions.
  }
  return [];
}

async function fetchVideoDetails(videoId: string) {
  const info = await ytdl.getInfo(videoId);
  const { title, author, ownerChannelName } = info.videoDetails;
  const videoTitle = title ?? "YouTube Video";
  const channelName = ownerChannelName ?? author?.name ?? "Creator";
  const description =
    (info.videoDetails as unknown as { shortDescription?: string }).shortDescription ??
    info.videoDetails.description ??
    "";
  const lengthSeconds = Number(info.videoDetails.lengthSeconds ?? 0);

  return {
    title: videoTitle,
    channelName,
    description,
    lengthSeconds,
  };
}

function buildFallbackIdeas(context: GenerationContext, description: string): ShortsIdea[] {
  const sentences = extractSentences(description || context.videoTitle, 6);
  const ideas: ShortsIdea[] = [];

  for (let i = 0; i < 3; i += 1) {
    const sentenceChunk = sentences.slice(i * 2, i * 2 + 2).join(" ");
    const textSource = sentenceChunk || description || context.videoTitle;
    const keywords = extractKeywords(textSource, 5);
    const timestamps = FALLBACK_TIMESTAMPS[i] ?? FALLBACK_TIMESTAMPS[0];

    ideas.push({
      clipTime: `${timestamps[0]}-${timestamps[1]}`,
      title: buildTitle(
        {
          start: 0,
          end: 45,
          text: textSource,
          keywords,
          score: 60 + i * 5,
        },
        context,
      ),
      description: buildDescription(
        {
          start: 0,
          end: 45,
          text: textSource,
          keywords,
          score: 60 + i * 5,
        },
        context,
      ),
      hashtags: formatHashtags(keywords),
      captions: buildCaption(extractSentences(textSource, 3)),
    });
  }

  return ideas;
}

export interface VideoIdeasResult {
  videoId: string;
  videoTitle: string;
  channelName?: string;
  ideas: ShortsIdea[];
}

export async function generateIdeasForVideo(videoId: string): Promise<VideoIdeasResult> {
  const details = await fetchVideoDetails(videoId);
  const transcript = await fetchTranscript(videoId);
  const context: GenerationContext = {
    videoId,
    videoTitle: details.title,
    channelName: details.channelName,
  };

  let ideas: ShortsIdea[];

  if (!transcript.length) {
    ideas = buildFallbackIdeas(context, details.description);
  } else {
    const segments = buildSegments(transcript);
    ideas = segments.length
      ? segments.slice(0, 3).map((segment) => segmentToIdea(segment, context))
      : buildFallbackIdeas(context, transcript.map((entry) => entry.text).join(" "));
  }

  return {
    videoId,
    videoTitle: details.title,
    channelName: details.channelName,
    ideas,
  };
}

export async function generateIdeasForChannel(
  channelId: string,
  channelIdType = 0,
): Promise<{ channelName: string; ideas: ShortsIdea[]; videos: VideoIdeasResult[] }> {
  const response = await ytch.getChannelVideos({
    channelId,
    channelIdType,
    sortBy: "popular",
  });

  if (response.alertMessage) {
    throw new Error(response.alertMessage);
  }

  const channelName =
    response.items[0]?.author ||
    (response.items[0] as unknown as { channelName?: string })?.channelName ||
    "Channel";

  const videos = response.items.slice(0, 3);
  const results: VideoIdeasResult[] = [];

  for (const video of videos) {
    const videoIdeas = await generateIdeasForVideo(video.videoId);
    if (videoIdeas.ideas.length) {
      results.push(videoIdeas);
    }
  }

  if (!results.length) {
    throw new Error("Unable to generate ideas for this channel right now.");
  }

  const flattened = results
    .map((entry) => entry.ideas[0])
    .filter((idea): idea is ShortsIdea => Boolean(idea))
    .slice(0, 3);

  return { channelName, ideas: flattened, videos: results };
}
