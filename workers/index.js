// Cloudflare Workers 脚本
// 用于处理RSS/JSON请求并添加缓存策略

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // 路由映射
  const routes = {
    '/feed.xml': '/output/feed.xml',
    '/feed.atom': '/output/feed.atom',
    '/feed.json': '/output/feed.json',
  }

  // 如果是RSS/JSON请求，从KV存储或源站获取
  if (routes[path]) {
    try {
      // 尝试从KV存储获取（需要配置KV命名空间）
      // const cachedData = await FEED_CACHE.get(path)
      // if (cachedData) {
      //   return new Response(cachedData, {
      //     headers: {
      //       'Content-Type': getContentType(path),
      //       'Cache-Control': 'public, max-age=300',
      //       'Access-Control-Allow-Origin': '*',
      //     }
      //   })
      // }

      // 从源站获取
      const targetPath = routes[path]
      const response = await fetch(`${url.origin}${targetPath}`)
      const data = await response.text()

      // 存储到KV（可选）
      // await FEED_CACHE.put(path, data, { expirationTtl: 300 })

      return new Response(data, {
        headers: {
          'Content-Type': getContentType(path),
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
        }
      })
    } catch (error) {
      return new Response('Feed not found', { status: 404 })
    }
  }

  // 默认返回静态文件
  return fetch(request)
}

function getContentType(path) {
  if (path.endsWith('.xml')) return 'application/xml; charset=utf-8'
  if (path.endsWith('.atom')) return 'application/atom+xml; charset=utf-8'
  if (path.endsWith('.json')) return 'application/json; charset=utf-8'
  return 'text/html; charset=utf-8'
}