/**
 * Cloudflare Pages 专用持久化存储模块
 * 使用 Cloudflare KV 或内存存储
 */

// 内存存储（fallback）
let memoryStorage = {
  links: new Set(),
  lastUpdate: Date.now()
};

/**
 * 获取已发布的链接列表
 * @param {object} env - Cloudflare Pages 环境变量
 * @returns {Promise<{links: Set<string>, lastUpdate: number}>}
 */
export async function getPublishedLinks(env) {
  try {
    // 使用 Cloudflare KV (在 Cloudflare Pages 环境)
    if (env && env.PUBLISHED_LINKS) {
      return await getFromCloudflareKV(env.PUBLISHED_LINKS);
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
 * @param {object} env - Cloudflare Pages 环境变量
 */
export async function savePublishedLinks(links, lastUpdate, env) {
  try {
    const data = {
      links: Array.from(links),
      lastUpdate
    };
    
    // 保存到 Cloudflare KV
    if (env && env.PUBLISHED_LINKS) {
      await saveToCloudflareKV(data, env.PUBLISHED_LINKS);
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
 * @param {object} env - Cloudflare Pages 环境变量
 */
export async function resetPublishedLinks(env) {
  await savePublishedLinks(new Set(), Date.now(), env);
}

/**
 * 从 Cloudflare KV 读取数据
 */
async function getFromCloudflareKV(kv) {
  const data = await kv.get('published_links', { type: 'json' });
  
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
}

/**
 * 保存到 Cloudflare KV
 */
async function saveToCloudflareKV(data, kv) {
  await kv.put('published_links', JSON.stringify(data));
}