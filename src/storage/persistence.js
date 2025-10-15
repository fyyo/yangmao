/**
 * Vercel 专用持久化存储模块
 * 使用 Vercel KV 存储完整的文章列表
 */

// 内存存储（fallback）
let memoryStorage = {
  posts: [],
  lastUpdate: Date.now()
};

/**
 * 获取已发布的文章列表
 * @returns {Promise<{posts: Array, lastUpdate: number}>}
 */
export async function getPublishedPosts() {
  try {
    // 检查是否在 Vercel 环境
    if (typeof process !== 'undefined' && process.env.KV_REST_API_URL) {
      return await getFromVercelKV();
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
 */
export async function savePublishedPosts(posts, lastUpdate) {
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
    
    // 保存到 Vercel KV
    if (typeof process !== 'undefined' && process.env.KV_REST_API_URL) {
      await saveToVercelKV(data);
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
 */
export async function resetPublishedPosts() {
  await savePublishedPosts([], Date.now());
  console.log('✓ 已重置所有发布记录');
}

/**
 * 从 Vercel KV 读取数据
 */
async function getFromVercelKV() {
  try {
    // 动态导入，避免在非 Vercel 环境构建失败
    const { kv } = await import('@vercel/kv');
    const data = await kv.get('published_posts');
    
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
  } catch (error) {
    console.warn('Vercel KV 读取失败，使用内存存储:', error.message);
    throw error;
  }
}

/**
 * 保存到 Vercel KV
 */
async function saveToVercelKV(data) {
  try {
    const { kv } = await import('@vercel/kv');
    await kv.set('published_posts', data);
  } catch (error) {
    console.warn('Vercel KV 保存失败:', error.message);
    throw error;
  }
}