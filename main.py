"""
羊毛线报RSS生成器 - 主程序入口
自动爬取、过滤并生成高质量羊毛线报RSS
"""
import asyncio
import sys
from pathlib import Path

from src.crawlers.ixbk import IxbkCrawler
from src.filters.quality_filter import QualityFilter
from src.rss import RSSManager
from loguru import logger


async def main():
    """主程序入口"""
    try:
        logger.info("=" * 80)
        logger.info("羊毛线报RSS生成器启动")
        logger.info("=" * 80)
        
        # 1. 初始化组件
        logger.info("初始化爬虫和过滤器...")
        crawler = IxbkCrawler()
        quality_filter = QualityFilter(threshold=60)
        rss_manager = RSSManager(crawler=crawler, quality_filter=quality_filter)
        
        # 2. 生成RSS Feed
        logger.info("开始生成RSS Feed...")
        await rss_manager.generate_rss_feed(
            output_file="output/feed.xml",
            max_items=100  # 输出前100条高质量线报
        )
        
        # 3. 同时生成Atom格式（可选）
        logger.info("生成Atom格式Feed...")
        posts = await crawler.crawl()
        filtered_posts = quality_filter.filter_posts(posts)
        if len(filtered_posts) > 100:
            filtered_posts = filtered_posts[:100]
        
        rss_manager.rss_generator.generate_atom(
            filtered_posts,
            output_file="output/feed.atom"
        )
        
        # 4. 生成JSON数据（供Web界面使用）
        logger.info("生成JSON数据...")
        rss_manager.rss_generator.generate_json(
            filtered_posts,
            output_file="output/feed.json"
        )
        
        logger.info("=" * 80)
        logger.info("✓ RSS生成完成！")
        logger.info("=" * 80)
        logger.info("输出文件:")
        logger.info("  - output/feed.xml (RSS 2.0)")
        logger.info("  - output/feed.atom (Atom 1.0)")
        logger.info("  - output/feed.json (JSON API)")
        logger.info("=" * 80)
        
        return 0
        
    except Exception as e:
        logger.error(f"程序执行失败: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    # 设置事件循环策略（Windows系统需要）
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    # 运行主程序
    exit_code = asyncio.run(main())
    sys.exit(exit_code)