/**
 * Vercel Serverless Function - 动态生成JSON API
 * 路径: /api/posts
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
    
    // 生成JSON响应
    const jsonData = {
      title: '羊毛线报 - 线报酷精选',
      description: '自动抓取线报酷最新羊毛线报，实时更新',
      link: 'https://new.ixbk.net/',
      updated: new Date().toISOString(),
      count: posts.length,
      items: posts,
    };
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 缓存30分钟
    res.status(200).json(jsonData);
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
    
    // 提取作者
    const authorMatch = /data-louzhu="([^"]*)"/i.exec(articleHtml);
    const author = authorMatch ? authorMatch[1] : '匿名';
    
    // 提取时间
    const timeMatch = /<time[^>]*>([^<]*)<\/time>/i.exec(articleHtml);
    const timeStr = timeMatch ? timeMatch[1].trim() : '';
    
    // 提取评论数
    const commentMatch = /<span[^>]*class="badge com"[^>]*>([^<]*)<\/span>/i.exec(articleHtml);
    let comments = 0;
    if (commentMatch) {
      const numMatch = commentMatch[1].match(/\d+/);
      if (numMatch) {
        comments = parseInt(numMatch[0]);
      }
    }
    
    if (title && link) {
      posts.push({
        title: decodeHtmlEntities(title),
        url: link,
        category: category,
        content: decodeHtmlEntities(content || title),
        summary: decodeHtmlEntities(content || title).substring(0, 100),
        author: author,
        publish_time: parseTime(timeStr),
        comments: comments,
        quality_score: calculateQualityScore(title, content, category, comments, timeStr),
      });
    }
  }
  
  // 按质量分数排序并过滤低质量内容
  return posts
    .filter(post => post.quality_score >= 60)
    .sort((a, b) => b.quality_score - a.quality_score)
    .slice(0, 50);
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
 * 解析时间字符串
 */
function parseTime(timeStr) {
  if (!timeStr) return new Date().toISOString();
  
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
    
    return pubDate.toISOString();
  }
  
  return new Date().toISOString();
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