/**
 * Cloudflare Pages Function - 动态生成RSS Feed（增量更新版）
 * 路径: /api/feed
 */

import { getPublishedLinks, savePublishedLinks, resetPublishedLinks } from '../storage/cloudflare-persistence.js';

export async function onRequest(context) {
  try {
    // 设置CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理OPTIONS请求
    if (context.request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 解析查询参数
    const url = new URL(context.request.url);
    const showAll = url.searchParams.get('all') === 'true';
    const reset = url.searchParams.get('reset') === 'true';

    // 重置已发布记录
    if (reset) {
      await resetPublishedLinks(context.env);
      return new Response(JSON.stringify({ message: '已重置发布记录' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 读取已发布的链接
    const storage = await getPublishedLinks(context.env);
    let publishedLinks = storage.links;
    const lastUpdate = storage.lastUpdate;

    // 爬取线报酷数据
    const allPosts = await fetchIxbkPosts();
    
    // 过滤出新文章（未发布过的）
    let posts = allPosts;
    let newCount = 0;
    
    if (!showAll) {
      posts = allPosts.filter(post => !publishedLinks.has(post.link));
      newCount = posts.length;
      
      // 将新文章添加到已发布集合
      posts.forEach(post => publishedLinks.add(post.link));
      
      // 限制存储大小（最多保留800条）
      if (publishedLinks.size > 800) {
        const linksArray = Array.from(publishedLinks);
        publishedLinks = new Set(linksArray.slice(-800));
      }
      
      // 保存到持久化存储
      await savePublishedLinks(publishedLinks, Date.now(), context.env);
    }
    
    // 生成RSS XML（带统计信息）
    const rssXml = generateRSS(posts, {
      showAll,
      newCount,
      totalTracked: publishedLinks.size,
      lastUpdate: new Date(lastUpdate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    });
    
    return new Response(rssXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800', // 缓存30分钟
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
    return await parseHtml(html);
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
      const qualityScore = calculateQualityScore(title, content, category, 0, timeStr);
      
      posts.push({
        title: decodeHtmlEntities(title),
        link: link,
        category: category,
        content: decodeHtmlEntities(content || title),
        pubDate: parseTime(timeStr),
        quality_score: qualityScore,
      });
    }
  }
  
  // 按质量分数过滤并按时间排序
  const topPosts = posts
    .filter(post => post.quality_score >= 60)
    .sort((a, b) => b.pubDate - a.pubDate)
    .slice(0, 20); // 先取20条
  
  // 并发获取详情页内容
  const postsWithDetail = await Promise.all(
    topPosts.map(async (post) => {
      try {
        const detail = await fetchDetailContent(post.link);
        if (detail) {
          post.content = detail;
        }
        return post;
      } catch (error) {
        console.error(`获取详情失败 ${post.link}:`, error);
        return post;
      }
    })
  );
  
  return postsWithDetail;
}

/**
 * 解析时间字符串
 */
function parseTime(timeStr) {
  if (!timeStr) return new Date();
  
  // 匹配 HH:MM 格式
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    
    // 获取当前UTC时间
    const now = new Date();
    
    // 转换为北京时间（UTC+8）
    const chinaOffset = 8 * 60; // 8小时的分钟数
    const utcTime = now.getTime();
    const chinaTime = new Date(utcTime + chinaOffset * 60 * 1000);
    
    // 使用北京时间的年月日，设置时分秒
    const pubDate = new Date(Date.UTC(
      chinaTime.getUTCFullYear(),
      chinaTime.getUTCMonth(),
      chinaTime.getUTCDate(),
      hour - 8, // 减去8小时转回UTC
      minute,
      0,
      0
    ));
    
    // 如果时间比现在晚，说明是昨天的
    if (pubDate > now) {
      pubDate.setUTCDate(pubDate.getUTCDate() - 1);
    }
    
    return pubDate;
  }
  
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
  const now = new Date().toUTCString();
  
  // 构建描述信息
  let description = '自动抓取线报酷最新羊毛线报，实时更新';
  if (stats.showAll) {
    description += ` | 显示全部 ${posts.length} 条`;
  } else if (stats.newCount !== undefined) {
    description += ` | 本次更新: ${stats.newCount} 条新内容`;
    if (stats.totalTracked) {
      description += ` | 已追踪: ${stats.totalTracked} 条`;
    }
    if (stats.lastUpdate) {
      description += ` | 上次更新: ${stats.lastUpdate}`;
    }
  }
  
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
    xml += `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${escapeXml(post.link)}</link>
      <description><![CDATA[
        <p><strong>分类:</strong> ${post.category}</p>
        <pre>${post.content}</pre>
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
    if (commentLinks.length > 0) {
      content += '\n\n💬 评论区补充:\n' + commentLinks.join('\n');
    }
    
    return content || '无详细内容';
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
    if (links.filter(l => l.startsWith(`[${index}]`)).length === 0) {
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