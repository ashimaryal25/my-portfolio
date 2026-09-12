import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const memoryStore = new Map();

function getRedis() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return Redis.fromEnv();
    } catch (e) {
      console.error("Redis init error:", e);
    }
  }
  return null;
}

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const redis = getRedis();

  try {
    if (redis) {
      const count = (await redis.get(`likes:${slug}`)) || 0;
      return NextResponse.json({ likes: Number(count) });
    } else {
      const count = memoryStore.get(slug) || 0;
      return NextResponse.json({ likes: count, fallback: true });
    }
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json({ likes: 0, error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const redis = getRedis();

  try {
    if (redis) {
      const count = await redis.incr(`likes:${slug}`);
      return NextResponse.json({ likes: count });
    } else {
      const current = memoryStore.get(slug) || 0;
      const count = current + 1;
      memoryStore.set(slug, count);
      return NextResponse.json({ likes: count, fallback: true });
    }
  } catch (error) {
    console.error("Error incrementing likes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}