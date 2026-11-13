/**
 * Scraper for t.me/s/loving_bi — fetches all posts with images
 * Usage: node scripts/scrape-telegram.mjs
 */
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHANNEL = 'loving_bi';
const OUT_JSON = path.join(__dirname, '../src/data/telegram-posts.json');
const OUT_IMGS = path.join(__dirname, '../public/tg-images');

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.mkdirSync(OUT_IMGS, { recursive: true });

function get(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      }
    }, res => {
      // follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location).then(resolve).catch(reject);
      }
      let buf = [];
      res.on('data', d => buf.push(d));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(buf), headers: res.headers }));
    }).on('error', reject);
  });
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) { resolve(true); return; }
    const mod = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    mod.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
      file.on('error', reject);
    }).on('error', err => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

function extractChannelAvatar(html) {
  const m = html.match(/tgme_page_photo_image[^>]*src="([^"]+)"/);
  return m ? m[1] : null;
}

function parseHtml(html) {
  const posts = [];
  // Split by message wrapper
  const blocks = html.split('tgme_widget_message_wrap');

  for (const block of blocks.slice(1)) {
    // Post ID
    const idMatch = block.match(/data-post="loving_bi\/(\d+)"/);
    if (!idMatch) continue;
    const postId = idMatch[1];

    // Skip polls and quizzes — they don't render meaningfully on the site
    if (block.includes('tgme_widget_message_poll') || block.includes('tgme_widget_message_quiz')) {
      console.log(`  Skipping poll/quiz post #${postId}`);
      continue;
    }

    // Date
    const dateMatch = block.match(/datetime="([^"]+)"/);
    const date = dateMatch ? dateMatch[1] : null;

    // Text — grab all text content from message_text divs
    const textMatches = [...block.matchAll(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="tgme_widget_message_reactions|<div class="tgme_widget_message_footer)/g)];
    let text = '';
    if (textMatches.length > 0) {
      // Take last match (outermost)
      const raw = textMatches[textMatches.length - 1][1];
      // Strip HTML tags
      text = raw
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // Images — extract from background-image URLs and src attributes
    // Strip user photo block first so channel avatar isn't captured as post image
    const contentBlock = block.replace(/tgme_widget_message_user_photo[\s\S]*?<\/a>/, '');
    const imgUrls = new Set();

    // background-image style URLs (from content only, not user photo)
    const bgMatches = [...contentBlock.matchAll(/background-image:url\('(https:\/\/cdn[^']+\.(?:jpg|jpeg|png|webp)[^']*)'\)/gi)];
    bgMatches.forEach(m => imgUrls.add(m[1]));

    // src= image URLs
    const srcMatches = [...contentBlock.matchAll(/src="(https:\/\/cdn[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)];
    srcMatches.forEach(m => {
      // Skip the channel avatar (small user photo)
      if (!m[1].includes('tgme_widget_message_user_photo')) {
        imgUrls.add(m[1]);
      }
    });

    // Also grab from <img src= inside photo wraps
    const imgTagMatches = [...block.matchAll(/<img[^>]+src="(https:\/\/cdn[^"]+)"/gi)];
    // Skip the first one which is usually the avatar

    // Views
    const viewsMatch = block.match(/tgme_widget_message_views[^>]*>([\d.KkMm]+)/);
    const views = viewsMatch ? viewsMatch[1] : null;

    // Reactions
    const reactions = [];
    const reactionMatches = [...block.matchAll(/<b>([^<]+)<\/b><\/i>(\d+)/g)];
    reactionMatches.forEach(m => reactions.push({ emoji: m[1], count: parseInt(m[2]) }));

    // Forwarded from
    // Bounded to the forwarded_from <div>: the old lazy `[\s\S]*?<span>` ran past the name when
    // it had no inner <span> and grabbed the views counter ("2.44K" for posts 95, 154).
    const fwdMatch = block.match(/class="tgme_widget_message_forwarded_from\b[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const forwardedFrom = fwdMatch
      ? fwdMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
          .replace(/^\s*Forwarded from\s*/i, '').trim() || null
      : null;

    posts.push({
      id: postId,
      date,
      text,
      images: [...imgUrls],
      views,
      reactions,
      forwardedFrom,
      tgUrl: `https://t.me/${CHANNEL}/${postId}`,
    });
  }

  return posts;
}

async function scrapeAll() {
  const allPosts = [];
  let before = null;
  let page = 0;

  while (true) {
    const url = before
      ? `https://t.me/s/${CHANNEL}?before=${before}`
      : `https://t.me/s/${CHANNEL}`;

    console.log(`Fetching page ${++page}: ${url}`);

    let res;
    try {
      res = await get(url);
    } catch (e) {
      console.error('Fetch error:', e.message);
      break;
    }

    const html = res.body.toString('utf8');
    const posts = parseHtml(html);

    if (posts.length === 0) {
      console.log('No more posts found, stopping.');
      break;
    }

    console.log(`  Found ${posts.length} posts`);
    allPosts.unshift(...posts); // prepend since we go backwards

    // Find next "before" value — the smallest post ID on this page
    const allBeforeVals = [...html.matchAll(/href="[^"]*before=(\d+)"/g)].map(m => parseInt(m[1]));
    const minPostId = posts.length > 0 ? Math.min(...posts.map(p => parseInt(p.id))) : null;
    const newBefore = minPostId ? String(minPostId) : null;

    if (!newBefore || newBefore === before) {
      console.log('No more pages, done.');
      break;
    }

    before = newBefore;

    // Polite delay
    await new Promise(r => setTimeout(r, 800));
  }

  // Deduplicate by ID, keep newest version
  const map = new Map();
  allPosts.forEach(p => map.set(p.id, p));
  const deduped = [...map.values()].sort((a, b) => parseInt(a.id) - parseInt(b.id));

  console.log(`\nTotal posts: ${deduped.length}`);

  // Download channel avatar (for text-only post cards)
  const avatarPath = path.join(OUT_IMGS, 'channel-avatar.jpg');
  if (!fs.existsSync(avatarPath)) {
    console.log('\nDownloading channel avatar...');
    try {
      const firstPage = await get(`https://t.me/s/${CHANNEL}`);
      const avatarUrl = extractChannelAvatar(firstPage.body.toString('utf8'));
      if (avatarUrl) {
        await downloadImage(avatarUrl, avatarPath);
        console.log('Channel avatar saved.');
      } else {
        console.log('Channel avatar URL not found in page.');
      }
    } catch (e) {
      console.warn('Failed to download channel avatar:', e.message);
    }
  }

  // Download images
  console.log('\nDownloading images...');
  let downloaded = 0, skipped = 0, failed = 0;

  // Stable filenames: <postId>_<index>.<ext>. The Telegram CDN URL hash changes on
  // every scrape, so naming files by it produced a fresh copy of every image each
  // day (22k files / 1.3 GB by 07.09.2026 while only ~130 were referenced) and
  // blew through Vercel's deployment-storage quota. Files no longer referenced
  // are purged below.
  const keep = new Set(['channel-avatar.jpg']);
  for (const post of deduped) {
    const localImages = [];
    for (const [idx, imgUrl] of post.images.entries()) {
      const ext = imgUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg';
      const filename = `${post.id}_${idx}.${ext}`;
      const destPath = path.join(OUT_IMGS, filename);
      keep.add(filename);

      try {
        const wasNew = !fs.existsSync(destPath);
        await downloadImage(imgUrl, destPath);
        if (wasNew) downloaded++; else skipped++;
        localImages.push(`/tg-images/${filename}`);
      } catch (e) {
        console.warn(`  Failed to download ${imgUrl.substring(0, 60)}: ${e.message}`);
        failed++;
        localImages.push(imgUrl); // fallback to original URL
      }

      // Small delay between downloads
      await new Promise(r => setTimeout(r, 50));
    }
    post.localImages = localImages;
  }

  console.log(`Images: ${downloaded} downloaded, ${skipped} already existed, ${failed} failed`);

  // Purge files that no post references any more (old hash-named copies, deleted posts)
  let purged = 0;
  for (const f of fs.readdirSync(OUT_IMGS)) {
    if (!keep.has(f)) { fs.unlinkSync(path.join(OUT_IMGS, f)); purged++; }
  }
  console.log(`Purged ${purged} unreferenced image files`);

  // Preserve AI-SEO enrichment (seoTitle, articleBody, faq, LinkedIn drafts, …)
  // across re-scrapes — the scraper rewrites the whole file, so without this the
  // `ai` field generated by enrich-seo.mjs would be wiped on every run.
  let prev = null;
  try {
    prev = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));
    const aiById = new Map(prev.filter(p => p.ai).map(p => [p.id, p.ai]));
    deduped.forEach(p => { const ai = aiById.get(p.id); if (ai) p.ai = ai; });
    console.log(`Preserved AI enrichment for ${aiById.size} posts`);
    // t.me/s serves the same post sometimes with the source name and sometimes with an empty
    // "Forwarded from" block — keep the last known name instead of flipping it every run.
    const fwdById = new Map(prev.filter(p => p.forwardedFrom && !/^[\d.]+[KkMm]?$/.test(p.forwardedFrom)).map(p => [p.id, p.forwardedFrom]));
    deduped.forEach(p => { if (!p.forwardedFrom && fwdById.has(p.id)) p.forwardedFrom = fwdById.get(p.id); });
  } catch {
    // no existing file yet — nothing to preserve
  }

  // Rewrite the file only when the content changed (new/edited/deleted post, new image).
  // Telegram CDN URLs in `images` are re-signed on every scrape and views/reactions tick
  // every day, so a blind rewrite produced a commit and a Vercel rebuild every single day
  // (31/31 in Oct–Nov 2026) with no new posts. Views/reactions now refresh together with
  // the next real content change.
  const contentKey = (list) => JSON.stringify(list.map(p => [p.id, p.date, p.text, p.forwardedFrom, p.localImages]));
  if (prev && contentKey(prev) === contentKey(deduped)) {
    console.log(`\nNo content changes in ${deduped.length} posts — ${OUT_JSON} left untouched (views/reactions/CDN URLs not refreshed).`);
    return;
  }

  // Save JSON
  fs.writeFileSync(OUT_JSON, JSON.stringify(deduped, null, 2), 'utf8');
  console.log(`\nSaved ${deduped.length} posts to ${OUT_JSON}`);

  // Summary
  const withImages = deduped.filter(p => p.images.length > 0).length;
  const withText = deduped.filter(p => p.text.length > 10).length;
  console.log(`Posts with images: ${withImages}`);
  console.log(`Posts with text: ${withText}`);
}

scrapeAll().catch(console.error);
