import { NextRequest, NextResponse } from "next/server";
import { upsertIncomingPost } from "@/lib/posts";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.INGEST_SECRET;
  const actualSecret = request.headers.get("x-webhook-secret");

  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "INGEST_SECRET is not set on server" },
      { status: 500 },
    );
  }

  if (!actualSecret || actualSecret !== expectedSecret) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as {
      source_post_id?: string | number;
      channel_username?: string;
      raw_text?: string;
      published_at_unix?: string | number;
    };

    const post = await upsertIncomingPost(body);
    return NextResponse.json({
      ok: true,
      post: {
        id: post.id,
        slug: post.slug,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
