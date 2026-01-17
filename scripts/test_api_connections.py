#!/usr/bin/env python3
"""
API Connection Test Script
Tests connectivity to Meta Ads Library and RapidAPI endpoints.
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional

# Try to import httpx, fall back to requests
try:
    import httpx
    USE_HTTPX = True
except ImportError:
    import requests
    USE_HTTPX = False

from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class APITester:
    """Test API connections for Market Radar."""
    
    def __init__(self):
        self.results = {}
        self.rapidapi_key = os.getenv("RAPIDAPI_KEY")
        self.meta_access_token = os.getenv("META_ACCESS_TOKEN") or os.getenv("FACEBOOK_ACCESS_TOKEN")
        
    def _make_request(self, url: str, headers: Dict = None, params: Dict = None) -> Dict[str, Any]:
        """Make HTTP GET request."""
        try:
            if USE_HTTPX:
                with httpx.Client(timeout=30.0) as client:
                    response = client.get(url, headers=headers, params=params)
                    return {
                        "status_code": response.status_code,
                        "data": response.json() if response.status_code == 200 else None,
                        "error": response.text if response.status_code != 200 else None
                    }
            else:
                response = requests.get(url, headers=headers, params=params, timeout=30)
                return {
                    "status_code": response.status_code,
                    "data": response.json() if response.status_code == 200 else None,
                    "error": response.text if response.status_code != 200 else None
                }
        except Exception as e:
            return {
                "status_code": 0,
                "data": None,
                "error": str(e)
            }
    
    # ==================== META ADS LIBRARY ====================
    
    def test_meta_ads_library(self) -> Dict:
        """Test Meta Ads Library connection."""
        print("\n" + "="*60)
        print("Testing META ADS LIBRARY")
        print("="*60)
        
        if not self.meta_access_token:
            result = {
                "status": "SKIPPED",
                "message": "META_ACCESS_TOKEN not set in environment",
                "help": "Set META_ACCESS_TOKEN or FACEBOOK_ACCESS_TOKEN in .env"
            }
            print(f"⚠️  {result['message']}")
            self.results["meta_ads_library"] = result
            return result
        
        # Test 1: Basic user info (verify token works)
        print("\n1. Testing token validity (me endpoint)...")
        url = "https://graph.facebook.com/v21.0/me"
        params = {
            "fields": "id,name",
            "access_token": self.meta_access_token
        }
        
        response = self._make_request(url, params=params)
        
        if response["status_code"] == 200:
            print(f"   ✅ Token valid - User: {response['data'].get('name', 'Unknown')}")
            token_valid = True
        else:
            print(f"   ❌ Token invalid - {response.get('error', 'Unknown error')[:100]}")
            token_valid = False
        
        # Test 2: Ads Archive (public, no auth needed for political ads)
        print("\n2. Testing Ads Archive (public endpoint)...")
        url = "https://graph.facebook.com/v21.0/ads_archive"
        params = {
            "search_terms": "fitness app",
            "ad_type": "ALL",
            "ad_reached_countries": '["US"]',
            "fields": "id,ad_creation_time,page_name",
            "limit": 5,
            "access_token": self.meta_access_token
        }
        
        response = self._make_request(url, params=params)
        
        ads_archive_works = False
        if response["status_code"] == 200:
            data = response.get("data", {})
            ad_count = len(data.get("data", [])) if isinstance(data, dict) else 0
            print(f"   ✅ Ads Archive accessible - Found {ad_count} ads")
            ads_archive_works = True
        else:
            error_msg = response.get("error", "Unknown error")
            if "permissions" in error_msg.lower() or "access" in error_msg.lower():
                print(f"   ⚠️  Needs permissions - {error_msg[:100]}")
            else:
                print(f"   ❌ Failed - {error_msg[:100]}")
        
        result = {
            "status": "OK" if token_valid else "FAILED",
            "token_valid": token_valid,
            "ads_archive_accessible": ads_archive_works,
            "timestamp": datetime.now().isoformat()
        }
        self.results["meta_ads_library"] = result
        return result
    
    # ==================== RAPIDAPI ENDPOINTS ====================
    
    def _test_rapidapi_endpoint(self, name: str, host: str, endpoint: str, params: Dict) -> Dict:
        """Test a single RapidAPI endpoint."""
        if not self.rapidapi_key:
            return {
                "status": "SKIPPED",
                "message": "RAPIDAPI_KEY not set"
            }
        
        url = f"https://{host}{endpoint}"
        headers = {
            "X-RapidAPI-Key": self.rapidapi_key,
            "X-RapidAPI-Host": host
        }
        
        response = self._make_request(url, headers=headers, params=params)
        
        if response["status_code"] == 200:
            return {
                "status": "OK",
                "status_code": 200,
                "sample_data": str(response.get("data", {}))[:200]
            }
        elif response["status_code"] == 429:
            return {
                "status": "RATE_LIMITED",
                "status_code": 429,
                "message": "Rate limited - API works but quota exceeded"
            }
        elif response["status_code"] == 401:
            return {
                "status": "UNAUTHORIZED",
                "status_code": 401,
                "message": "Invalid API key or not subscribed"
            }
        elif response["status_code"] == 403:
            return {
                "status": "FORBIDDEN",
                "status_code": 403,
                "message": "Not subscribed to this API"
            }
        else:
            return {
                "status": "FAILED",
                "status_code": response["status_code"],
                "error": response.get("error", "Unknown")[:200]
            }
    
    def test_tiktok_api(self) -> Dict:
        """Test TikTok Scraper7 API."""
        print("\n" + "="*60)
        print("Testing TIKTOK SCRAPER7 API")
        print("="*60)
        
        if not self.rapidapi_key:
            result = {"status": "SKIPPED", "message": "RAPIDAPI_KEY not set"}
            print(f"⚠️  {result['message']}")
            self.results["tiktok_scraper7"] = result
            return result
        
        result = self._test_rapidapi_endpoint(
            name="TikTok Scraper7",
            host="tiktok-scraper7.p.rapidapi.com",
            endpoint="/user/info",
            params={"unique_id": "tiktok"}
        )
        
        status_icon = "✅" if result["status"] == "OK" else "⚠️" if result["status"] == "RATE_LIMITED" else "❌"
        print(f"{status_icon} TikTok Scraper7: {result['status']}")
        if result.get("sample_data"):
            print(f"   Sample: {result['sample_data'][:100]}...")
        
        self.results["tiktok_scraper7"] = result
        return result
    
    def test_instagram_api(self) -> Dict:
        """Test Instagram Looter2 API."""
        print("\n" + "="*60)
        print("Testing INSTAGRAM LOOTER2 API")
        print("="*60)
        
        if not self.rapidapi_key:
            result = {"status": "SKIPPED", "message": "RAPIDAPI_KEY not set"}
            print(f"⚠️  {result['message']}")
            self.results["instagram_looter2"] = result
            return result
        
        result = self._test_rapidapi_endpoint(
            name="Instagram Looter2",
            host="instagram-looter2.p.rapidapi.com",
            endpoint="/profile",
            params={"username": "instagram"}
        )
        
        status_icon = "✅" if result["status"] == "OK" else "⚠️" if result["status"] == "RATE_LIMITED" else "❌"
        print(f"{status_icon} Instagram Looter2: {result['status']}")
        if result.get("sample_data"):
            print(f"   Sample: {result['sample_data'][:100]}...")
        
        self.results["instagram_looter2"] = result
        return result
    
    def test_youtube_api(self) -> Dict:
        """Test YT-API."""
        print("\n" + "="*60)
        print("Testing YOUTUBE (YT-API)")
        print("="*60)
        
        if not self.rapidapi_key:
            result = {"status": "SKIPPED", "message": "RAPIDAPI_KEY not set"}
            print(f"⚠️  {result['message']}")
            self.results["yt_api"] = result
            return result
        
        result = self._test_rapidapi_endpoint(
            name="YT-API",
            host="yt-api.p.rapidapi.com",
            endpoint="/trending",
            params={"geo": "US"}
        )
        
        status_icon = "✅" if result["status"] == "OK" else "⚠️" if result["status"] == "RATE_LIMITED" else "❌"
        print(f"{status_icon} YouTube (YT-API): {result['status']}")
        if result.get("sample_data"):
            print(f"   Sample: {result['sample_data'][:100]}...")
        
        self.results["yt_api"] = result
        return result
    
    def test_reddit_api(self) -> Dict:
        """Test Reddit3 (SteadyAPI) API."""
        print("\n" + "="*60)
        print("Testing REDDIT3 (SteadyAPI) API")
        print("="*60)
        
        if not self.rapidapi_key:
            result = {"status": "SKIPPED", "message": "RAPIDAPI_KEY not set"}
            print(f"⚠️  {result['message']}")
            self.results["reddit3"] = result
            return result
        
        result = self._test_rapidapi_endpoint(
            name="Reddit3",
            host="reddit3.p.rapidapi.com",
            endpoint="/v1/reddit/search",
            params={"search": "investing", "filter": "posts", "limit": "5"}
        )
        
        status_icon = "✅" if result["status"] == "OK" else "⚠️" if result["status"] == "RATE_LIMITED" else "❌"
        print(f"{status_icon} Reddit3: {result['status']}")
        if result.get("sample_data"):
            print(f"   Sample: {result['sample_data'][:100]}...")
        
        self.results["reddit3"] = result
        return result
    
    def test_app_store_api(self) -> Dict:
        """Test App Store search API."""
        print("\n" + "="*60)
        print("Testing APP STORE APIs")
        print("="*60)
        
        if not self.rapidapi_key:
            result = {"status": "SKIPPED", "message": "RAPIDAPI_KEY not set"}
            print(f"⚠️  {result['message']}")
            self.results["app_store"] = result
            return result
        
        # Test iOS App Store
        result_ios = self._test_rapidapi_endpoint(
            name="iOS App Store",
            host="app-store-ios.p.rapidapi.com",
            endpoint="/search",
            params={"country": "us", "term": "fitness"}
        )
        
        status_icon = "✅" if result_ios["status"] == "OK" else "⚠️" if result_ios["status"] == "RATE_LIMITED" else "❌"
        print(f"{status_icon} iOS App Store: {result_ios['status']}")
        
        # Test Google Play
        result_android = self._test_rapidapi_endpoint(
            name="Google Play",
            host="google-play-scraper.p.rapidapi.com",
            endpoint="/search",
            params={"country": "us", "term": "fitness"}
        )
        
        status_icon = "✅" if result_android["status"] == "OK" else "⚠️" if result_android["status"] == "RATE_LIMITED" else "❌"
        print(f"{status_icon} Google Play: {result_android['status']}")
        
        result = {
            "ios_app_store": result_ios,
            "google_play": result_android
        }
        self.results["app_store"] = result
        return result
    
    def run_all_tests(self) -> Dict:
        """Run all API connection tests."""
        print("\n" + "="*60)
        print("  API CONNECTION TEST SUITE")
        print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        print("="*60)
        
        # Check environment
        print("\n📋 Environment Check:")
        print(f"   RAPIDAPI_KEY: {'✅ Set' if self.rapidapi_key else '❌ Not set'}")
        print(f"   META_ACCESS_TOKEN: {'✅ Set' if self.meta_access_token else '❌ Not set'}")
        
        # Run tests
        self.test_meta_ads_library()
        self.test_tiktok_api()
        self.test_instagram_api()
        self.test_youtube_api()
        self.test_reddit_api()
        self.test_app_store_api()
        
        # Summary
        print("\n" + "="*60)
        print("  SUMMARY")
        print("="*60)
        
        for api, result in self.results.items():
            if isinstance(result, dict):
                status = result.get("status", "UNKNOWN")
                icon = "✅" if status == "OK" else "⚠️" if status in ["SKIPPED", "RATE_LIMITED"] else "❌"
                print(f"{icon} {api}: {status}")
        
        return self.results
    
    def save_results(self, filepath: str = None):
        """Save test results to JSON file."""
        if filepath is None:
            filepath = os.path.join(
                os.path.dirname(__file__),
                f"api_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )
        
        with open(filepath, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "results": self.results
            }, f, indent=2)
        
        print(f"\n📄 Results saved to: {filepath}")


def main():
    """Main entry point."""
    tester = APITester()
    results = tester.run_all_tests()
    tester.save_results()
    
    # Exit with error code if any tests failed
    failed = any(
        isinstance(r, dict) and r.get("status") == "FAILED"
        for r in results.values()
    )
    exit(1 if failed else 0)


if __name__ == "__main__":
    main()
