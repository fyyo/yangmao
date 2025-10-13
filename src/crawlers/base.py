"""
爬虫基类
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import datetime
import httpx
from bs4 import BeautifulSoup
from loguru import logger

from ..config import settings


class BaseCrawler(ABC):
    """爬虫基类"""
    
    def __init__(self):
        self.source_name: str = ""
        self.base_url: str = ""
        self.logger = logger  # 添加logger实例属性
        self.headers = {
            'User-Agent': settings.USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
    
    async def fetch_page(self, url: str) -> Optional[str]:
        """
        获取页面HTML内容
        
        Args:
            url: 目标URL
            
        Returns:
            HTML内容字符串，失败返回None
        """
        try:
            async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
                response = await client.get(url, headers=self.headers, follow_redirects=True)
                response.raise_for_status()
                
                # 尝试检测编码
                if response.encoding == 'ISO-8859-1':
                    # 可能是GBK编码
                    response.encoding = 'gbk'
                
                logger.info(f"成功获取页面: {url}")
                return response.text
                
        except httpx.TimeoutException:
            logger.error(f"请求超时: {url}")
        except httpx.HTTPError as e:
            logger.error(f"HTTP错误: {url}, {str(e)}")
        except Exception as e:
            logger.error(f"未知错误: {url}, {str(e)}")
        
        return None
    
    def parse_html(self, html: str) -> BeautifulSoup:
        """
        解析HTML
        
        Args:
            html: HTML字符串
            
        Returns:
            BeautifulSoup对象
        """
        return BeautifulSoup(html, 'lxml')
    
    @abstractmethod
    async def crawl(self) -> List[Dict]:
        """
        爬取数据（子类必须实现）
        
        Returns:
            帖子列表，每个帖子是一个字典
        """
        pass
    
    def create_post_dict(
        self,
        title: str,
        url: str,
        author: str = "",
        publish_time: Optional[datetime] = None,
        content: str = "",
        view_count: int = 0,
        reply_count: int = 0
    ) -> Dict:
        """
        创建标准的帖子字典
        
        Args:
            title: 标题
            url: 链接
            author: 作者
            publish_time: 发布时间
            content: 内容摘要
            view_count: 浏览数
            reply_count: 回复数
            
        Returns:
            标准化的帖子字典
        """
        return {
            'title': title.strip(),
            'url': url,
            'author': author.strip(),
            'publish_time': publish_time or datetime.now(),
            'content': content.strip(),
            'source': self.source_name,
            'view_count': view_count,
            'reply_count': reply_count,
            'crawl_time': datetime.now(),
        }