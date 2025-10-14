# 持久化存储配置指南

本项目支持增量更新功能，使用持久化存储来记录已发布的线报链接，避免重复推送。

## 存储方案

系统支持三种存储后端，按优先级自动选择：

1. **Vercel KV** (Vercel 部署时推荐)
2. **Cloudflare KV** (Cloudflare Pages 部署时推荐)
3. **内存存储** (fallback，仅在单次请求内有效)

## 功能说明

### 增量更新模式（默认）

访问 `/api/feed` 时：
- 只返回**自上次更新以来的新内容**
- 自动记录已发布的文章链接
- RSS 标题显示为"羊毛线报 - 线报酷精选 (增量)"
- 描述中显示统计信息：
  - 本次更新的新内容数量
  - 已追踪的总文章数
  - 上次更新时间

### 查看全部模式

访问 `/api/feed?all=true` 时：
- 返回所有符合质量标准的线报
- 不更新已发布记录
- RSS 标题显示为"羊毛线报 - 线报酷精选 (全部)"

### 重置功能

访问 `/api/feed?reset=true` 时：
- 清空已发布记录
- 下次访问将推送所有线报
- 返回 JSON 确认消息

## Vercel 部署配置

### 1. 创建 KV 数据库

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 在项目目录下创建 KV 存储
vercel kv create published-links
```

### 2. 关联到项目

创建后，Vercel 会自动在项目中设置以下环境变量：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 3. 本地开发

在项目根目录创建 `.env` 文件：

```bash
KV_REST_API_URL="https://your-kv-url.kv.vercel-storage.com"
KV_REST_API_TOKEN="your_token_here"
```

### 4. 安装依赖

```bash
npm install @vercel/kv
```

## Cloudflare Pages 配置

### 1. 创建 KV 命名空间

在 Cloudflare Dashboard：
1. 进入 **Workers & Pages** > **KV**
2. 点击 **Create namespace**
3. 命名为 `PUBLISHED_LINKS`
4. 记录命名空间 ID

### 2. 绑定到 Pages 项目

在 `wrangler.toml` 中添加：

```toml
[[kv_namespaces]]
binding = "PUBLISHED_LINKS"
id = "your_namespace_id_here"
preview_id = "your_preview_namespace_id_here"
```

或在 Cloudflare Dashboard：
1. 进入 **Pages** > 你的项目
2. **Settings** > **Functions**
3. **KV namespace bindings**
4. 添加绑定：
   - Variable name: `PUBLISHED_LINKS`
   - KV namespace: 选择刚创建的命名空间

### 3. 本地开发

```bash
# 安装 Wrangler
npm install -g wrangler

# 本地开发模式
wrangler pages dev functions --kv PUBLISHED_LINKS
```

## 存储数据结构

存储的数据格式：

```json
{
  "links": [
    "https://new.ixbk.net/article/123",
    "https://new.ixbk.net/article/456",
    ...
  ],
  "lastUpdate": 1697123456789
}
```

- `links`: 已发布的文章链接数组（最多保留 800 条）
- `lastUpdate`: 最后更新时间戳（毫秒）

## 使用示例

### RSS 阅读器订阅

推荐配置：

```
订阅地址: https://your-domain.com/api/feed
更新频率: 30 分钟或 1 小时
```

每次更新时，RSS 阅读器只会收到新增的线报。

### 查看所有线报

如果需要查看全部历史线报（例如首次订阅时）：

```
https://your-domain.com/api/feed?all=true
```

### 重置记录

如果需要重新推送所有线报：

```bash
curl https://your-domain.com/api/feed?reset=true
```

## 故障处理

### 如果存储不工作

系统会自动降级到内存存储，但功能受限：
- 每次请求都会推送所有线报
- 无法跨请求保持状态

解决方法：
1. 检查环境变量是否正确配置
2. 确认 KV 命名空间绑定正确
3. 查看部署日志中的错误信息

### 存储空间管理

- 系统自动限制最多存储 800 条链接
- 超过后会保留最新的 800 条
- 定期清理不会影响功能

## 技术实现

持久化存储模块位于 `src/storage/persistence.js`，提供统一的 API：

```javascript
// 获取已发布链接
const { links, lastUpdate } = await getPublishedLinks();

// 保存链接
await savePublishedLinks(linksSet, timestamp);

// 重置记录
await resetPublishedLinks();
```

模块会自动检测运行环境并选择合适的存储后端。

## 性能优化

- 使用 Set 数据结构进行高效的去重判断
- 限制存储大小避免存储成本过高
- 支持 30 分钟的 HTTP 缓存减少请求
- 并发获取详情页内容提升速度

## 注意事项

1. **首次部署**：建议先访问 `?all=true` 检查功能正常
2. **数据迁移**：切换存储后端时需要手动迁移数据或重置记录
3. **成本控制**：Vercel KV 和 Cloudflare KV 都有免费额度，正常使用不会超出
4. **备份恢复**：重要时可以手动备份 KV 中的数据

## 相关文档

- [Vercel KV 文档](https://vercel.com/docs/storage/vercel-kv)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)
- [项目主文档](./README.md)