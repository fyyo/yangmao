/**
 * Vercel Serverless Function - 动态生成RSS Feed
 * 路径: /api/feed
 */

export default async function handler(req, res) {
  try {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 爬取线报酷数据
    const posts = await fetchIxbkPosts();
    
    // 生成RSS XML
    const rssXml = generateRSS(posts);
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 缓存30分钟
    res.status(200).send(rssXml);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * 爬取线报酷首页数据
 */
async function fetchIxbkPosts() {
  const url = 'https://new.ixbk.net/';
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    return parseHtml(html);
  } catch (error) {
    console.error('爬取失败:', error);
    return [];
  }
}

/**
 * 解析HTML提取线报信息
 */
function parseHtml(html) {
  const posts = [];
  
  // 使用正则表达式提取文章列表
  const articlePattern = /<li class="article-list"[^>]*>([\s\S]*?)<\/li>/g;
  let match;
  
  while ((match = articlePattern.exec(html)) !== null) {
    const articleHtml = match[1];
    
    // 提取标题
    const titleMatch = /<a[^>]*title="([^"]*)"/i.exec(articleHtml);
    const title = titleMatch ? titleMatch[1] : '';
    
    // 提取链接
    const linkMatch = /<a[^>]*href="([^"]*)"/i.exec(articleHtml);
    let link = linkMatch ? linkMatch[1] : '';
    if (link.startsWith('/')) {
      link = `https://new.ixbk.net${link}`;
    }
    
    // 提取分类
    const categoryMatch = /data-catename="([^"]*)"/i.exec(articleHtml);
    const category = categoryMatch ? categoryMatch[1] : '未分类';
    
    // 提取内容
    const contentMatch = /data-content="([^"]*)"/i.exec(articleHtml);
    const content = contentMatch ? contentMatch[1] : '';
    
    // 提取时间
    const timeMatch = /<time[^>]*>([^<]*)<\/time>/i.exec(articleHtml);
    const timeStr = timeMatch ? timeMatch[1].trim() : '';
    
    if (title && link) {
      posts.push({
        title: decodeHtmlEntities(title),
        link: link,
        category: category,
        content: decodeHtmlEntities(content || title),
        pubDate: parseTime(timeStr),
      });
    }
  }
  
  return posts.slice(0, 50); // 返回前50条
}

/**
 * 解析时间字符串
 */
function parseTime(timeStr) {
  if (!timeStr) return new Date();
  
  // 匹配 HH:MM 格式
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const now = new Date();
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    
    const pubDate = new Date(now);
    pubDate.setHours(hour, minute, 0, 0);
    
    // 如果时间比现在晚，说明是昨天的
    if (pubDate > now) {
      pubDate.setDate(pubDate.getDate() - 1);
    }
    
    return pubDate;
  }
  
  return new Date();
}

/**
 * HTML实体解码
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  
  return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
}

/**
 * 生成RSS 2.0格式的XML
 */
function generateRSS(posts) {
  const now = new Date().toUTCString();
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>羊毛线报 - 线报酷精选</title>
    <link>https://new.ixbk.net/</link>
    <description>自动抓取线报酷最新羊毛线报，实时更新</description>
    <language>zh-CN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="/api/feed" rel="self" type="application/rss+xml"/>
`;

  for (const post of posts) {
    const pubDate = post.pubDate.toUTCString();
    xml += `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${escapeXml(post.link)}</link>
      <description><![CDATA[
        <p><strong>分类:</strong> ${post.category}</p>
        <p>${post.content}</p>
        <p><a href="${escapeXml(post.link)}" target="_blank">查看详情 →</a></p>
      ]]></description>
      <category>${post.category}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(post.link)}</guid>
    </item>`;
  }

  xml += `
  </channel>
</rss>`;

  return xml;
}

/**
 * XML转义
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}