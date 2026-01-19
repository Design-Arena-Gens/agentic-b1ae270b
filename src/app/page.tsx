"use client";

import { useCallback, useMemo, useState } from "react";

type ShortsIdea = {
  clipTime: string;
  title: string;
  description: string;
  hashtags: string[];
  captions: string;
};

type GeneratorResponse =
  | {
      type: "video";
      videoId: string;
      videoTitle: string;
      channelName?: string;
      ideas: ShortsIdea[];
    }
  | {
      type: "channel";
      channelName: string;
      ideas: ShortsIdea[];
      videos: Array<{ videoId: string; videoTitle: string }>;
    };

const sampleIdeas: ShortsIdea[] = [
  {
    clipTime: "02:10-02:55",
    title: "Must-See Hook that changes everything",
    description:
      "Reveal the jaw-dropping moment where the creator flips the strategy and lands an instant win.",
    hashtags: ["#shorts", "#youtubeshorts", "#viral", "#strategy", "#moment"],
    captions:
      "⚡ They flip the game in seconds!\n🔥 Watch how the plan turns around\n🚀 Instant win energy",
  },
  {
    clipTime: "05:30-06:12",
    title: "Must-See Secret you can't miss",
    description:
      "The exact wording that gets the audience cheering—perfect for a punchy vertical cut.",
    hashtags: ["#shorts", "#youtubeshorts", "#viral", "#speech", "#motivation"],
    captions:
      "⚡ The crowd goes wild\n🔥 Save this line for your reel\n🚀 Huge reaction moment",
  },
  {
    clipTime: "08:00-08:45",
    title: "Must-See Hack to skyrocket engagement",
    description:
      "Clip the rapid-fire tips that stack value every five seconds for unstoppable watch time.",
    hashtags: ["#shorts", "#youtubeshorts", "#viral", "#tips", "#growth"],
    captions:
      "⚡ Rapid-fire gems\n🔥 No filler, just value\n🚀 Perfect 45 seconds",
  },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<GeneratorResponse | null>(null);

  const ideas = useMemo(() => {
    if (response?.ideas?.length) {
      return response.ideas;
    }
    return sampleIdeas;
  }, [response]);

  const heading = useMemo(() => {
    if (!response) {
      return "Paste a YouTube link to spark fresh Shorts ideas";
    }
    if (response.type === "video") {
      return `Shorts-ready cuts for “${response.videoTitle}”`;
    }
    return `Top channel moments from ${response.channelName}`;
  }, [response]);

  const subheading = useMemo(() => {
    if (!response) {
      return "We scan transcripts and highlight the hype moments in seconds.";
    }
    if (response.type === "video") {
      return `Channel: ${response.channelName ?? "Unknown creator"}`;
    }
    if (response.videos?.length) {
      return `Analyzed top videos: ${response.videos
        .map((video) => `“${video.videoTitle}”`)
        .join(", ")}`;
    }
    return `Channel: ${response.channelName}`;
  }, [response]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!url.trim()) {
        setError("Paste a full YouTube video or channel link.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to generate ideas.");
        }

        const data = (await res.json()) as GeneratorResponse;
        setResponse(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong. Try again in a moment.");
        }
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 pb-16 pt-24 md:px-10">
        <header className="flex flex-col gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.4em] text-cyan-400">
            Shorts assistant
          </span>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            {heading}
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">{subheading}</p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
        >
          <label className="text-sm font-medium text-slate-200" htmlFor="youtube-url">
            YouTube video or channel URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="youtube-url"
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="w-full flex-1 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-600/60 sm:text-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing…" : "Generate"}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            We only use public transcript data. No downloads. No watermark edits.
          </p>
          {error ? (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </form>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          {ideas.map((idea, index) => (
            <article
              key={`${idea.clipTime}-${index}`}
              className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur"
            >
              <span className="inline-flex w-fit rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                Clip {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-cyan-300">Clip time</p>
                <p className="text-lg font-semibold text-white">{idea.clipTime}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300">Title</p>
                <p className="text-xl font-semibold text-white">{idea.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300">Description</p>
                <p className="text-sm leading-relaxed text-slate-300">
                  {idea.description}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300">Hashtags</p>
                <p className="text-sm text-slate-300">{idea.hashtags.join(" ")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300">Captions</p>
                <pre className="whitespace-pre-wrap text-sm text-slate-200">
                  {idea.captions}
                </pre>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
