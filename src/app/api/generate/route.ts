import { NextResponse } from "next/server";
import {
  extractChannelPayload,
  extractVideoId,
  generateIdeasForChannel,
  generateIdeasForVideo,
} from "@/lib/shorts-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { error: "Please include a YouTube video or channel link." },
        { status: 400 },
      );
    }

    const videoId = extractVideoId(url);
    if (videoId) {
      const result = await generateIdeasForVideo(videoId);
      return NextResponse.json({
        type: "video",
        videoId: result.videoId,
        videoTitle: result.videoTitle,
        channelName: result.channelName,
        ideas: result.ideas,
      });
    }

    const channelPayload = extractChannelPayload(url);
    if (channelPayload) {
      const channelResult = await generateIdeasForChannel(
        channelPayload.channelId,
        channelPayload.channelIdType,
      );

      return NextResponse.json({
        type: "channel",
        channelName: channelResult.channelName,
        ideas: channelResult.ideas,
        videos: channelResult.videos.map((video) => ({
          videoId: video.videoId,
          videoTitle: video.videoTitle,
        })),
      });
    }

    return NextResponse.json(
      {
        error:
          "Unable to recognize this YouTube link. Please paste a full video or channel URL.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate ideas. Please try again." },
      { status: 500 },
    );
  }
}
