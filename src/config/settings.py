"""
配置管理模块
"""
import os
from typing import Optional
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class Settings:
    """应用配置类"""
    
    # 爬虫配置
    CRAWL_INTERVAL: int = int(os.getenv('CRAWL_INTERVAL', '30'))
    MAX_POSTS_PER_SOURCE: int = int(os.getenv('MAX_POSTS_PER_SOURCE', '50'))
    REQUEST_TIMEOUT: int = int(os.getenv('REQUEST_TIMEOUT', '10'))
    
    # 过滤配置
    QUALITY_THRESHOLD: int = int(os.getenv('QUALITY_THRESHOLD', '60'))
    MAX_POST_AGE_DAYS: int = int(os.getenv('MAX_POST_AGE_DAYS', '7'))
    
    # RSS配置
    RSS_TITLE: str = os.getenv('RSS_TITLE', '高质量羊毛线报')
    RSS_DESCRIPTION: str = os.getenv('RSS_DESCRIPTION', '精选优质羊毛活动，自动过滤低质内容')
    RSS_MAX_ITEMS: int = int(os.getenv('RSS_MAX_ITEMS', '100'))
    
    # API配置
    API_HOST: str = os.getenv('API_HOST', '0.0.0.0')
    API_PORT: int = int(os.getenv('API_PORT', '8000'))
    
    # 数据库配置
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'sqlite+aiosqlite:///wool.db')
    
    # Cloudflare配置
    CF_ACCOUNT_ID: Optional[str] = os.getenv('CF_ACCOUNT_ID')
    CF_API_TOKEN: Optional[str] = os.getenv('CF_API_TOKEN')
    CF_KV_NAMESPACE_ID: Optional[str] = os.getenv('CF_KV_NAMESPACE_ID')
    
    # 日志配置
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # User-Agent
    USER_AGENT: str = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    
    # 数据源配置
    SOURCES = {
        'ixbk': {
            'name': '线报酷',
            'url': 'https://new.ixbk.net/',
            'enabled': True
        }
    }


# 创建全局配置实例
settings = Settings()