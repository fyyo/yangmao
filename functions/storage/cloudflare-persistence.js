/**
 * Cloudflare Pages 专用持久化存储模块
 * 使用 Cloudflare KV 存储完整的文章列表
 */

// 内存存储（fallback）
let memoryStorage = {
  posts: [],
  lastUpdate: Date.now()
};

/**
 * 获取已发布的文章列表
 * @param {object} env - Cloudflare Pages 环境变量
 * @returns {Promise<{posts: Array, lastUpdate: number}>}
 */
export async function getPublishedPosts(env) {
  try {
    // 使用 Cloudflare KV (在 Cloudflare Pages 环境)
    if (env && env.PUBLISHED_LINKS) {
      return await getFromCloudflareKV(env.PUBLISHED_LINKS);
    }
    
    // 降级到内存存储
    return {
      posts: [...memoryStorage.posts],
      lastUpdate: memoryStorage.lastUpdate
    };
  } catch (error) {
    console.error('读取存储失败:', error);
    return {
      posts: [],
      lastUpdate: Date.now()
    };
  }
}

/**
 * 保存已发布的文章列表
 * @param {Array} posts - 文章列表
 * @param {number} lastUpdate
 * @param {object} env - Cloudflare Pages 环境变量
 */
export async function savePublishedPosts(posts, lastUpdate, env) {
  try {
    const data = {
      posts: posts.map(post => ({
        title: post.title,
        link: post.link,
        category: post.category,
        content: post.content,
        pubDate: post.pubDate.toISOString(),
        links: post.links || [],
        images: post.images || []
      })),
      lastUpdate
    };
    
    // 保存到 Cloudflare KV
    if (env && env.PUBLISHED_LINKS) {
      await saveToCloudflareKV(data, env.PUBLISHED_LINKS);
    }
    
    // 同时保存到内存
    memoryStorage = {
      posts: [...posts],
      lastUpdate
    };
    
    console.log(`✓ 已保存 ${posts.length} 篇文章到存储`);
  } catch (error) {
    console.error('保存存储失败:', error);
  }
}

/**
 * 重置已发布记录
 * @param {object} env - Cloudflare Pages 环境变量
 */
export async function resetPublishedPosts(env) {
  await savePublishedPosts([], Date.now(), env);
  console.log('✓ 已重置所有发布记录');
}

/**
 * 从 Cloudflare KV 读取数据
 */
async function getFromCloudflareKV(kv) {
  const data = await kv.get('published_posts', { type: 'json' });
  
  if (data && data.posts) {
    return {
      posts: data.posts.map(post => ({
        ...post,
        pubDate: new Date(post.pubDate)
      })),
      lastUpdate: data.lastUpdate || Date.now()
    };
  }
  
  return {
    posts: [],
    lastUpdate: Date.now()
  };
}

/**
 * 保存到 Cloudflare KV
 */
async function saveToCloudflareKV(data, kv) {
  await kv.put('published_posts', JSON.stringify(data));
}