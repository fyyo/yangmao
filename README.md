# 🐑 羊毛线报RSS源项目

> 智能过滤、自动更新的高质量羊毛线报RSS订阅服务

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![GitHub Actions](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)

## ✨ 特性

- 🌐 **线报酷平台** - 爬取线报酷(https://new.ixbk.net/)高质量羊毛线报
- 🎯 **智能过滤** - 自动识别并过滤砍价、拉人等低质量内容（过滤率约8%）
- ⚡ **自动更新** - GitHub Actions每30分钟自动抓取最新线报
- 📡 **多格式支持** - 同时生成RSS 2.0、Atom 1.0和JSON API
- 🎨 **Web界面** - 现代化的响应式线报展示界面
- ☁️ **多平台部署** - 支持GitHub Pages、Vercel、Netlify、Cloudflare部署
- 🔍 **搜索过滤** - Web界面支持实时搜索和分类过滤
- 🔒 **开源透明** - 代码完全开源，数据处理透明可控

## 🚀 快速开始

### 方式一：GitHub Pages部署（推荐）

1. **Fork本项目**
   ```bash
   # 在GitHub上点击Fork按钮
   ```

2. **启用GitHub Pages**
   - 进入项目Settings → Pages
   - Source选择"Deploy from a branch"
   - Branch选择"gh-pages"
   - 保存设置

3. **配置权限**
   - 进入Settings → Actions → General
   - Workflow permissions选择"Read and write permissions"
   - 保存设置

4. **手动触发首次更新**
   - 进入Actions标签页
   - 选择"Update RSS Feed"工作流
   - 点击"Run workflow"按钮

5. **访问服务**
   ```
   Web界面: https://yourusername.github.io/zhiyuan/
   RSS订阅: https://yourusername.github.io/zhiyuan/feed.xml
   Atom订阅: https://yourusername.github.io/zhiyuan/feed.atom
   JSON API: https://yourusername.github.io/zhiyuan/feed.json
   ```

### 方式二：Vercel部署（推荐用于海外访问）

1. **导入项目**
   - 访问 https://vercel.com
   - 点击"New Project"
   - 导入你的GitHub仓库

2. **配置构建**
   - Framework Preset: 选择"Other"
   - Build Command: `python main.py`
   - Output Directory: `public`

3. **部署**
   - 点击"Deploy"按钮
   - 等待部署完成

4. **访问服务**
   ```
   Web界面: https://your-project.vercel.app/
   RSS订阅: https://your-project.vercel.app/feed.xml
   ```

### 方式三：Netlify部署

1. **导入项目**
   - 访问 https://netlify.com
   - 点击"Add new site" → "Import an existing project"
   - 连接你的GitHub仓库

2. **配置构建**
   - Build command: `python main.py`
   - Publish directory: `public`

3. **部署**
   - 点击"Deploy site"按钮

### 方式四：Cloudflare Pages部署

1. **导入项目**
   - 访问 https://pages.cloudflare.com
   - 点击"Create a project"
   - 连接你的GitHub仓库

2. **配置构建**
   - Build command: `python main.py`
   - Build output directory: `public`

3. **部署**
   - 点击"Save and Deploy"

### 方式五：本地运行（开发测试）

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/zhiyuan.git
cd zhiyuan

# 2. 安装依赖
pip install -r requirements.txt

# 3. 运行主程序（生成RSS）
python main.py

# 4. 查看生成的文件
# output/feed.xml  (RSS 2.0格式)
# output/feed.atom (Atom 1.0格式)
```

## 📖 文档

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - 完整的部署指南（GitHub Actions + Pages）

## 🎯 项目结构

```
zhiyuan/
├── src/
│   ├── crawlers/              # 爬虫模块
│   │   ├── base.py           # 爬虫基类
│   │   └── ixbk.py           # 线报酷爬虫
│   ├── filters/               # 过滤模块
│   │   └── quality_filter.py # 质量过滤器
│   ├── rss/                   # RSS生成
│   │   └── generator.py      # RSS/Atom/JSON生成器
│   └── config/                # 配置文件
│       └── settings.py       # 数据源配置
├── public/                    # Web界面
│   └── index.html            # 线报展示页面
├── workers/                   # Cloudflare Workers
│   └── index.js              # Worker脚本
├── .github/
│   └── workflows/
│       └── update-rss.yml    # RSS更新+部署工作流
├── output/                    # 数据输出目录
│   ├── feed.xml              # RSS 2.0格式
│   ├── feed.atom             # Atom 1.0格式
│   └── feed.json             # JSON API
├── vercel.json                # Vercel配置
├── netlify.toml               # Netlify配置
├── wrangler.toml              # Cloudflare配置
├── _redirects                 # Cloudflare重定向
├── main.py                    # 主程序入口
├── requirements.txt           # Python依赖
└── README.md                  # 项目说明
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
- 🎯 **快速订阅** - 一键订阅RSS/Atom源

### 界面预览
- 顶部导航栏：Logo、RSS订阅、JSON API、GitHub链接
- 统计卡片：总数、更新时间、平均分
- 搜索框：实时搜索功能
- 分类按钮：动态生成的分类筛选器
- 线报卡片：标题、分类、内容、质量分、发布时间

## 🔧 配置说明

主要配置在 `src/config/settings.py` 和 `main.py` 中：

```python
# 数据源配置（settings.py）
DATA_SOURCES = {
    "ixbk": {
        "name": "线报酷",
        "url": "https://new.ixbk.net/",
        "enabled": True
    }
}

# 过滤器配置
QUALITY_THRESHOLD = 60         # 质量分数阈值（0-100）

# RSS配置（main.py）
max_items = 100                # 最多输出100条线报
```

### 自定义配置

如需修改更新频率，编辑 `.github/workflows/update-rss.yml`:

```yaml
schedule:
  - cron: '*/30 * * * *'  # 每30分钟（可修改）
```

## 📊 数据源

### 当前支持
- ✅ **线报酷** - https://new.ixbk.net/
  - 实时爬取最新100条线报
  - 智能过滤低质量内容
  - 平均过滤率14%

### 扩展支持（欢迎贡献）
- 🔜 其他羊毛线报平台
- 🔜 微博羊毛博主
- 🔜 Telegram羊毛频道

## 🎨 智能过滤规则

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
- ❌ 24小时外 (-10分)

**分类权重**:
- 京东分类 (×1.2)
- 话费分类 (×1.3)
- 淘宝分类 (×1.1)

### 过滤效果

根据实测数据（100条线报）：
- 过滤掉14条低质量内容（14%过滤率）
- 平均质量分数：72.3分
- 输出86条高质量线报

## 📱 访问地址

部署完成后，使用以下URL访问：

### GitHub Pages
```
Web界面: https://yourusername.github.io/zhiyuan/
RSS订阅: https://yourusername.github.io/zhiyuan/feed.xml
Atom订阅: https://yourusername.github.io/zhiyuan/feed.atom
JSON API: https://yourusername.github.io/zhiyuan/feed.json
```

### Vercel/Netlify/Cloudflare
```
Web界面: https://your-project.vercel.app/
RSS订阅: https://your-project.vercel.app/feed.xml
Atom订阅: https://your-project.vercel.app/feed.atom
JSON API: https://your-project.vercel.app/feed.json
```

**说明**:
- GitHub Pages：将 `yourusername` 替换为你的GitHub用户名
- 其他平台：替换为你的项目域名

### 推荐的RSS阅读器
- **iOS**: Reeder, NetNewsWire
- **Android**: Feedly, Inoreader
- **桌面**: Fluent Reader, Thunderbird
- **浏览器**: Feedbro, RSS Feed Reader

## 💰 成本说明

### GitHub Actions + Pages方案（当前使用）
- **费用**: 完全免费 ✨
- **限额**:
  - Actions: 2000分钟/月（公开仓库无限）
  - Pages: 100GB流量/月
  - 存储: 1GB
- **适用**: 个人使用，完全够用
- **优势**:
  - 零成本
  - 零维护
  - 自动化
  - 稳定可靠

## 🛠️ 开发指南

### 测试爬虫

```bash
# 测试线报酷爬虫
python test_ixbk.py

# 测试质量过滤器
python test_filter.py

# 测试RSS生成
python test_rss.py
```

### 添加新数据源

1. 在 `src/crawlers/` 创建新的爬虫类：

```python
# src/crawlers/new_source.py
from typing import List, Dict
from .base import BaseCrawler

class NewSourceCrawler(BaseCrawler):
    """新数据源爬虫"""
    
    async def crawl(self) -> List[Dict]:
        """
        爬取线报数据
        
        Returns:
            线报列表，每个线报包含:
            - title: 标题
            - url: 链接
            - publish_time: 发布时间
            - category: 分类
            - comment_count: 评论数（可选）
        """
        # 实现爬取逻辑
        posts = []
        # ...
        return posts
```

2. 在 `src/config/settings.py` 中注册新数据源
3. 在 `main.py` 中添加爬虫实例化
4. 运行测试验证

## ⚠️ 免责声明与注意事项

1. **法律合规**
   - 本项目仅用于技术学习和个人使用
   - 不得用于任何商业目的
   - 使用者需遵守相关法律法规
   - 尊重原网站的版权和robots.txt规则

2. **爬虫礼仪**
   - 已设置合理的请求间隔（每30分钟）
   - 不对目标网站造成压力
   - 遵守目标网站的使用条款

3. **数据准确性**
   - 羊毛线报时效性强，实际参与前请自行验证
   - 智能过滤可能存在误判，建议人工复核
   - 注意防范虚假信息和诈骗活动
   - 本项目不对线报真实性负责

4. **隐私安全**
   - 参与活动时注意个人信息保护
   - 不要在不可信平台留下敏感信息
   - 谨慎授权第三方应用

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

感谢以下开源项目和平台：

- [线报酷](https://new.ixbk.net/) - 提供羊毛线报数据来源
- [feedgen](https://github.com/lkiesow/python-feedgen) - Python RSS/Atom生成库
- [httpx](https://www.python-httpx.org/) - 现代化的HTTP客户端
- [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/) - HTML解析库
- [loguru](https://github.com/Delgan/loguru) - 优雅的日志库
- [GitHub Actions](https://github.com/features/actions) - 免费的CI/CD平台
- [GitHub Pages](https://pages.github.com/) - 免费的静态网站托管

## 📞 反馈与支持

- 问题反馈: [GitHub Issues](https://github.com/yourusername/zhiyuan/issues)
- 功能建议: [GitHub Discussions](https://github.com/yourusername/zhiyuan/discussions)
- 项目主页: https://github.com/yourusername/zhiyuan

---

**⭐ 如果这个项目对你有帮助，请给个Star支持一下！**