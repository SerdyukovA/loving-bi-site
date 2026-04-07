import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPosts } from "@/lib/posts";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10 md:px-8">
      <Link href="/" className="text-sm font-semibold underline underline-offset-4">
        ← Назад к списку постов
      </Link>

      <article className="mt-6 rounded-xl border border-[#d9d9d9] bg-white p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.12em] text-[#777]">{formatDate(post.createdAtIso)}</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
          {post.text.slice(0, 120) || "Пост"}
        </h1>
        <pre className="mt-6 whitespace-pre-wrap break-words text-base leading-7 text-[#222]">
          {post.text}
        </pre>
      </article>
    </main>
  );
}
