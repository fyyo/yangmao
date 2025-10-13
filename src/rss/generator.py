"""
RSS生成器模块
用于将过滤后的线报数据生成RSS 2.0格式的feed和JSON数据
"""
from typing import List, Dict, Optional
from datetime import datetime
from feedgen.feed import FeedGenerator
from pathlib import Path
import pytz
import json
from loguru import logger


class RSSGenerator:
    """RSS Feed生成器"""
    
    def __init__(
        self,
        title: str = "高质量羊毛线报",
        link: str = "https://new.ixbk.net/",
        description: str = "精选高质量羊毛线报，自动过滤低质量内容",
        language: str = "zh-CN"
    ):
        """
        初始化RSS生成器
        
        Args:
            title: Feed标题
            link: Feed链接
            description: Feed描述
            language: Feed语言
        """
        self.title = title
        self.link = link
        self.description = description
        self.language = language
        
    def create_feed(self, posts: List[Dict]) -> FeedGenerator:
        """
        创建RSS Feed
        
        Args:
            posts: 线报数据列表
            
        Returns:
            FeedGenerator对象
        """
        # 创建feed生成器
        fg = FeedGenerator()
        
        # 设置feed基本信息
        fg.id(self.link)  # Atom格式需要的唯一ID
        fg.title(self.title)
        fg.link(href=self.link, rel='alternate')
        fg.description(self.description)
        fg.language(self.language)
        fg.generator('羊毛线报RSS生成器 v1.0')
        
        # 设置更新时间为当前时间
        tz = pytz.timezone('Asia/Shanghai')
        fg.lastBuildDate(datetime.now(tz))
        fg.pubDate(datetime.now(tz))
        
        # 添加线报条目
        for post in posts:
            self._add_entry(fg, post)
            
        logger.info(f"成功创建RSS Feed，包含 {len(posts)} 条线报")
        return fg
    
    def _add_entry(self, fg: FeedGenerator, post: Dict) -> None:
        """
        添加单个线报条目到Feed
        
        Args:
            fg: FeedGenerator对象
            post: 线报数据
        """
        fe = fg.add_entry()
        
        # 设置条目基本信息
        fe.title(post['title'])
        fe.link(href=post['url'])
        
        # 构建描述内容（包含质量评分）
        description = self._build_description(post)
        fe.description(description)
        
        # 设置发布时间
        if post.get('publish_time'):
            try:
                pub_time = post['publish_time']
                # 如果是字符串，则解析；如果已经是datetime对象，则直接使用
                if isinstance(pub_time, str):
                    pub_time = self._parse_publish_time(pub_time)
                # 确保有时区信息
                if pub_time.tzinfo is None:
                    tz = pytz.timezone('Asia/Shanghai')
                    pub_time = tz.localize(pub_time)
                fe.pubDate(pub_time)
            except Exception as e:
                logger.warning(f"解析发布时间失败: {e}")
                # 使用当前时间
                tz = pytz.timezone('Asia/Shanghai')
                fe.pubDate(datetime.now(tz))
        
        # 设置分类
        if post.get('category'):
            fe.category(term=post['category'])
        
        # 设置作者
        if post.get('author'):
            fe.author({'name': post['author']})
            
        # 设置唯一ID（使用URL作为GUID）
        fe.guid(post['url'], permalink=True)
        
    def _build_description(self, post: Dict) -> str:
        """
        构建线报描述内容（仅包含核心信息，无额外操作链接）
        
        Args:
            post: 线报数据
            
        Returns:
            格式化的HTML描述文本
        """
        parts = []
        
        # 添加分类信息（如果有）
        if post.get('category'):
            category_text = f"📂 {post['category']}"
            parts.append(f"<b>{category_text}</b><br />")
        
        # 添加主要内容（线报详情）
        if post.get('content'):
            # 将换行符转换为<br />
            content_html = post['content'].replace('\n', '<br />')
            parts.append(content_html)
        
        return '\n'.join(parts)
    
    def _get_score_emoji(self, score: float) -> str:
        """
        根据分数获取对应的emoji
        
        Args:
            score: 质量评分
            
        Returns:
            对应的emoji
        """
        if score >= 90:
            return "🌟"
        elif score >= 80:
            return "⭐"
        elif score >= 70:
            return "✨"
        elif score >= 60:
            return "💫"
        else:
            return "⚪"
    
    def _parse_publish_time(self, time_str: str) -> datetime:
        """
        解析发布时间字符串
        
        Args:
            time_str: 时间字符串
            
        Returns:
            datetime对象
        """
        tz = pytz.timezone('Asia/Shanghai')
        
        # 尝试多种时间格式
        formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d %H:%M',
            '%Y/%m/%d %H:%M:%S',
            '%Y/%m/%d %H:%M',
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(time_str, fmt)
                return tz.localize(dt)
            except ValueError:
                continue
        
        # 如果都失败了，返回当前时间
        logger.warning(f"无法解析时间字符串: {time_str}")
        return datetime.now(tz)
    
    def generate_rss(
        self,
        posts: List[Dict],
        output_file: Optional[str] = None,
        pretty: bool = True
    ) -> str:
        """
        生成RSS XML字符串
        
        Args:
            posts: 线报数据列表
            output_file: 输出文件路径（可选）
            pretty: 是否格式化输出
            
        Returns:
            RSS XML字符串
        """
        # 创建feed
        fg = self.create_feed(posts)
        
        # 生成RSS XML
        rss_str = fg.rss_str(pretty=pretty)
        
        # 如果指定了输出文件，保存到文件
        if output_file:
            self.save_to_file(rss_str, output_file)
        
        return rss_str.decode('utf-8')
    
    def save_to_file(self, rss_content: bytes, file_path: str) -> None:
        """
        保存RSS内容到文件
        
        Args:
            rss_content: RSS内容（字节）
            file_path: 文件路径
        """
        try:
            # 创建目录（如果不存在）
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            
            # 写入文件
            with open(file_path, 'wb') as f:
                f.write(rss_content)
            
            logger.info(f"RSS Feed已保存到: {file_path}")
        except Exception as e:
            logger.error(f"保存RSS文件失败: {e}")
            raise
    
    def generate_atom(
        self,
        posts: List[Dict],
        output_file: Optional[str] = None,
        pretty: bool = True
    ) -> str:
        """
        生成Atom格式的feed
        
        Args:
            posts: 线报数据列表
            output_file: 输出文件路径（可选）
            pretty: 是否格式化输出
            
        Returns:
            Atom XML字符串
        """
        # 创建feed
        fg = self.create_feed(posts)
        
        # 生成Atom XML
        atom_str = fg.atom_str(pretty=pretty)
        
        # 如果指定了输出文件，保存到文件
        if output_file:
            self.save_to_file(atom_str, output_file)
        
        return atom_str.decode('utf-8')
    
    def generate_json(
        self,
        posts: List[Dict],
        output_file: Optional[str] = None,
        pretty: bool = True
    ) -> str:
        """
        生成JSON格式的数据（供Web界面使用）
        
        Args:
            posts: 线报数据列表
            output_file: 输出文件路径（可选）
            pretty: 是否格式化输出
            
        Returns:
            JSON字符串
        """
        # 准备JSON数据
        json_data = {
            "title": self.title,
            "description": self.description,
            "link": self.link,
            "updated": datetime.now(pytz.timezone('Asia/Shanghai')).isoformat(),
            "items": []
        }
        
        # 转换线报数据为JSON格式
        for post in posts:
            item = {
                "title": post.get('title', ''),
                "url": post.get('url', ''),
                "category": post.get('category', ''),
                "content": post.get('content', ''),
                "summary": post.get('summary', ''),
                "author": post.get('author', ''),
                "publish_time": self._format_datetime(post.get('publish_time')),
                "quality_score": post.get('quality_score', 0)
            }
            json_data["items"].append(item)
        
        # 生成JSON字符串
        indent = 2 if pretty else None
        json_str = json.dumps(json_data, ensure_ascii=False, indent=indent)
        
        # 如果指定了输出文件，保存到文件
        if output_file:
            try:
                Path(output_file).parent.mkdir(parents=True, exist_ok=True)
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(json_str)
                logger.info(f"JSON数据已保存到: {output_file}")
            except Exception as e:
                logger.error(f"保存JSON文件失败: {e}")
                raise
        
        return json_str
    
    def _format_datetime(self, dt) -> str:
        """
        格式化datetime对象为ISO字符串
        
        Args:
            dt: datetime对象或字符串
            
        Returns:
            ISO格式的时间字符串
        """
        if dt is None:
            return ""
        
        if isinstance(dt, str):
            return dt
        
        if isinstance(dt, datetime):
            if dt.tzinfo is None:
                tz = pytz.timezone('Asia/Shanghai')
                dt = tz.localize(dt)
            return dt.isoformat()
        
        return str(dt)


class RSSManager:
    """RSS管理器 - 整合爬虫、过滤器和生成器"""
    
    def __init__(
        self,
        crawler,
        quality_filter,
        rss_generator: Optional[RSSGenerator] = None
    ):
        """
        初始化RSS管理器
        
        Args:
            crawler: 爬虫实例
            quality_filter: 质量过滤器实例
            rss_generator: RSS生成器实例（可选）
        """
        self.crawler = crawler
        self.quality_filter = quality_filter
        self.rss_generator = rss_generator or RSSGenerator()
    
    async def generate_rss_feed(
        self,
        output_file: str = "output/feed.xml",
        max_items: int = 50
    ) -> str:
        """
        生成完整的RSS feed（爬取 -> 过滤 -> 生成RSS）
        
        Args:
            output_file: 输出文件路径
            max_items: 最大条目数
            
        Returns:
            RSS XML字符串
        """
        logger.info("开始生成RSS Feed...")
        
        # 1. 爬取数据
        logger.info("步骤1: 爬取线报数据...")
        posts = await self.crawler.crawl()
        logger.info(f"爬取到 {len(posts)} 条线报")
        
        # 2. 过滤数据
        logger.info("步骤2: 应用质量过滤...")
        filtered_posts = self.quality_filter.filter_posts(posts)
        logger.info(f"过滤后剩余 {len(filtered_posts)} 条高质量线报")
        
        # 3. 限制条目数
        if len(filtered_posts) > max_items:
            filtered_posts = filtered_posts[:max_items]
            logger.info(f"限制输出条目数为 {max_items}")
        
        # 4. 生成RSS
        logger.info("步骤3: 生成RSS Feed...")
        rss_content = self.rss_generator.generate_rss(
            filtered_posts,
            output_file=output_file
        )
        
        logger.info(f"✓ RSS Feed生成完成！包含 {len(filtered_posts)} 条高质量线报")
        return rss_content