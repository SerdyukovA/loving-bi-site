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

function parseHtml(html) {
  const posts = [];
  // Split by message wrapper
  const blocks = html.split('tgme_widget_message_wrap');

  for (const block of blocks.slice(1)) {
    // Post ID
    const idMatch = block.match(/data-post="loving_bi\/(\d+)"/);
    if (!idMatch) continue;
    const postId = idMatch[1];

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
    const imgUrls = new Set();

    // background-image style URLs
    const bgMatches = [...block.matchAll(/background-image:url\('(https:\/\/cdn[^']+\.(?:jpg|jpeg|png|webp)[^']*)'\)/gi)];
    bgMatches.forEach(m => imgUrls.add(m[1]));

    // src= image URLs
    const srcMatches = [...block.matchAll(/src="(https:\/\/cdn[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)];
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
    const fwdMatch = block.match(/tgme_widget_message_forwarded_from_name[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
    const forwardedFrom = fwdMatch ? fwdMatch[1].trim() : null;

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

  // Download images
  console.log('\nDownloading images...');
  let downloaded = 0, skipped = 0, failed = 0;

  for (const post of deduped) {
    const localImages = [];
    for (const imgUrl of post.images) {
      // Create a filename from the URL hash
      const urlHash = imgUrl.split('/').pop().split('?')[0].substring(0, 40).replace(/[^a-zA-Z0-9_-]/g, '');
      const ext = imgUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg';
      const filename = `${post.id}_${urlHash}.${ext}`;
      const destPath = path.join(OUT_IMGS, filename);

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
