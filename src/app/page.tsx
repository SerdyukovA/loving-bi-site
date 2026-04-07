import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Posts from '@/components/Posts'
import Collab from '@/components/Collab'
import Footer from '@/components/Footer'
import { getAllTgPosts } from '@/lib/tg-posts'

export default function Home() {
  const posts = getAllTgPosts()

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Posts posts={posts} />
        <Collab />
      </main>
      <Footer />
    </>
  )
}
