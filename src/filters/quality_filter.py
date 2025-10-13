"""
内容质量过滤器
基于关键词和规则对羊毛线报进行质量评分和过滤
"""
from typing import Dict, List
from datetime import datetime, timedelta
from loguru import logger


class QualityFilter:
    """质量过滤器"""
    
    def __init__(self, threshold: int = 60):
        """
        初始化过滤器
        
        Args:
            threshold: 质量分数阈值，低于此分数的内容将被过滤
        """
        self.threshold = threshold
        self.logger = logger
        
        # 正面关键词及加分（高质量线报特征）
        self.positive_keywords = {
            # 实物类 (+20分)
            '实物': 20, '包邮': 15, '0元购': 25, '免单': 25,
            
            # 话费/充值类 (+15分)
            '话费': 15, '流量': 15, '充值': 12, '红包': 10,
            
            # 大平台 (+10分)
            '京东': 10, '淘宝': 10, '天猫': 10, '拼多多': 10,
            '支付宝': 12, '微信': 12, '美团': 10, '饿了么': 10,
            
            # 优惠力度 (+8分)
            '限时': 8, '秒杀': 8, '特价': 5, '优惠券': 5,
            '满减': 5, '折扣': 5,
            
            # 质量标识 (+5分)
            '品牌': 5, '官方': 8, '正品': 5,
        }
        
        # 负面关键词及扣分（低质量/风险内容）
        self.negative_keywords = {
            # 高风险操作 (-30分)
            '砍价': -30, '拉人': -30, '助力': -25, '邀请': -20,
            '组队': -25, '分享': -18, '转发': -18,
            
            # 诱导行为 (-20分)
            '下载app': -20, '注册': -15, '实名': -15, '绑卡': -20,
            '贷款': -35, '借款': -35, '理财': -25, '投资': -25,
            
            # 不确定性 (-15分)
            '抽奖': -15, '概率': -12, '随机': -12, '可能': -8,
            '试试': -10, '碰运气': -12,
            
            # 虚假诱导 (-25分)
            '必中': -25, '100%': -20, '秒到': -15, '躺赚': -30,
            
            # 复杂操作 (-10分)
            '需要': -8, '步骤': -10, '教程': -8,
        }
        
        # 分类权重
        self.category_weights = {
            '京东': 1.2,      # 京东线报更可靠
            '淘宝': 1.1,
            '支付宝': 1.2,
            '话费': 1.3,      # 话费类很受欢迎
            '实物': 1.2,
            '红包': 1.1,
            '抽奖': 0.7,      # 抽奖类不太靠谱
            '助力': 0.5,      # 助力类质量较低
            '砍价': 0.4,      # 砍价类最低
        }
    
    def calculate_score(self, post: Dict) -> float:
        """
        计算内容质量分数
        
        Args:
            post: 帖子数据字典
            
        Returns:
            质量分数（0-100）
        """
        # 基础分数
        score = 50.0
        
        # 获取需要分析的文本
        title = post.get('title', '')
        content = post.get('content', '')
        category = post.get('category', '')
        text = f"{title} {content} {category}"
        
        # 关键词评分
        positive_score = 0
        negative_score = 0
        matched_positive = []
        matched_negative = []
        
        # 正面关键词匹配
        for keyword, points in self.positive_keywords.items():
            if keyword in text:
                positive_score += points
                matched_positive.append(keyword)
        
        # 负面关键词匹配
        for keyword, points in self.negative_keywords.items():
            if keyword in text:
                negative_score += points  # points已经是负数
                matched_negative.append(keyword)
        
        score += positive_score + negative_score
        
        # 时效性评分
        pub_time = post.get('publish_time')
        if pub_time:
            time_score = self._calculate_time_score(pub_time)
            score += time_score
        
        # 分类权重调整
        category_score = self._calculate_category_score(category)
        score *= category_score
        
        # 评论数加分（有人互动说明有价值）
        comments = post.get('comments', 0)
        if comments > 0:
            comment_bonus = min(comments * 0.5, 10)  # 最多加10分
            score += comment_bonus
        
        # 确保分数在0-100之间
        score = max(0, min(100, score))
        
        # 记录详细评分信息
        self.logger.debug(
            f"评分详情 - 标题: {title[:30]}... | "
            f"基础分: 50 | 正面: +{positive_score} {matched_positive} | "
            f"负面: {negative_score} {matched_negative} | "
            f"分类权重: {category_score:.2f} | 最终: {score:.1f}"
        )
        
        return round(score, 1)
    
    def _calculate_time_score(self, pub_time: datetime) -> float:
        """
        根据发布时间计算时效性分数
        
        Args:
            pub_time: 发布时间
            
        Returns:
            时效性分数加成
        """
        now = datetime.now()
        
        # 确保pub_time是datetime对象
        if not isinstance(pub_time, datetime):
            return 0
        
        time_diff = now - pub_time
        
        # 2小时内: +10分（非常新鲜）
        if time_diff < timedelta(hours=2):
            return 10
        # 6小时内: +5分（比较新）
        elif time_diff < timedelta(hours=6):
            return 5
        # 12小时内: 0分（正常）
        elif time_diff < timedelta(hours=12):
            return 0
        # 24小时内: -5分（有点旧）
        elif time_diff < timedelta(hours=24):
            return -5
        # 超过24小时: -10分（太旧了）
        else:
            return -10
    
    def _calculate_category_score(self, category: str) -> float:
        """
        根据分类计算权重系数
        
        Args:
            category: 分类字符串
            
        Returns:
            权重系数（0.5-1.5）
        """
        weight = 1.0
        
        # 检查分类中是否包含特定关键词
        for keyword, multiplier in self.category_weights.items():
            if keyword in category:
                weight = max(weight, multiplier)
        
        return weight
    
    def filter_posts(self, posts: List[Dict]) -> List[Dict]:
        """
        过滤帖子列表，只保留高质量内容
        
        Args:
            posts: 帖子列表
            
        Returns:
            过滤后的高质量帖子列表
        """
        filtered_posts = []
        
        for post in posts:
            # 计算质量分数
            score = self.calculate_score(post)
            post['quality_score'] = score
            
            # 判断是否通过过滤
            if score >= self.threshold:
                filtered_posts.append(post)
                self.logger.debug(
                    f"✓ 通过过滤: {post.get('title', '')[:40]}... (分数: {score})"
                )
            else:
                self.logger.debug(
                    f"✗ 未通过过滤: {post.get('title', '')[:40]}... (分数: {score}, 阈值: {self.threshold})"
                )
        
        # 按质量分数排序
        filtered_posts.sort(key=lambda x: x['quality_score'], reverse=True)
        
        self.logger.info(
            f"过滤完成: 输入 {len(posts)} 条，输出 {len(filtered_posts)} 条 "
            f"(过滤率: {(1 - len(filtered_posts)/len(posts))*100:.1f}%)"
        )
        
        return filtered_posts
    
    def get_filter_stats(self, posts: List[Dict]) -> Dict:
        """
        获取过滤统计信息
        
        Args:
            posts: 已评分的帖子列表
            
        Returns:
            统计信息字典
        """
        if not posts:
            return {
                'total': 0,
                'avg_score': 0,
                'max_score': 0,
                'min_score': 0,
                'passed': 0,
                'filtered': 0
            }
        
        scores = [p.get('quality_score', 0) for p in posts]
        passed = [p for p in posts if p.get('quality_score', 0) >= self.threshold]
        
        return {
            'total': len(posts),
            'avg_score': round(sum(scores) / len(scores), 1),
            'max_score': max(scores),
            'min_score': min(scores),
            'passed': len(passed),
            'filtered': len(posts) - len(passed),
            'pass_rate': round(len(passed) / len(posts) * 100, 1)
        }