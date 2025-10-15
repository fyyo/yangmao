/**
 * Vercel Serverless Function - 动态生成RSS Feed（增量更新版）
 * 路径: /api/feed
 */

import { getPublishedPosts, savePublishedPosts, resetPublishedPosts } from '../src/storage/persistence.js';

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

    // 解析查询参数
    const url = new URL(req.url, `http://${req.headers.host}`);
    const showAll = url.searchParams.get('all') === 'true';
    const reset = url.searchParams.get('reset') === 'true';

    // 重置已发布记录
    if (reset) {
      await resetPublishedPosts();
      return res.status(200).json({ message: '已重置发布记录' });
    }

    // 读取上次刷新的时间点和链接记录
    const storage = await getPublishedPosts();
    const lastRefreshTime = storage.lastUpdate;
    const publishedLinks = new Set(storage.posts.map(p => p.link));
    
    // 本次刷新时间
    const currentRefreshTime = Date.now();
    console.log(`⏰ 上次刷新时间: ${new Date(lastRefreshTime).toLocaleString('zh-CN')}`);
    console.log(`⏰ 本次刷新时间: ${new Date(currentRefreshTime).toLocaleString('zh-CN')}`);

    // 爬取线报酷第一页数据
    const freshPosts = await fetchIxbkPosts();
    console.log(`🆕 从线报酷抓取到 ${freshPosts.length} 篇文章`);
    
    // 过滤出新文章（自上次刷新后的新文章）
    const newPosts = freshPosts.filter(post => !publishedLinks.has(post.link));
    const newCount = newPosts.length;
    
    console.log(`✨ 发现 ${newCount} 篇新文章（上次刷新后）`);
    
    let posts = [];
    
    // 如果有新文章，获取详情页
    if (newCount > 0) {
      posts = await fetchDetailsForPosts(newPosts);
      
      // 更新已发布记录：保存当前所有文章（用于下次判断）
      await savePublishedPosts(freshPosts, currentRefreshTime);
      
      console.log(`📤 RSS源返回 ${posts.length} 篇新文章`);
    } else {
      console.log(`📤 没有新文章，RSS源为空`);
    }
    
    // 生成RSS XML（只包含新文章，不显示统计信息）
    const rssXml = generateRSS(posts, {
      showAll: false,
      refreshTime: currentRefreshTime
    });
    
    // 动态缓存时间：60-600秒（1-10分钟）
    const randomMaxAge = Math.floor(Math.random() * 540) + 60;
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', `public, max-age=${randomMaxAge}`);
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
async function parseHtml(html) {
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
  
  // 直接按时间排序，不过滤质量
  return posts.sort((a, b) => b.pubDate - a.pubDate);
}

/**
 * 解析时间字符串
 */
function parseTime(timeStr) {
  if (!timeStr) {
    return getChinaTime();
  }
  
  // 匹配 HH:MM 格式
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    
    // 获取当前北京时间
    const chinaTime = getChinaTime();
    
    // 创建本地时间的日期对象
    const pubDate = new Date(chinaTime);
    pubDate.setHours(hour, minute, 0, 0);
    
    // 如果时间比现在晚，说明是昨天的
    if (pubDate > chinaTime) {
      pubDate.setDate(pubDate.getDate() - 1);
    }
    
    return pubDate;
  }
  
  return getChinaTime();
}

/**
 * 获取当前北京时间（Asia/Shanghai）
 */
function getChinaTime() {
  // 直接返回当前时间（服务器时间）
  return new Date();
}

/**
 * 计算质量分数
 */
function calculateQualityScore(title, content, category, comments, timeStr) {
  let score = 50; // 基础分
  
  const text = (title + ' ' + content).toLowerCase();
  
  // 正面加分
  if (text.includes('实物') || text.includes('商品')) score += 20;
  if (text.includes('话费') || text.includes('充值')) score += 15;
  if (text.includes('红包') || text.includes('现金')) score += 12;
  if (text.includes('京东') || category.includes('京东')) score += 10;
  if (text.includes('天猫') || text.includes('淘宝')) score += 10;
  if (text.includes('拼多多')) score += 10;
  
  // 评论加成
  score += Math.min(comments * 0.5, 10);
  
  // 时间加成（2小时内）
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const now = new Date();
    const hour = parseInt(match[1]);
    const currentHour = now.getHours();
    const hourDiff = Math.abs(currentHour - hour);
    if (hourDiff <= 2) score += 10;
  }
  
  // 负面扣分
  if (text.includes('砍价')) score -= 30;
  if (text.includes('拉人') || text.includes('邀请好友')) score -= 30;
  if (text.includes('助力')) score -= 25;
  if (text.includes('邀请')) score -= 20;
  if (text.includes('组队')) score -= 15;
  
  // 分类权重
  if (category.includes('京东')) score *= 1.2;
  if (category.includes('话费')) score *= 1.3;
  if (category.includes('淘宝')) score *= 1.1;
  
  return Math.round(Math.max(0, Math.min(100, score)));
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
function generateRSS(posts, stats = {}) {
  // 使用统一的刷新时间
  const refreshTime = stats.refreshTime ? new Date(stats.refreshTime) : getChinaTime();
  const now = refreshTime.toUTCString();
  
  // 简洁描述
  const description = '自动抓取线报酷最新羊毛线报，仅显示增量更新';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>羊毛线报 - 线报酷精选${stats.showAll ? ' (全部)' : ' (增量)'}</title>
    <link>https://new.ixbk.net/</link>
    <description>${description}</description>
    <language>zh-CN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="/api/feed" rel="self" type="application/rss+xml"/>
`;

  for (const post of posts) {
    const pubDate = post.pubDate.toUTCString();
    
    // 格式化内容为简洁的HTML（CDATA内部不需要转义HTML标签，只转义文本内容）
    let contentHtml = '';
    
    // 分类
    contentHtml += `<p><strong>📂 分类：</strong>${htmlEscape(post.category)}</p>`;
    contentHtml += `<hr/>`;
    
    // 主要内容
    if (post.content) {
      contentHtml += `<p>${htmlEscape(post.content).replace(/\n/g, '<br/>')}</p>`;
    }
    
    // 图片
    if (post.images && post.images.length > 0) {
      contentHtml += `<p><strong>📷 图片：</strong></p>`;
      post.images.forEach((img, i) => {
        contentHtml += `<p><img src="${htmlEscape(img)}" alt="图片${i+1}" style="max-width:100%;height:auto;"/></p>`;
      });
    }
    
    // 评论区补充
    if (post.links && post.links.length > 0) {
      contentHtml += `<hr/>`;
      contentHtml += `<p><strong>💬 评论区补充信息：</strong></p>`;
      post.links.forEach(link => {
        contentHtml += `<p>• ${htmlEscape(link)}</p>`;
      });
    }
    
    // 原文链接
    contentHtml += `<hr/>`;
    contentHtml += `<p><a href="${htmlEscape(post.link)}">🔗 查看原文</a></p>`;
    
    xml += `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${escapeXml(post.link)}</link>
      <description><![CDATA[${contentHtml}]]></description>
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

/**
 * HTML实体转义（用于CDATA内的文本内容）
 * 只转义&、"、'，不转义< >（因为在CDATA中需要保留HTML标签）
 */
function htmlEscape(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 获取详情页完整内容和评论区链接
 */
async function fetchDetailContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // 提取文章内容和图片
    const contentMatch = /<div[^>]*class="article-content"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
    let content = '';
    const images = [];
    
    if (contentMatch) {
      const articleHtml = contentMatch[1];
      
      // 先提取所有图片
      const imgPattern = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
      let imgMatch;
      while ((imgMatch = imgPattern.exec(articleHtml)) !== null) {
        images.push(imgMatch[1]);
      }
      
      // 移除脚本和样式，但保留其他内容
      content = articleHtml
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
    }
    
    // 添加图片信息
    if (images.length > 0) {
      content += '\n\n📷 图片:\n' + images.map((img, i) => `[图${i + 1}] ${img}`).join('\n');
    }
    
    // 提取原文链接
    const sourceLinkMatch = /<a[^>]*>原文地址<\/a>/i.exec(html);
    if (sourceLinkMatch) {
      const hrefMatch = /href="([^"]+)"/i.exec(sourceLinkMatch[0]);
      if (hrefMatch) {
        content += `\n\n🔗 原文链接: ${hrefMatch[1]}`;
      }
    }
    
    // 提取评论区链接
    const commentLinks = extractCommentLinks(html);
    
    return {
      content: content || '无详细内容',
      links: commentLinks,
      images: images
    };
  } catch (error) {
    console.error('获取详情页失败:', error);
    return null;
  }
}

/**
 * 从评论区提取商品链接和获取方法
 */
function extractCommentLinks(html) {
  const links = [];
  
  const commentListMatch = /<div[^>]*class="comment-list"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="pagination/i.exec(html);
  if (!commentListMatch) {
    return links;
  }
  
  const commentListHtml = commentListMatch[1];
  const commentPattern = /<div[^>]*class="ul"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="ul"|$)/gi;
  let match;
  let index = 1;
  
  while ((match = commentPattern.exec(commentListHtml)) !== null && index <= 10) {
    const commentHtml = match[1];
    const contentMatch = /<div[^>]*class="c-neirong"[^>]*>([\s\S]*?)<\/div>/i.exec(commentHtml);
    if (!contentMatch) continue;
    
    const commentContent = contentMatch[1];
    
    // 提取<a>标签链接
    const linkPattern = /<a[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkPattern.exec(commentContent)) !== null) {
      const href = linkMatch[1];
      const text = linkMatch[2].trim();
      if (href && !href.startsWith('#')) {
        links.push(`[${index}] ${text || '链接'}: ${href}`);
      }
    }
    
    // 提取纯文本URL
    const commentText = commentContent.replace(/<[^>]+>/g, ' ');
    const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
    let urlMatch;
    while ((urlMatch = urlPattern.exec(commentText)) !== null) {
      const url = urlMatch[1];
      if (!links.some(link => link.includes(url))) {
        links.push(`[${index}] ${url}`);
      }
    }
    
    // 提取包含获取方法的关键信息
    if (links.length === 0) {
      const keywords = ['口令', '密令', '链接', '进入', '搜索', '打开', '复制', '淘宝', '京东', '拼多多'];
      if (keywords.some(kw => commentText.includes(kw))) {
        const shortText = commentText.substring(0, 200).trim();
        if (shortText.length > 10) {
          links.push(`[${index}] ${shortText}`);
        }
      }
    }
    
    index++;
  }
  
  return links;
}

/**
 * 批量获取文章详情页内容
 */
async function fetchDetailsForPosts(posts) {
  console.log(`开始获取${posts.length}篇文章的详情页`);
  return await Promise.all(
    posts.map(async (post) => {
      try {
        const detail = await fetchDetailContent(post.link);
        if (detail) {
          post.content = detail.content;
          post.links = detail.links;
          post.images = detail.images;
          console.log(`✓ 获取详情成功: ${post.title.substring(0, 30)}...`);
        } else {
          console.log(`✗ 获取详情失败: ${post.title.substring(0, 30)}...`);
        }
        return post;
      } catch (error) {
        console.error(`获取详情失败 ${post.link}:`, error);
        return post;
      }
    })
  );
}