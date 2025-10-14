# 🐑 羊毛线报RSS源项目

> 智能过滤、实时抓取、增量更新的高质量羊毛线报RSS订阅服务

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare-F38020?logo=cloudflare)](https://pages.cloudflare.com)

## ✨ 特性

- 🌐 **线报酷平台** - 实时爬取线报酷(https://new.ixbk.net/)最新羊毛线报
- 🎯 **智能过滤** - 自动识别并过滤砍价、拉人等低质量内容
- 🔄 **增量更新** - 只推送新内容，避免重复，支持持久化存储
- ⚡ **实时抓取** - 每次访问动态抓取最新数据
- 📡 **多格式支持** - 同时支持RSS 2.0和JSON API
- 🎨 **Web界面** - 现代化的响应式线报展示界面
- ☁️ **Serverless架构** - 支持Vercel、Cloudflare Pages一键部署
- 🔍 **搜索过滤** - Web界面支持实时搜索和分类过滤
- 🌍 **全球加速** - CDN缓存确保访问速度
- 🔒 **开源透明** - 代码完全开源，数据处理透明可控

## 🚀 快速部署

### 方式一：Vercel部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/fyyo/yangmao)

1. 点击上方按钮或访问 [Vercel](https://vercel.com/new)
2. 导入你的GitHub仓库
3. 点击"Deploy"按钮
4. 等待部署完成（约1-2分钟）

**访问地址**：
```
Web界面: https://your-project.vercel.app/
RSS订阅: https://your-project.vercel.app/api/feed
JSON API: https://your-project.vercel.app/api/posts
```

**环境变量配置**：

无需手动配置，Vercel 会自动注入以下环境变量：
- `KV_REST_API_URL` - KV存储API地址（自动设置）
- `KV_REST_API_TOKEN` - KV存储访问令牌（自动设置）

**增量更新配置（可选）**：
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 创建 Vercel KV 存储以支持增量更新
vercel kv create published-links

# 3. 关联到项目（会自动设置环境变量）
vercel link
```

创建 KV 存储后，Vercel 会自动在项目中配置环境变量，无需手动设置。

### 方式二：Cloudflare Pages部署

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com)
2. 点击"Create a project" → 连接GitHub仓库
3. 构建设置：
   - Build command: 留空
   - Build output directory: `public`
4. 点击"Save and Deploy"

**访问地址**：
```
Web界面: https://yangmao.pages.dev/
RSS订阅: https://yangmao.pages.dev/api/feed
JSON API: https://yangmao.pages.dev/api/posts
```

**环境变量配置**：

无需手动配置环境变量，通过 KV 绑定即可。

**增量更新配置（可选）**：

1. **创建 KV 命名空间**：
   - 进入 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 导航到 **Workers & Pages** > **KV**
   - 点击 **Create namespace**
   - 命名空间名称：`PUBLISHED_LINKS`（可自定义）
   - 点击 **Add**

2. **绑定到 Pages 项目**：
   - 进入 **Workers & Pages** > 选择你的项目
   - 点击 **Settings** > **Functions**
   - 找到 **KV namespace bindings** 部分
   - 点击 **Add binding**
   - **Variable name**: `PUBLISHED_LINKS` （必须是这个名称）
   - **KV namespace**: 选择刚创建的命名空间
   - 点击 **Save**

3. **重新部署**：
   - 绑定后需要重新部署项目才能生效
   - 可以通过推送新提交或在 Dashboard 中手动触发部署

> ⚠️ **重要**：Variable name 必须设置为 `PUBLISHED_LINKS`，这是代码中硬编码的变量名。

## 🔄 增量更新功能

### 功能说明

项目支持增量更新，避免重复推送已发布的线报：

**增量模式（默认）**：
```
https://your-domain.com/api/feed
```
- 只返回自上次更新以来的新内容
- 自动记录已发布的文章链接
- RSS标题显示统计信息（新内容数、已追踪总数、更新时间）

**查看全部**：
```
https://your-domain.com/api/feed?all=true
```
- 返回所有符合质量标准的线报
- 不更新已发布记录

**重置记录**：
```
https://your-domain.com/api/feed?reset=true
```
- 清空已发布记录
- 下次访问将推送所有线报

### 存储配置

系统支持两种持久化存储方案：

#### Vercel KV（Vercel 部署）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 创建 KV 存储
vercel kv create published-links

# 3. 安装依赖
npm install @vercel/kv
```

Vercel 会自动设置环境变量：
- `KV_REST_API_URL` - KV存储REST API地址
- `KV_REST_API_TOKEN` - KV存储访问令牌

这些变量在创建 KV 存储后会自动注入到项目中，无需手动配置。

#### Cloudflare KV（Cloudflare Pages 部署）

1. 在 Cloudflare Dashboard 创建 KV 命名空间：
   - 进入 **Workers & Pages** > **KV**
   - 点击 **Create namespace**
   - 命名为 `PUBLISHED_LINKS`

2. 绑定到 Pages 项目：
   - 进入 **Workers & Pages** > 你的项目 > **Settings** > **Functions**
   - 在 **KV namespace bindings** 部分点击 **Add binding**
   - **Variable name**: `PUBLISHED_LINKS` （⚠️ 必须是这个名称）
   - **KV namespace**: 选择你创建的命名空间
   - 点击 **Save** 并重新部署项目

> **注意**：Variable name 必须精确匹配 `PUBLISHED_LINKS`，因为代码通过 `context.env.PUBLISHED_LINKS` 访问。

#### 内存存储（Fallback）

如果未配置 KV 存储，系统会自动使用内存存储（仅单次请求有效）。

### 存储数据结构

```json
{
  "links": ["https://new.ixbk.net/article/123", ...],
  "lastUpdate": 1697123456789
}
```

- 最多保留 800 条链接记录
- 超过后自动保留最新的 800 条

## 📖 工作原理

### Serverless架构

```
用户请求 → CDN边缘节点 → Serverless函数 → 实时爬取线报酷 → 返回数据
                                       ↓
                            动态CDN缓存（1-10分钟随机）
```

**关键特点**：
- ✅ 无需后端服务器
- ✅ 自动弹性扩展
- ✅ 全球CDN加速
- ✅ 零运维成本

### 目录结构

```
yangmao/
├── api/                           # Vercel Serverless Functions
│   ├── feed.js                   # RSS Feed动态生成（增量更新）
│   └── posts.js                  # JSON API动态生成
├── functions/                     # Cloudflare Pages Functions
│   ├── api/
│   │   ├── feed.js               # RSS Feed（增量更新）
│   │   └── posts.js              # JSON API
│   └── storage/
│       └── cloudflare-persistence.js  # Cloudflare KV存储
├── src/
│   ├── storage/
│   │   └── persistence.js        # Vercel KV存储
│   ├── crawlers/                 # 爬虫模块
│   ├── filters/                  # 过滤模块
│   └── rss/                      # RSS生成
├── public/
│   └── index.html                # Web界面
└── vercel.json                   # Vercel配置
```

## 🎨 Web界面功能

### 主要功能
- 📊 **统计概览** - 显示总线报数、最新更新时间、平均质量分
- 🔍 **实时搜索** - 搜索标题和内容，即时显示结果
- 🏷️ **分类过滤** - 按京东、拼多多、淘宝等分类筛选
- 📱 **响应式设计** - 完美适配手机、平板、电脑
- ⭐ **质量评分** - 每条线报显示质量星级（60-100分）
- 🕒 **时间显示** - 友好的发布时间格式
- 🎯 **快速订阅** - 一键订阅RSS源

## 🎯 智能过滤规则

### 质量评分算法

每条线报都会获得0-100分的质量评分，默认阈值60分：

**基础分**: 50分

**正面加分**:
- ✅ 实物商品 (+20分)
- ✅ 话费充值 (+15分)
- ✅ 红包现金 (+12分)
- ✅ 京东平台 (+10分)
- ✅ 天猫/淘宝 (+10分)
- ✅ 拼多多官方 (+10分)
- ✅ 2小时内发布 (+10分)
- ✅ 评论数加成 (每条+0.5分，最多+10分)

**负面扣分**:
- ❌ 需要砍价 (-30分)
- ❌ 需要拉人 (-30分)
- ❌ 需要助力 (-25分)
- ❌ 需要邀请 (-20分)
- ❌ 需要组队 (-15分)

**分类权重**:
- 京东分类 (×1.2)
- 话费分类 (×1.3)
- 淘宝分类 (×1.1)

## 📡 API文档

### RSS Feed接口
```
GET /api/feed
GET /api/feed?all=true      # 查看全部
GET /api/feed?reset=true    # 重置记录
```

**响应格式**: RSS 2.0 XML
**缓存策略**: 动态随机缓存 1-10分钟（避免缓存雪崩）
**返回内容**: 最多20条高质量线报（含详情页内容）

### JSON API接口
```
GET /api/posts
```

**响应格式**: JSON
**缓存策略**: 动态随机缓存 1-10分钟（避免缓存雪崩）

**响应示例**:
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
      "quality_score": 85
    }
  ]
}
```

## 📱 RSS阅读器推荐

- **iOS**: Reeder, NetNewsWire
- **Android**: Feedly, Inoreader
- **桌面**: Fluent Reader, Thunderbird
- **浏览器**: Feedbro, RSS Feed Reader

**推荐订阅配置**：
```
订阅地址: https://your-domain.com/api/feed
更新频率: 15-30分钟（考虑到动态缓存1-10分钟）
```

## 💰 成本说明

### 完全免费的Serverless方案

**Vercel免费额度**:
- Serverless函数: 100GB-小时/月
- 带宽: 100GB/月
- KV存储: 256MB（可选）
- ✅ 个人使用完全够用

**Cloudflare Pages免费额度**:
- Functions请求: 10万次/天
- CPU时间: 1000万ms/天
- KV存储: 1GB, 10万次读/天（可选）
- 带宽: 无限
- ✅ 最慷慨的免费额度

## 🛠️ 本地开发

```bash
# 克隆项目
git clone https://github.com/fyyo/yangmao.git
cd yangmao

# 安装依赖（用于本地测试）
pip install -r requirements.txt

# 运行Python爬虫（生成测试数据）
python main.py

# 启动本地服务器（测试Web界面）
python -m http.server 8000 -d public

# 访问 http://localhost:8000
```

## ⚠️ 免责声明

1. **法律合规**
   - 本项目仅用于技术学习和个人使用
   - 不得用于任何商业目的
   - 使用者需遵守相关法律法规

2. **爬虫礼仪**
   - 已设置合理的请求间隔（1-10分钟动态CDN缓存）
   - 不对目标网站造成压力
   - 遵守robots.txt规则
   - 只爬取首页数据，避免过度请求

3. **数据准确性**
   - 羊毛线报时效性强，请自行验证
   - 智能过滤可能存在误判
   - 注意防范虚假信息和诈骗

4. **隐私安全**
   - 参与活动时注意个人信息保护
   - 不在不可信平台留下敏感信息

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 贡献指南
1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [线报酷](https://new.ixbk.net/) - 提供羊毛线报数据来源
- [Vercel](https://vercel.com) - Serverless部署平台
- [Cloudflare Pages](https://pages.cloudflare.com) - 边缘计算平台

## 📞 反馈与支持

- 问题反馈: [GitHub Issues](https://github.com/fyyo/yangmao/issues)
- 项目主页: https://github.com/fyyo/yangmao

---

**⭐ 如果这个项目对你有帮助，请给个Star支持一下！**