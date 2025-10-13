# 🐑 羊毛线报RSS源项目

> 智能过滤、实时抓取的高质量羊毛线报RSS订阅服务

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify)](https://netlify.com)
[![Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare-F38020?logo=cloudflare)](https://pages.cloudflare.com)

## ✨ 特性

- 🌐 **线报酷平台** - 实时爬取线报酷(https://new.ixbk.net/)最新羊毛线报
- 🎯 **智能过滤** - 自动识别并过滤砍价、拉人等低质量内容
- ⚡ **实时更新** - 每次访问动态抓取最新数据，无需定时任务
- 📡 **多格式支持** - 同时支持RSS 2.0和JSON API
- 🎨 **Web界面** - 现代化的响应式线报展示界面
- ☁️ **Serverless架构** - 支持Vercel、Netlify、Cloudflare Pages一键部署
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

### 方式二：Netlify部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/fyyo/yangmao)

1. 点击上方按钮或访问 [Netlify](https://app.netlify.com/start)
2. 连接你的GitHub仓库
3. 构建设置保持默认即可
4. 点击"Deploy site"

**访问地址**：
```
Web界面: https://your-project.netlify.app/
RSS订阅: https://your-project.netlify.app/api/feed
JSON API: https://your-project.netlify.app/api/posts
```

### 方式三：Cloudflare Pages部署

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

**详细教程**: [CLOUDFLARE_PAGES_DEPLOY.md](CLOUDFLARE_PAGES_DEPLOY.md)

## 📖 工作原理

### Serverless架构

本项目采用完全Serverless架构，无需服务器维护：

```
用户请求 → CDN边缘节点 → Serverless函数 → 实时爬取线报酷 → 返回数据
                                      ↓
                               30分钟CDN缓存
```

**关键特点**：
- ✅ 无需后端服务器
- ✅ 自动弹性扩展
- ✅ 全球CDN加速
- ✅ 零运维成本

### 目录结构

```
yangmao/
├── api/                       # Vercel/Netlify Serverless Functions
│   ├── feed.js               # RSS Feed动态生成
│   └── posts.js              # JSON API动态生成
├── functions/                 # Cloudflare Pages Functions
│   └── api/
│       ├── feed.js           # RSS Feed动态生成
│       └── posts.js          # JSON API动态生成
├── public/                    # 静态网站文件
│   └── index.html            # Web界面
├── src/                       # Python源码（本地测试用）
│   ├── crawlers/             # 爬虫模块
│   ├── filters/              # 过滤模块
│   ├── rss/                  # RSS生成
│   └── config/               # 配置文件
├── vercel.json               # Vercel配置
├── netlify.toml              # Netlify配置
└── README.md                 # 项目说明
```

## 🎨 Web界面功能

访问部署后的网站，你将看到：

### 主要功能
- 📊 **统计概览** - 显示总线报数、最新更新时间、平均质量分
- 🔍 **实时搜索** - 搜索标题和内容，即时显示结果
- 🏷️ **分类过滤** - 按京东、拼多多、淘宝等分类筛选
- 📱 **响应式设计** - 完美适配手机、平板、电脑
- ⭐ **质量评分** - 每条线报显示质量星级（60-100分）
- 🕒 **时间显示** - 友好的发布时间格式
- 🎯 **快速订阅** - 一键订阅RSS源

## 📊 数据源

### 当前支持
- ✅ **线报酷** - https://new.ixbk.net/
  - 实时爬取最新线报
  - 智能过滤低质量内容
  - 质量评分算法

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
```

**响应格式**: RSS 2.0 XML  
**缓存时间**: 30分钟  
**返回内容**: 最多50条高质量线报

### JSON API接口
```
GET /api/posts
```

**响应格式**: JSON  
**缓存时间**: 30分钟

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
      "summary": "内容摘要",
      "author": "发布者",
      "publish_time": "2025-10-13T10:30:00Z",
      "comments": 10,
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

## 💰 成本说明

### 完全免费的Serverless方案

**Vercel免费额度**:
- Serverless函数: 100GB-小时/月
- 带宽: 100GB/月
- 函数执行时间: 10秒
- ✅ 个人使用完全够用

**Netlify免费额度**:
- Functions调用: 125k次/月
- 执行时间: 100小时/月
- 带宽: 100GB/月
- ✅ 轻松应对日常访问

**Cloudflare Pages免费额度**:
- Functions请求: 10万次/天
- CPU时间: 1000万ms/天
- 带宽: 无限
- ✅ 最慷慨的免费额度

## 🛠️ 本地开发

如果你想本地测试或开发：

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

**注意**: Serverless函数在本地需要使用各平台的CLI工具测试。

## ⚠️ 免责声明

1. **法律合规**
   - 本项目仅用于技术学习和个人使用
   - 不得用于任何商业目的
   - 使用者需遵守相关法律法规

2. **爬虫礼仪**
   - 已设置合理的请求间隔（30分钟CDN缓存）
   - 不对目标网站造成压力
   - 遵守robots.txt规则

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
- [Netlify](https://netlify.com) - Serverless部署平台
- [Cloudflare Pages](https://pages.cloudflare.com) - 边缘计算平台

## 📞 反馈与支持

- 问题反馈: [GitHub Issues](https://github.com/fyyo/yangmao/issues)
- 项目主页: https://github.com/fyyo/yangmao

---

**⭐ 如果这个项目对你有帮助，请给个Star支持一下！**