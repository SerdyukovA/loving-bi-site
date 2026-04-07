import { promises as fs } from "node:fs";
import path from "node:path";

export type StoredPost = {
  id: string;
  sourcePostId: string;
  channelUsername: string;
  text: string;
  createdAtIso: string;
  sourcePublishedAtUnix: number | null;
  slug: string;
};

export type IncomingPostPayload = {
  source_post_id?: string | number;
  channel_username?: string;
  raw_text?: string;
  published_at_unix?: string | number;
};

const dataDir = path.join(process.cwd(), "data");
const postsFile = path.join(dataDir, "posts.json");

export function slugify(input: string): string {
  const latin = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return latin || `post-${Date.now()}`;
}

async function ensureStorage(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(postsFile);
  } catch {
    await fs.writeFile(postsFile, "[]", "utf8");
  }
}

async function readAllPosts(): Promise<StoredPost[]> {
  await ensureStorage();
  const raw = await fs.readFile(postsFile, "utf8");
  return JSON.parse(raw) as StoredPost[];
}

async function writeAllPosts(posts: StoredPost[]): Promise<void> {
  await ensureStorage();
  await fs.writeFile(postsFile, JSON.stringify(posts, null, 2), "utf8");
}

export async function getPosts(): Promise<StoredPost[]> {
  const posts = await readAllPosts();
  return posts.sort((a, b) => (a.createdAtIso < b.createdAtIso ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<StoredPost | null> {
  const posts = await readAllPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function upsertIncomingPost(payload: IncomingPostPayload): Promise<StoredPost> {
  const sourcePostId = String(payload.source_post_id ?? "").trim();
  const text = String(payload.raw_text ?? "").trim();
  const channelUsername = String(payload.channel_username ?? "").trim();
  const publishedAtRaw = payload.published_at_unix;
  const publishedAtNum =
    publishedAtRaw === undefined || publishedAtRaw === null || publishedAtRaw === ""
      ? null
      : Number(publishedAtRaw);

  if (!sourcePostId || !text || !channelUsername) {
    throw new Error("source_post_id, raw_text, channel_username are required");
  }

  const posts = await readAllPosts();
  const existing = posts.find(
    (item) => item.sourcePostId === sourcePostId && item.channelUsername === channelUsername,
  );

  if (existing) {
    existing.text = text;
    existing.sourcePublishedAtUnix = Number.isFinite(publishedAtNum) ? publishedAtNum : null;
    await writeAllPosts(posts);
    return existing;
  }

  const head = text.split("\n").find((line) => line.trim()) ?? text;
  const timePrefix = new Date().toISOString().slice(0, 10);

  const post: StoredPost = {
    id: crypto.randomUUID(),
    sourcePostId,
    channelUsername,
    text,
    createdAtIso: new Date().toISOString(),
    sourcePublishedAtUnix: Number.isFinite(publishedAtNum) ? publishedAtNum : null,
    slug: `${timePrefix}-${slugify(head).slice(0, 70)}`,
  };

  posts.push(post);
  await writeAllPosts(posts);
  return post;
}
