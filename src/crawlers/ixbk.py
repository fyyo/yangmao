"""
线报酷爬虫 - https://new.ixbk.net/
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import re
import asyncio
from .base import BaseCrawler


class IxbkCrawler(BaseCrawler):
    """线报酷爬虫"""
    
    def __init__(self, fetch_detail: bool = True):
        """
        初始化爬虫
        
        Args:
            fetch_detail: 是否爬取详情页获取完整内容（默认True）
        """
        super().__init__()
        self.source_name = "线报酷"
        self.base_url = "https://new.ixbk.net/"
        self.fetch_detail = fetch_detail
        
    async def crawl(self) -> List[Dict]:
        """爬取线报酷首页内容"""
        try:
            # 获取首页HTML
            html = await self.fetch_page(self.base_url)
            if not html:
                self.logger.error("获取线报酷页面失败")
                return []
            
            soup = self.parse_html(html)
            posts = []
            
            # 找到所有文章列表项
            article_list = soup.find('ul', class_='new-post')
            if not article_list:
                self.logger.error("未找到文章列表")
                return []
            
            articles = article_list.find_all('li', class_='article-list')
            self.logger.info(f"找到 {len(articles)} 篇文章")
            
            for article in articles:
                try:
                    post = await self._parse_article(article)
                    if post:
                        posts.append(post)
                except Exception as e:
                    self.logger.error(f"解析文章失败: {e}")
                    continue
            
            self.logger.info(f"成功解析 {len(posts)} 篇文章")
            return posts
            
        except Exception as e:
            self.logger.error(f"爬取线报酷失败: {e}")
            return []
    
    async def _parse_article(self, article) -> Optional[Dict]:
        """解析单篇文章"""
        try:
            # 获取标题和链接
            title_element = article.find('a')
            if not title_element:
                return None
            
            title = title_element.get('title', '').strip()
            link = title_element.get('href', '').strip()
            
            if not title or not link:
                return None
            
            # 补全链接
            if link.startswith('/'):
                link = f"https://new.ixbk.net{link}"
            
            # 获取时间
            time_element = article.find('time', class_='badge')
            time_str = time_element.get_text().strip() if time_element else ""
            
            # 获取分类
            category = title_element.get('data-catename', '未分类')
            
            # 获取内容
            content = title_element.get('data-content', '').strip()
            
            # 获取评论数
            comment_element = article.find('span', class_='badge com')
            comments = 0
            if comment_element:
                comment_text = comment_element.get_text().strip()
                # 提取数字
                match = re.search(r'\d+', comment_text)
                if match:
                    comments = int(match.group())
            
            # 获取发布者
            author = title_element.get('data-louzhu', '匿名')
            
            # 解析时间
            pub_date = self._parse_time(time_str)
            
            # 如果启用详情页抓取，获取完整内容
            full_content = content or title
            if self.fetch_detail:
                detail_content = await self._fetch_detail_content(link)
                if detail_content:
                    full_content = detail_content
            
            # 创建文章字典
            post = self.create_post_dict(
                title=title,
                url=link,
                author=author,
                publish_time=pub_date,
                content=full_content
            )
            
            # 添加分类信息
            post['category'] = category
            
            # 添加额外信息
            post['comments'] = comments
            
            return post
            
        except Exception as e:
            self.logger.error(f"解析文章元素失败: {e}")
            return None
    
    def _parse_time(self, time_str: str) -> datetime:
        """
        解析时间字符串
        支持格式：
        - "11:00" -> 今天11:00
        - "10:59" -> 今天10:59
        """
        try:
            if not time_str:
                return datetime.now()
            
            # 匹配 HH:MM 格式
            match = re.match(r'(\d{1,2}):(\d{2})', time_str)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2))
                
                now = datetime.now()
                pub_date = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                # 如果时间比现在晚，说明是昨天的
                if pub_date > now:
                    pub_date = pub_date - timedelta(days=1)
                
                return pub_date
            
            # 如果无法解析，返回当前时间
            return datetime.now()
            
        except Exception as e:
            self.logger.error(f"解析时间失败: {time_str}, {e}")
            return datetime.now()
    
    async def _fetch_detail_content(self, url: str) -> Optional[str]:
        """
        获取详情页的核心内容信息（包含评论区的链接和获取方法）
        
        Args:
            url: 详情页URL
            
        Returns:
            格式化的核心内容（正文+原文链接+评论区链接）
        """
        try:
            # 获取详情页HTML
            html = await self.fetch_page(url)
            if not html:
                return None
            
            soup = self.parse_html(html)
            content_parts = []
            
            # 1. 获取文章正文（核心线报信息）
            article_content = soup.find('div', class_='article-content')
            if article_content:
                text = article_content.get_text('\n', strip=True)
                if text:
                    content_parts.append(text)
            
            # 2. 获取原文购买链接
            source_link = soup.find('a', text=lambda t: t and '原文地址' in t)
            if source_link:
                href = source_link.get('href', '')
                if href:
                    content_parts.append(f"\n🔗 原文链接: {href}")
            
            # 3. 提取评论区的链接和获取方法
            comment_links = self._extract_comment_links(soup)
            if comment_links:
                content_parts.append("\n\n💬 评论区补充:")
                content_parts.append(comment_links)
            
            if content_parts:
                return '\n\n'.join(content_parts)
            
            return None
            
        except Exception as e:
            self.logger.error(f"获取详情页内容失败 {url}: {e}")
            return None
    
    def _extract_comment_links(self, soup) -> str:
        """
        从评论区提取商品链接和获取方法
        
        Args:
            soup: BeautifulSoup对象
            
        Returns:
            格式化的评论链接信息
        """
        try:
            links_info = []
            
            # 查找评论列表
            comment_list = soup.find('div', class_='comment-list')
            if not comment_list:
                return ""
            
            # 查找所有评论容器
            comment_uls = comment_list.find_all('div', class_='ul')
            
            for i, ul in enumerate(comment_uls[:10], 1):  # 最多取10条评论
                try:
                    li = ul.find('div', class_='li')
                    if not li:
                        continue
                    
                    # 获取评论内容
                    content_elem = li.find('div', class_='c-neirong')
                    if not content_elem:
                        continue
                    
                    comment_text = content_elem.get_text().strip()
                    
                    # 提取评论中的所有链接
                    links = content_elem.find_all('a')
                    for link in links:
                        href = link.get('href', '')
                        link_text = link.get_text().strip()
                        if href:
                            # 记录链接和上下文
                            links_info.append(f"[{i}] {link_text}: {href}")
                    
                    # 如果评论中没有<a>标签，但包含URL文本
                    if not links:
                        # 使用正则提取URL
                        import re
                        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
                        urls = re.findall(url_pattern, comment_text)
                        if urls:
                            for url in urls:
                                links_info.append(f"[{i}] {url}")
                        # 也提取包含获取方法的关键信息
                        elif any(keyword in comment_text for keyword in ['口令', '密令', '链接', '进入', '搜索', '打开']):
                            # 这条评论可能包含获取方法
                            if len(comment_text) < 200:  # 只保留较短的说明
                                links_info.append(f"[{i}] {comment_text}")
                        
                except Exception as e:
                    self.logger.debug(f"处理单条评论失败: {e}")
                    continue
            
            if links_info:
                return '\n'.join(links_info)
            
            return ""
            
        except Exception as e:
            self.logger.error(f"提取评论链接失败: {e}")
            return ""
    