# Cloudflare Pages 部署指南（动态实时抓取版）

## ✨ 特性说明

本项目部署到Cloudflare Pages后，会通过**Cloudflare Pages Functions**实时从线报酷抓取最新数据：

- 🔄 **实时抓取** - 每次访问都从源站获取最新线报
- ⚡ **边缘缓存** - 30分钟CDN缓存，平衡实时性与性能
- 🌍 **全球加速** - Cloudflare全球CDN节点加速访问
- 🚀 **无需后端** - 纯Serverless架构，零服务器维护

## 📋 部署步骤

### 1. 连接GitHub仓库

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com)
2. 登录你的Cloudflare账号
3. 点击 "Create a project"
4. 选择 "Connect to Git"
5. 授权并选择你的GitHub仓库：`fyyo/yangmao`

### 2. 配置构建设置

在 "Set up builds and deployments" 页面，按以下配置：

**Framework preset**: `None`

**Build settings**:
- **Build command**: 留空（不需要构建）
- **Build output directory**: `public`

**Environment variables** (可选):
```
PYTHON_VERSION = 3.9
```

### 3. 高级设置（可选）

**Root directory**: 留空（使用根目录）

**Build watch paths**: 保持默认

### 4. 部署

点击 "Save and Deploy" 按钮，等待构建完成（约2-3分钟）。

## 🌐 访问你的站点

部署成功后，你将获得以下URL：

```
Web界面: https://yangmao.pages.dev
RSS订阅: https://yangmao.pages.dev/api/feed
JSON API: https://yangmao.pages.dev/api/posts
```

**重要说明**：
- `/api/feed` - 动态RSS 2.0格式，实时抓取最新线报
- `/api/posts` - 动态JSON API，包含质量评分和过滤
- Web界面会自动从动态API加载数据
- 所有接口都有30分钟CDN缓存

> 注意：Cloudflare会自动分配一个 `.pages.dev` 子域名，你也可以绑定自定义域名。

## 🔄 工作原理

### Cloudflare Pages Functions

项目使用Cloudflare Pages Functions实现动态内容：

1. **用户访问** `/api/feed` 或 `/api/posts`
2. **Function触发** - Cloudflare边缘节点执行JavaScript函数
3. **实时爬取** - 函数从线报酷抓取最新数据
4. **智能过滤** - 应用质量评分算法，过滤低质量内容
5. **生成响应** - 返回RSS或JSON格式数据
6. **CDN缓存** - 结果缓存30分钟，减少源站压力

### Functions文件结构

```
functions/
├── api/
│   ├── feed.js    # RSS Feed动态生成
│   └── posts.js   # JSON API动态生成
```

这些文件会被Cloudflare Pages自动识别并部署为Serverless函数。

## 🎯 API接口说明

### RSS Feed接口
```
GET /api/feed
```

**响应格式**: RSS 2.0 XML
**缓存时间**: 30分钟
**返回内容**:
- 最多50条高质量线报
- 包含标题、分类、内容、发布时间
- 自动过滤砍价、拉人等低质量内容

### JSON API接口
```
GET /api/posts
```

**响应格式**: JSON
**缓存时间**: 30分钟
**返回字段**:
```json
{
  "title": "羊毛线报 - 线报酷精选",
  "updated": "2025-10-13T12:00:00Z",
  "count": 50,
  "items": [
    {
      "title": "线报标题",
      "url": "线报链接",
      "category": "分类",
      "content": "完整内容",
      "summary": "内容摘要",
      "author": "发布者",
      "publish_time": "发布时间",
      "comments": 评论数,
      "quality_score": 质量分数(60-100)
    }
  ]
}
```

## 🔧 自定义域名（可选）

1. 在Cloudflare Pages项目页面点击 "Custom domains"
2. 点击 "Set up a custom domain"
3. 输入你的域名（例如：`yangmao.example.com`）
4. 按照提示配置DNS记录
5. 等待DNS生效（通常几分钟）

## 📊 监控和管理

### 查看部署历史
- 在Cloudflare Pages项目页面可以查看所有部署记录
- 每次GitHub推送都会触发新的部署

### 查看构建日志
- 点击具体的部署记录可以查看详细的构建日志
- 如果构建失败，日志中会显示错误信息

### 回滚到之前的版本
- 在部署历史中选择之前的成功部署
- 点击 "Rollback to this deployment"

## ⚙️ 环境变量配置（如需要）

如果需要配置环境变量：

1. 进入项目设置页面
2. 找到 "Environment variables" 部分
3. 添加所需的变量，例如：
   ```
   PYTHON_VERSION = 3.9
   ```

## 🚀 性能优化

Cloudflare Pages自动提供：
- ✅ 全球CDN加速
- ✅ 自动HTTPS证书
- ✅ HTTP/2支持
- ✅ 自动Brotli压缩
- ✅ 无限带宽（免费计划）

## 📝 注意事项

1. **首次部署**可能需要3-5分钟
2. **后续更新**通常1-2分钟即可完成
3. **免费计划限制**：
   - 500次构建/月
   - 无限请求数
   - 20,000个文件
   - 25MB单文件大小限制

4. **构建超时**：如果构建时间超过20分钟会失败（本项目通常1-2分钟）

## 🐛 常见问题

### Q: 构建失败，提示找不到Python？
A: 在环境变量中添加 `PYTHON_VERSION = 3.9`

### Q: 页面404错误？
A: 检查Build output directory是否设置为 `public`

### Q: API返回空数据？
A: 检查Function日志，可能是线报酷网站结构变化或访问限制

### Q: 如何查看Function日志？
A: 在Cloudflare Pages项目页面 → Functions标签 → 查看实时日志

### Q: 如何强制重新构建？
A: 在GitHub仓库中随便修改一个文件并提交，或在Cloudflare Pages中点击 "Retry deployment"

## 📞 获取帮助

如遇问题，可以：
- 查看 [Cloudflare Pages文档](https://developers.cloudflare.com/pages/)
- 在项目GitHub上提Issue
- 查看构建日志排查问题

---

**提示**：动态API模式下，无需GitHub Actions定时任务，每次访问都能获取最新数据。CDN缓存确保性能的同时，也降低了对源站的访问压力。