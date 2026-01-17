"""
Niche Researcher
Main research workflow for discovering SaaS opportunities from Reddit
"""

import json
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

from .api_client import RedditAPIClient
from .niche_analyzer import NicheAnalyzer, InsightCategory


@dataclass
class ResearchReport:
    """Complete research report for a niche"""
    niche: str
    timestamp: str
    subreddits_found: List[Dict[str, Any]]
    total_posts_analyzed: int
    top_posts: List[Dict[str, Any]]
    pain_points: List[str]
    questions: List[str]
    frustrations: List[str]
    requests: List[str]
    solutions_mentioned: List[str]
    beliefs: List[str]
    common_themes: List[str]
    saas_opportunities: List[Dict[str, str]]
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    def to_json(self, filepath: str):
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)


class NicheResearcher:
    """
    Research tool for discovering SaaS opportunities in Reddit niches.
    
    Workflow:
    1. Search for subreddits related to niche keywords
    2. Find popular posts from the last year
    3. Analyze posts and comments for insights
    4. Extract pain points, questions, and opportunities
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api = RedditAPIClient(api_key)
        self.analyzer = NicheAnalyzer()
    
    def generate_niche_variations(self, niche: str) -> List[str]:
        """
        Generate search variations for a niche keyword.
        
        Args:
            niche: Base niche keyword (e.g., "email marketing")
            
        Returns:
            List of search variations
        """
        base = niche.lower().strip()
        words = base.split()
        
        variations = [
            base,
            f"{base} software",
            f"{base} tool",
            f"{base} app",
            f"{base} automation",
            f"{base} help",
            f"{base} tips",
            f"best {base}",
            f"{base} for beginners",
            f"{base} problems",
        ]
        
        # Add singular/plural variations
        if base.endswith('s'):
            variations.append(base[:-1])
        else:
            variations.append(f"{base}s")
        
        # Add word combinations if multi-word
        if len(words) > 1:
            variations.extend([
                words[0],
                words[-1],
                ' '.join(reversed(words)),
            ])
        
        return list(set(variations))
    
    def discover_subreddits(
        self,
        niche: str,
        max_subreddits: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Discover subreddits related to a niche.
        
        Args:
            niche: Niche keyword to search
            max_subreddits: Maximum subreddits to return
            
        Returns:
            List of subreddit info dicts
        """
        print(f"🔍 Discovering subreddits for: {niche}")
        
        variations = self.generate_niche_variations(niche)
        all_subreddits = {}
        
        for variation in variations[:5]:  # Limit API calls
            print(f"  Searching: {variation}")
            result = self.api.search_subreddits(variation, limit=10)
            
            if 'error' in result:
                print(f"  ⚠️ Error: {result['error']}")
                continue
            
            subreddits = result.get('data', {}).get('children', []) or result.get('subreddits', [])
            
            for sub in subreddits:
                sub_data = sub.get('data', sub)
                name = sub_data.get('display_name') or sub_data.get('name', '')
                if name and name not in all_subreddits:
                    all_subreddits[name] = {
                        'name': name,
                        'subscribers': sub_data.get('subscribers', 0),
                        'description': sub_data.get('public_description', '')[:200],
                        'url': f"https://reddit.com/r/{name}"
                    }
            
            time.sleep(0.5)  # Rate limiting
        
        # Sort by subscribers
        sorted_subs = sorted(
            all_subreddits.values(),
            key=lambda x: x.get('subscribers', 0),
            reverse=True
        )
        
        print(f"✅ Found {len(sorted_subs)} subreddits")
        return sorted_subs[:max_subreddits]
    
    def get_top_posts(
        self,
        subreddit: str,
        time_filter: str = "year",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get top posts from a subreddit.
        
        Args:
            subreddit: Subreddit name
            time_filter: 'day', 'week', 'month', 'year', 'all'
            limit: Max posts to fetch
            
        Returns:
            List of post data
        """
        print(f"  📄 Getting top posts from r/{subreddit}...")
        
        result = self.api.get_top_posts_year(subreddit, limit)
        
        if 'error' in result:
            print(f"  ⚠️ Error: {result['error']}")
            return []
        
        posts = result.get('data', {}).get('children', []) or result.get('posts', [])
        
        processed_posts = []
        for post in posts:
            post_data = post.get('data', post)
            processed_posts.append({
                'id': post_data.get('id', ''),
                'title': post_data.get('title', ''),
                'selftext': post_data.get('selftext', ''),
                'score': post_data.get('score', 0),
                'num_comments': post_data.get('num_comments', 0),
                'url': post_data.get('url', ''),
                'created_utc': post_data.get('created_utc', 0),
                'subreddit': subreddit,
            })
        
        return processed_posts
    
    def analyze_subreddit(
        self,
        subreddit: str,
        post_limit: int = 50
    ) -> Dict[str, Any]:
        """
        Fully analyze a subreddit for insights.
        
        Args:
            subreddit: Subreddit name
            post_limit: Max posts to analyze
            
        Returns:
            Analysis results
        """
        posts = self.get_top_posts(subreddit, limit=post_limit)
        
        all_insights = {
            'pain_points': [],
            'questions': [],
            'requests': [],
            'solutions': [],
            'beliefs': [],
        }
        
        post_categories = {
            'question': 0,
            'complaint': 0,
            'request': 0,
            'showcase': 0,
            'discussion': 0,
        }
        
        for post in posts:
            # Categorize post
            category = self.analyzer.categorize_post_by_intent(post)
            post_categories[category] = post_categories.get(category, 0) + 1
            
            # Extract insights
            post_insights = self.analyzer.analyze_post(post)
            for key in all_insights:
                all_insights[key].extend(post_insights.get(key, []))
        
        # Get common themes
        themes = self.analyzer.extract_common_themes(posts)
        
        return {
            'subreddit': subreddit,
            'posts_analyzed': len(posts),
            'top_posts': posts[:10],  # Keep top 10
            'post_categories': post_categories,
            'insights': all_insights,
            'themes': themes,
        }
    
    def research_niche(
        self,
        niche: str,
        max_subreddits: int = 5,
        posts_per_subreddit: int = 50
    ) -> ResearchReport:
        """
        Complete niche research workflow.
        
        Args:
            niche: Niche keyword to research
            max_subreddits: Max subreddits to analyze
            posts_per_subreddit: Posts to analyze per subreddit
            
        Returns:
            Complete ResearchReport
        """
        print(f"\n{'='*60}")
        print(f"🚀 Starting Niche Research: {niche}")
        print(f"{'='*60}\n")
        
        # Step 1: Discover subreddits
        subreddits = self.discover_subreddits(niche, max_subreddits)
        
        if not subreddits:
            print("❌ No subreddits found. Try different keywords.")
            return None
        
        # Step 2: Analyze each subreddit
        all_insights = InsightCategory()
        all_posts = []
        all_themes = []
        total_posts = 0
        
        for sub in subreddits[:max_subreddits]:
            print(f"\n📊 Analyzing r/{sub['name']}...")
            
            analysis = self.analyze_subreddit(sub['name'], posts_per_subreddit)
            
            total_posts += analysis['posts_analyzed']
            all_posts.extend(analysis['top_posts'])
            all_themes.extend(analysis['themes'])
            
            # Aggregate insights
            insights = analysis['insights']
            all_insights.pain_points.extend(insights.get('pain_points', []))
            all_insights.questions.extend(insights.get('questions', []))
            all_insights.requests.extend(insights.get('requests', []))
            all_insights.solutions_mentioned.extend(insights.get('solutions', []))
            all_insights.beliefs.extend(insights.get('beliefs', []))
            
            time.sleep(1)  # Rate limiting
        
        # Step 3: Deduplicate and rank insights
        all_insights.pain_points = list(set(all_insights.pain_points))[:50]
        all_insights.questions = list(set(all_insights.questions))[:50]
        all_insights.requests = list(set(all_insights.requests))[:50]
        all_insights.solutions_mentioned = list(set(all_insights.solutions_mentioned))[:30]
        all_insights.beliefs = list(set(all_insights.beliefs))[:30]
        
        # Get unique themes
        from collections import Counter
        theme_counts = Counter(all_themes)
        top_themes = [theme for theme, _ in theme_counts.most_common(20)]
        
        # Step 4: Generate SaaS opportunities
        opportunities = self.analyzer.generate_saas_opportunities(all_insights)
        
        # Sort posts by score
        all_posts.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        # Create report
        report = ResearchReport(
            niche=niche,
            timestamp=datetime.now().isoformat(),
            subreddits_found=subreddits,
            total_posts_analyzed=total_posts,
            top_posts=all_posts[:20],
            pain_points=all_insights.pain_points,
            questions=all_insights.questions,
            frustrations=all_insights.frustrations,
            requests=all_insights.requests,
            solutions_mentioned=all_insights.solutions_mentioned,
            beliefs=all_insights.beliefs,
            common_themes=top_themes,
            saas_opportunities=opportunities,
        )
        
        print(f"\n{'='*60}")
        print(f"✅ Research Complete!")
        print(f"{'='*60}")
        print(f"📊 Subreddits analyzed: {len(subreddits)}")
        print(f"📝 Posts analyzed: {total_posts}")
        print(f"🎯 Pain points found: {len(all_insights.pain_points)}")
        print(f"❓ Questions found: {len(all_insights.questions)}")
        print(f"💡 Opportunities identified: {len(opportunities)}")
        
        return report


# CLI entry point
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m src.researcher <niche>")
        print("Example: python -m src.researcher 'email marketing'")
        sys.exit(1)
    
    niche = ' '.join(sys.argv[1:])
    researcher = NicheResearcher()
    report = researcher.research_niche(niche)
    
    if report:
        # Save report
        filename = f"reports/{niche.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        import os
        os.makedirs('reports', exist_ok=True)
        report.to_json(filename)
        print(f"\n📁 Report saved to: {filename}")
