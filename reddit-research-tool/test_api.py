#!/usr/bin/env python3
"""
API Endpoint Tests
Tests each Reddit RapidAPI endpoint to verify they work correctly
"""

import os
import time
import json
from dotenv import load_dotenv

load_dotenv()

from src.api_client import RedditAPIClient

def test_endpoints():
    """Test all API endpoints"""
    
    print("="*60)
    print("🧪 REDDIT API ENDPOINT TESTS")
    print("="*60)
    
    api = RedditAPIClient()
    print(f"✓ API Client initialized")
    print(f"  Host: {api.host}")
    print(f"  Key: {api.api_key[:20]}...")
    
    results = {}
    
    # Test 1: Search
    print("\n" + "-"*40)
    print("TEST 1: Search Endpoint (/v1/search)")
    print("-"*40)
    try:
        result = api.search("python programming", search_type="posts", limit=5)
        if 'error' in result:
            print(f"❌ FAILED: {result['error']}")
            results['search'] = {'status': 'FAILED', 'error': result['error']}
        else:
            posts = result.get('data', {}).get('children', []) or result.get('posts', [])
            print(f"✅ SUCCESS: Got {len(posts)} posts")
            if posts:
                sample = posts[0].get('data', posts[0])
                print(f"   Sample: {sample.get('title', 'N/A')[:50]}...")
            results['search'] = {'status': 'SUCCESS', 'count': len(posts)}
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results['search'] = {'status': 'ERROR', 'error': str(e)}
    
    time.sleep(2)
    
    # Test 2: Posts from subreddit
    print("\n" + "-"*40)
    print("TEST 2: Posts Endpoint (/v1/posts)")
    print("-"*40)
    try:
        result = api.get_posts("python", sort="hot", limit=5)
        if 'error' in result:
            print(f"❌ FAILED: {result['error']}")
            results['posts'] = {'status': 'FAILED', 'error': result['error']}
        else:
            posts = result.get('data', {}).get('children', []) or result.get('posts', [])
            print(f"✅ SUCCESS: Got {len(posts)} posts from r/python")
            if posts:
                sample = posts[0].get('data', posts[0])
                print(f"   Sample: {sample.get('title', 'N/A')[:50]}...")
            results['posts'] = {'status': 'SUCCESS', 'count': len(posts)}
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results['posts'] = {'status': 'ERROR', 'error': str(e)}
    
    time.sleep(2)
    
    # Test 3: Popular Subreddits
    print("\n" + "-"*40)
    print("TEST 3: Popular Subreddits (/v1/subreddit/popular)")
    print("-"*40)
    try:
        result = api.get_popular_subreddits(limit=5)
        if 'error' in result:
            print(f"❌ FAILED: {result['error']}")
            results['popular_subreddits'] = {'status': 'FAILED', 'error': result['error']}
        else:
            subs = result.get('data', {}).get('children', []) or result.get('subreddits', [])
            print(f"✅ SUCCESS: Got {len(subs)} popular subreddits")
            if subs:
                sample = subs[0].get('data', subs[0])
                print(f"   Sample: r/{sample.get('display_name', sample.get('name', 'N/A'))}")
            results['popular_subreddits'] = {'status': 'SUCCESS', 'count': len(subs)}
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results['popular_subreddits'] = {'status': 'ERROR', 'error': str(e)}
    
    time.sleep(2)
    
    # Test 4: New Subreddits
    print("\n" + "-"*40)
    print("TEST 4: New Subreddits (/v1/subreddit/new)")
    print("-"*40)
    try:
        result = api.get_new_subreddits(limit=5)
        if 'error' in result:
            print(f"❌ FAILED: {result['error']}")
            results['new_subreddits'] = {'status': 'FAILED', 'error': result['error']}
        else:
            subs = result.get('data', {}).get('children', []) or result.get('subreddits', [])
            print(f"✅ SUCCESS: Got {len(subs)} new subreddits")
            results['new_subreddits'] = {'status': 'SUCCESS', 'count': len(subs)}
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results['new_subreddits'] = {'status': 'ERROR', 'error': str(e)}
    
    time.sleep(2)
    
    # Test 5: Subreddit Comments
    print("\n" + "-"*40)
    print("TEST 5: Subreddit Comments (/v1/subreddit/comments)")
    print("-"*40)
    try:
        result = api.get_subreddit_comments("python", limit=5)
        if 'error' in result:
            print(f"❌ FAILED: {result['error']}")
            results['subreddit_comments'] = {'status': 'FAILED', 'error': result['error']}
        else:
            comments = result.get('data', {}).get('children', []) or result.get('comments', [])
            print(f"✅ SUCCESS: Got {len(comments)} comments from r/python")
            if comments:
                sample = comments[0].get('data', comments[0])
                print(f"   Sample: {sample.get('body', 'N/A')[:50]}...")
            results['subreddit_comments'] = {'status': 'SUCCESS', 'count': len(comments)}
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results['subreddit_comments'] = {'status': 'ERROR', 'error': str(e)}
    
    time.sleep(2)
    
    # Test 6: User Data
    print("\n" + "-"*40)
    print("TEST 6: User Data (/v1/user-data)")
    print("-"*40)
    try:
        result = api.get_user_data("spez")  # Reddit CEO
        if 'error' in result:
            print(f"❌ FAILED: {result['error']}")
            results['user_data'] = {'status': 'FAILED', 'error': result['error']}
        else:
            user = result.get('data', result)
            print(f"✅ SUCCESS: Got user data")
            print(f"   Username: {user.get('name', 'N/A')}")
            results['user_data'] = {'status': 'SUCCESS', 'user': user.get('name', 'N/A')}
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results['user_data'] = {'status': 'ERROR', 'error': str(e)}
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for r in results.values() if r['status'] == 'SUCCESS')
    failed = sum(1 for r in results.values() if r['status'] in ['FAILED', 'ERROR'])
    
    for endpoint, result in results.items():
        status_icon = "✅" if result['status'] == 'SUCCESS' else "❌"
        print(f"  {status_icon} {endpoint}: {result['status']}")
    
    print(f"\nTotal: {passed}/{len(results)} passed")
    
    # Save results
    with open('reports/api_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n📁 Results saved to: reports/api_test_results.json")
    
    return results


if __name__ == "__main__":
    import os
    os.makedirs('reports', exist_ok=True)
    test_endpoints()
