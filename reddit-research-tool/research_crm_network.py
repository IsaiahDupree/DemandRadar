#!/usr/bin/env python3
"""
CRM/Relationship Management Niche Research
For EverReach - AI-powered relationship tool

Target: People who struggle with:
- Keeping in touch with their network
- Following up with contacts
- Maintaining professional relationships
- Networking fatigue
"""

import os
import json
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from src.api_client import RedditAPIClient
from src.niche_analyzer import NicheAnalyzer

# Subreddits where networking/CRM/relationship management is discussed
TARGET_SUBREDDITS = [
    "sales",
    "Entrepreneur",
    "smallbusiness",
    "startups",
    "networking",
    "careerguidance",
    "jobs",
    "freelance",
    "consulting",
    "realestate",
    "recruiting",
    "LinkedInLunatics",
    "productivity",
    "GetMotivated",
    "socialskills",
    "introverts",
    "businessanalysis",
    "SideProject"
]

# Keywords related to EverReach's value proposition
RELEVANT_KEYWORDS = [
    'follow up', 'followup', 'follow-up',
    'keep in touch', 'staying in touch', 'reach out',
    'networking', 'network',
    'crm', 'contacts', 'relationships',
    'cold outreach', 'warm', 'reconnect',
    'linkedin', 'connections',
    'remember', 'forget', 'forgot to',
    'busy', 'too many contacts',
    'professional relationship',
    'nurture', 'maintain relationship',
    'outreach', 'touch base'
]

def run_research():
    print("="*60)
    print("🔍 CRM / RELATIONSHIP MANAGEMENT NICHE RESEARCH")
    print("    For EverReach - AI Relationship Tool")
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
            
            # Handle response structure - API returns {meta, body}
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
            
            # Filter for relevant content
            relevant_count = 0
            for post in posts:
                post_data = post.get('data', post) if isinstance(post, dict) else {}
                title = str(post_data.get('title', '')).lower()
                body = str(post_data.get('selftext', '')).lower()
                full_text = title + ' ' + body
                
                # Check relevance to networking/CRM/follow-up topics
                is_relevant = any(kw in full_text for kw in RELEVANT_KEYWORDS)
                
                post_info = {
                    'subreddit': sub,
                    'title': post_data.get('title', ''),
                    'body': post_data.get('selftext', '')[:500],
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
            
            print(f"  Networking/CRM-related: {relevant_count}")
            time.sleep(2)
            
        except Exception as e:
            print(f"  ❌ Exception: {str(e)[:40]}")
            time.sleep(2)
    
    # Deduplicate insights
    for key in all_insights:
        all_insights[key] = list(set(all_insights[key]))[:50]
    
    # Sort posts by relevance and score
    relevant_posts = [p for p in all_posts if p.get('relevant')]
    relevant_posts.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    # Build report
    report = {
        'niche': 'CRM / Relationship Management - EverReach',
        'product_description': '''EverReach is an AI-powered relationship tool that helps you keep your network warm without relying on memory.
- Shows who you should reach out to next based on who's "going cold"
- Drafts natural messages you can copy, edit, and send fast
- Turns follow-up into a simple daily habit instead of stressful outreach sprints
- Result: more replies, more opportunities, fewer relationships fading due to silence''',
        'timestamp': datetime.now().isoformat(),
        'subreddits_checked': TARGET_SUBREDDITS,
        'total_posts': len(all_posts),
        'relevant_posts': len(relevant_posts),
        'top_relevant_posts': relevant_posts[:25],
        'insights': all_insights,
        'ad_targeting': {
            'primary_audiences': [
                'Sales professionals (SDRs, AEs, BDRs)',
                'Entrepreneurs and startup founders',
                'Freelancers and consultants',
                'Real estate agents',
                'Recruiters and HR professionals',
                'Business development managers',
                'Networkers and career climbers',
                'Introverts who find networking draining'
            ],
            'pain_points_to_address': [
                'Forgetting to follow up with important contacts',
                'Feeling guilty about letting relationships go cold',
                'Networking feels fake/forced/transactional',
                'Too many contacts to remember manually',
                'LinkedIn is overwhelming and noisy',
                'CRMs are too complex for personal networking',
                'Not knowing what to say when reconnecting',
                'Follow-up feels like a chore, not a habit'
            ],
            'ad_messaging_angles': [
                '🧠 "Never forget to follow up again"',
                '🔥 "See which relationships are going cold before it\'s too late"',
                '✍️ "AI writes the message, you hit send"',
                '📅 "Turn networking into a 5-minute daily habit"',
                '💬 "Reach out before they forget you"',
                '🎯 "Your personal CRM that actually gets used"',
                '😌 "Networking without the awkwardness"'
            ],
            'target_subreddits_for_ads': [
                'r/sales - Core audience, follow-up is critical',
                'r/Entrepreneur - Founders need strong networks',
                'r/freelance - Freelancers live on referrals',
                'r/realestate - Agents rely on relationships',
                'r/recruiting - Recruiters manage huge networks',
                'r/startups - Founders need investor/partner relationships',
                'r/consulting - Consultants need client relationships',
                'r/socialskills - People wanting to improve networking'
            ],
            'competitor_tools': [
                'LinkedIn (too noisy, not personal)',
                'Salesforce/HubSpot (too complex for personal use)',
                'Google Contacts (no intelligence)',
                'Notion CRM templates (manual effort)',
                'Clay (expensive, enterprise-focused)',
                'Dex (similar concept, different approach)',
                'Monica CRM (open source, self-hosted)'
            ]
        }
    }
    
    # Save report
    os.makedirs('reports', exist_ok=True)
    filename = f"reports/crm_network_research_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
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
    
    print(f"\n🔥 PAIN POINTS FOR EVERREACH:")
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
        for post in relevant_posts[:8]:
            print(f"  [{post['score']}] r/{post['subreddit']}: {post['title'][:55]}...")
    
    if all_insights['pain_points']:
        print(f"\n🔥 PAIN POINTS FROM REDDIT:")
        for pain in all_insights['pain_points'][:8]:
            print(f"  • {pain[:70]}...")
    
    if all_insights['questions']:
        print(f"\n❓ QUESTIONS PEOPLE ASK:")
        for q in all_insights['questions'][:8]:
            print(f"  • {q[:70]}...")
    
    print(f"\n📁 Full report: {filename}")
    
    return report


if __name__ == "__main__":
    run_research()
