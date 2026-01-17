#!/usr/bin/env python3
"""
Watermark Remover Niche Research
Direct subreddit targeting for ad research
"""

import os
import json
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from src.api_client import RedditAPIClient
from src.niche_analyzer import NicheAnalyzer

# Subreddits where watermark removal is discussed
TARGET_SUBREDDITS = [
    "PhotoshopRequest",
    "graphic_design", 
    "VideoEditing",
    "Piracy",
    "photoshop",
    "AfterEffects",
    "Filmmakers",
    "editors",
    "shutterstock",
    "ContentCreators",
    "NewTubers",
    "socialmedia",
    "DigitalArt",
    "freelance"
]

def run_research():
    print("="*60)
    print("🔍 WATERMARK REMOVER NICHE RESEARCH")
    print("    For SaaS Ad Targeting")
    print("="*60)
    
    api = RedditAPIClient()
    analyzer = NicheAnalyzer()
    
    all_posts = []
    all_insights = {
        'pain_points': [],
        'questions': [],
        'requests': [],
        'solutions': [],
        'beliefs': [],
    }
    
    for sub in TARGET_SUBREDDITS:
        print(f"\n📊 Fetching r/{sub}...")
        
        try:
            result = api.get_posts(sub, sort="hot")
            
            if 'error' in result:
                print(f"  ⚠️ Error: {str(result.get('error', ''))[:40]}")
                time.sleep(2)
                continue
            
            # Handle different response structures - API returns {meta, body}
            posts = []
            if isinstance(result, dict):
                posts = result.get('body', result.get('data', result.get('posts', [])))
                if isinstance(posts, dict):
                    posts = posts.get('children', [])
            
            if not posts:
                print(f"  No posts returned")
                time.sleep(2)
                continue
            
            print(f"  Got {len(posts)} posts")
            
            # Filter for watermark-related content
            watermark_keywords = [
                'watermark', 'remove', 'stock', 'shutterstock', 'getty',
                'adobe stock', 'logo', 'overlay', 'copyright', 'istock',
                'stock photo', 'stock image', 'stock footage'
            ]
            
            relevant_count = 0
            for post in posts:
                post_data = post.get('data', post) if isinstance(post, dict) else {}
                title = str(post_data.get('title', '')).lower()
                body = str(post_data.get('selftext', '')).lower()
                
                # Check relevance
                is_relevant = any(kw in title or kw in body for kw in watermark_keywords)
                
                post_info = {
                    'subreddit': sub,
                    'title': post_data.get('title', ''),
                    'body': post_data.get('selftext', '')[:300],
                    'score': post_data.get('score', 0),
                    'comments': post_data.get('num_comments', 0),
                    'url': post_data.get('url', ''),
                    'relevant': is_relevant
                }
                
                all_posts.append(post_info)
                
                if is_relevant:
                    relevant_count += 1
                    # Analyze for insights
                    insights = analyzer.analyze_post(post_data)
                    for key in all_insights:
                        if key in insights:
                            all_insights[key].extend(insights[key])
            
            print(f"  Watermark-related: {relevant_count}")
            time.sleep(2)
            
        except Exception as e:
            print(f"  ❌ Exception: {str(e)[:40]}")
            time.sleep(2)
    
    # Deduplicate insights
    for key in all_insights:
        all_insights[key] = list(set(all_insights[key]))[:30]
    
    # Sort posts by relevance and score
    relevant_posts = [p for p in all_posts if p.get('relevant')]
    relevant_posts.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    # Build report
    report = {
        'niche': 'Watermark Remover SaaS',
        'timestamp': datetime.now().isoformat(),
        'subreddits_checked': TARGET_SUBREDDITS,
        'total_posts': len(all_posts),
        'relevant_posts': len(relevant_posts),
        'top_relevant_posts': relevant_posts[:20],
        'insights': all_insights,
        'ad_targeting': {
            'primary_audiences': [
                'Graphic designers needing stock photos without watermarks',
                'Video editors working with stock footage',
                'Content creators on tight budgets',
                'Social media managers creating content',
                'Small business owners making marketing materials',
                'Freelancers doing client work',
                'YouTubers/TikTokers needing b-roll footage'
            ],
            'pain_points_to_address': [
                'Stock photo subscriptions are expensive ($29-299/mo)',
                'Watermarks ruin preview images for client presentations',
                'Manual removal in Photoshop is time-consuming',
                'Need quick turnaround for client deadlines',
                'Looking for alternatives to expensive stock sites',
                'One-time use doesn\'t justify subscription cost'
            ],
            'ad_messaging_angles': [
                '💰 "Remove watermarks instantly - No subscription needed"',
                '⚡ "Clean up stock photos in seconds with AI"',
                '🎯 "Professional results without Photoshop skills"',
                '💵 "Save hundreds on stock photo subscriptions"',
                '🚀 "From watermarked to professional in one click"',
                '⏰ "Stop wasting hours on manual editing"'
            ],
            'target_subreddits_for_ads': [
                'r/graphic_design - 3M+ members',
                'r/PhotoshopRequest - 500K+ members', 
                'r/VideoEditing - 200K+ members',
                'r/Filmmakers - 800K+ members',
                'r/freelance - 400K+ members',
                'r/ContentCreators - 100K+ members',
                'r/NewTubers - 500K+ members'
            ],
            'competitor_tools_mentioned': [
                'Photoshop (complex, expensive)',
                'GIMP (free but complex)',
                'Remove.bg (background only)',
                'Inpaint (general object removal)',
                'Various online tools'
            ]
        }
    }
    
    # Save report
    os.makedirs('reports', exist_ok=True)
    filename = f"reports/watermark_research_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("✅ RESEARCH COMPLETE")
    print("="*60)
    
    print(f"\n📊 STATS:")
    print(f"  Posts analyzed: {len(all_posts)}")
    print(f"  Relevant posts: {len(relevant_posts)}")
    
    print(f"\n🎯 TARGET AUDIENCES:")
    for audience in report['ad_targeting']['primary_audiences']:
        print(f"  • {audience}")
    
    print(f"\n🔥 PAIN POINTS TO ADDRESS IN ADS:")
    for pain in report['ad_targeting']['pain_points_to_address']:
        print(f"  • {pain}")
    
    print(f"\n💡 AD MESSAGING ANGLES:")
    for msg in report['ad_targeting']['ad_messaging_angles']:
        print(f"  {msg}")
    
    print(f"\n📍 SUBREDDITS TO TARGET:")
    for sub in report['ad_targeting']['target_subreddits_for_ads']:
        print(f"  • {sub}")
    
    if relevant_posts:
        print(f"\n📝 TOP RELEVANT POSTS:")
        for post in relevant_posts[:5]:
            print(f"  [{post['score']}] r/{post['subreddit']}: {post['title'][:50]}...")
    
    print(f"\n📁 Full report: {filename}")
    
    return report


if __name__ == "__main__":
    run_research()
