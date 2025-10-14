/**
 * Vercel 专用持久化存储模块
 * 使用 Vercel KV 或内存存储（fallback）
 */

// 内存存储（fallback）
let memoryStorage = {
  links: new Set(),
  lastUpdate: Date.now()
};

/**
 * 获取已发布的链接列表
 * @returns {Promise<{links: Set<string>, lastUpdate: number}>}
 */
export async function getPublishedLinks() {
  try {
    // 检查是否在 Vercel 环境
    if (typeof process !== 'undefined' && process.env.KV_REST_API_URL) {
      return await getFromVercelKV();
    }
    
    // 降级到内存存储
    return {
      links: new Set(memoryStorage.links),
      lastUpdate: memoryStorage.lastUpdate
    };
  } catch (error) {
    console.error('读取存储失败:', error);
    return {
      links: new Set(),
      lastUpdate: Date.now()
    };
  }
}

/**
 * 保存已发布的链接列表
 * @param {Set<string>} links 
 * @param {number} lastUpdate 
 */
export async function savePublishedLinks(links, lastUpdate) {
  try {
    const data = {
      links: Array.from(links),
      lastUpdate
    };
    
    // 保存到 Vercel KV
    if (typeof process !== 'undefined' && process.env.KV_REST_API_URL) {
      await saveToVercelKV(data);
    }
    
    // 同时保存到内存
    memoryStorage = {
      links: new Set(links),
      lastUpdate
    };
  } catch (error) {
    console.error('保存存储失败:', error);
  }
}

/**
 * 重置已发布记录
 */
export async function resetPublishedLinks() {
  await savePublishedLinks(new Set(), Date.now());
}

/**
 * 从 Vercel KV 读取数据
 */
async function getFromVercelKV() {
  try {
    // 动态导入，避免在非 Vercel 环境构建失败
    const { kv } = await import('@vercel/kv');
    const data = await kv.get('published_links');
    
    if (data && data.links) {
      return {
        links: new Set(data.links),
        lastUpdate: data.lastUpdate || Date.now()
      };
    }
    
    return {
      links: new Set(),
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
    await kv.set('published_links', data);
  } catch (error) {
    console.warn('Vercel KV 保存失败:', error.message);
    throw error;
  }
}