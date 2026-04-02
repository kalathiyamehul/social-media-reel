import { NextResponse } from "next/server";
import { mixVideoConcepts } from "@/lib/mix-concepts";
import type { Video } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { videos } = await request.json();

    if (!videos || !Array.isArray(videos) || videos.length < 2 || videos.length > 3) {
      return NextResponse.json(
        { error: "Please select between 2 and 3 videos to mix." },
        { status: 400 }
      );
    }

    const mixedConcept = await mixVideoConcepts(videos as Video[]);

    return NextResponse.json({ mixedConcept });
  } catch (error: any) {
    console.error("Content Mix Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mix concepts" },
      { status: 500 }
    );
  }
}
