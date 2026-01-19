const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "have",
  "this",
  "from",
  "your",
  "about",
  "just",
  "into",
  "there",
  "their",
  "what",
  "when",
  "where",
  "which",
  "would",
  "could",
  "should",
  "really",
  "https",
  "video",
  "youtube",
  "shorts",
  "youre",
  "theyre",
  "cant",
  "wont",
  "its",
  "dont",
  "doesnt",
  "ive",
  "were",
  "was",
  "them",
  "because",
  "while",
  "with",
  "will",
  "been",
  "than",
  "then",
  "into",
  "only",
  "over",
  "that",
  "other",
  "really",
  "ever",
  "even",
  "make",
  "made",
  "some",
  "more",
  "most",
  "also",
  "like",
  "know",
  "want",
]);

export function sanitizeText(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/\[[^\]]*\]/g, "").trim();
}

export function extractSentences(text: string, limit = 3): string[] {
  const cleaned = sanitizeText(text);
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length >= limit) {
    return sentences.slice(0, limit);
  }

  if (!sentences.length) {
    return cleaned ? [cleaned] : [];
  }

  // Break remaining text with commas if we still need more parts.
  const supplemental: string[] = [];
  sentences.forEach((sentence) => {
    if (supplemental.length + sentences.length >= limit) {
      return;
    }
    const clausePieces = sentence.split(/,\s+/).filter(Boolean);
    clausePieces.forEach((clause) => {
      if (sentences.length + supplemental.length < limit) {
        supplemental.push(clause.trim());
      }
    });
  });

  return [...sentences, ...supplemental].slice(0, limit);
}

export function extractKeywords(text: string, max = 6): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, max);
}

export function titleCase(text: string): string {
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatHashtags(keywords: string[]): string[] {
  const base = new Set(["#shorts", "#youtubeshorts", "#viral"]);
  keywords.forEach((keyword) => {
    const cleaned = keyword.replace(/[^a-z0-9]/gi, "");
    if (cleaned) {
      base.add(`#${cleaned}`);
    }
  });

  const fallback = ["#contentcreator", "#videotips", "#creatorhub", "#algorithm"];
  let index = 0;
  while (base.size < 5 && index < fallback.length) {
    base.add(fallback[index]);
    index += 1;
  }

  return [...base].slice(0, 7);
}

const EMOJI_SEQUENCE = ["⚡", "🔥", "🚀", "💡", "🎯", "✨", "🎬"];

export function buildCaption(sentences: string[]): string {
  return sentences
    .map((sentence, index) => {
      const emoji = EMOJI_SEQUENCE[index % EMOJI_SEQUENCE.length];
      return `${emoji} ${sentence}`;
    })
    .join("\n");
}
