import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Posts from '@/components/Posts'
import Collab from '@/components/Collab'
import Footer from '@/components/Footer'
import { getAllTgPosts, formatDate } from '@/lib/tg-posts'

export default function Home() {
  const posts = getAllTgPosts()

  // Newest post (by id, same ordering as the feed) for the hero card
  const latest = [...posts].sort((a, b) => parseInt(b.id) - parseInt(a.id))[0]
  const latestPost = latest
    ? {
        id: latest.id,
        title: latest.ai?.seoTitle || latest.text.split('\n').map(l => l.trim()).filter(Boolean)[0] || `Пост #${latest.id}`,
        date: formatDate(latest.date),
      }
    : null

  return (
    <>
      <Nav />
      <main>
        <Hero postCount={posts.length} latestPost={latestPost} />
        <About />
        <Posts posts={posts} />
        <Collab />
      </main>
      <Footer />
    </>
  )
}
