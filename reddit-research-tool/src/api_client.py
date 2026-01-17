"""
Reddit RapidAPI Client
Handles all API requests to the Reddit RapidAPI endpoints
"""

import os
import requests
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()


class RedditAPIClient:
    """Client for Reddit RapidAPI endpoints"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("RAPIDAPI_KEY")
        self.host = os.getenv("RAPIDAPI_HOST", "reddit13.p.rapidapi.com")
        self.base_url = f"https://{self.host}"
        
        if not self.api_key:
            raise ValueError("RAPIDAPI_KEY is required. Set it in .env or pass to constructor.")
        
        self.headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.host
        }
    
    def _request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a GET request to the API"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status": "failed"}
    
    # ==================== SEARCH ====================
    
    def search(
        self,
        query: str,
        search_type: str = "posts",
        subreddit: Optional[str] = None,
        sort: str = "relevance",
        time_filter: str = "all",
        limit: int = 25
    ) -> Dict[str, Any]:
        """
        Search Reddit for posts, subreddits, or users.
        
        Args:
            query: Search term
            search_type: 'posts', 'subreddits', or 'users'
            subreddit: Optional subreddit to search within
            sort: 'relevance', 'hot', 'top', 'new', 'comments'
            time_filter: 'hour', 'day', 'week', 'month', 'year', 'all'
            limit: Number of results
        """
        params = {
            "search": query,
            "type": search_type,
            "sort": sort,
            "time": time_filter,
            "limit": limit
        }
        if subreddit:
            params["subreddit"] = subreddit
            
        return self._request("/v1/reddit/search", params)
    
    def search_subreddits(self, query: str, limit: int = 25) -> Dict[str, Any]:
        """Search for subreddits matching a query"""
        return self.search(query, search_type="subreddits", limit=limit)
    
    # ==================== POSTS ====================
    
    def get_posts(
        self,
        subreddit: str,
        sort: str = "top",
        time_filter: str = "year",
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Get posts from a subreddit.
        
        Args:
            subreddit: Subreddit name (without r/)
            sort: 'hot', 'new', 'top', 'rising'
            time_filter: For 'top': 'hour', 'day', 'week', 'month', 'year', 'all'
            limit: Number of posts
        """
        params = {
            "url": f"https://www.reddit.com/r/{subreddit}",
            "filter": sort
        }
        return self._request("/v1/reddit/posts", params)
    
    def get_top_posts_year(self, subreddit: str, limit: int = 100) -> Dict[str, Any]:
        """Get top posts from last year"""
        return self.get_posts(subreddit, sort="top", time_filter="year", limit=limit)
    
    # ==================== POST DETAILS ====================
    
    def get_post_details(
        self,
        post_id: str,
        subreddit: str,
        sort: str = "best",
        comment_limit: int = 100
    ) -> Dict[str, Any]:
        """
        Get full post details including comments.
        
        Args:
            post_id: Reddit post ID
            subreddit: Subreddit name
            sort: Comment sort - 'best', 'top', 'new', 'controversial'
            comment_limit: Max comments to fetch
        """
        params = {
            "postId": post_id,
            "subreddit": subreddit,
            "sort": sort,
            "limit": comment_limit
        }
        return self._request("/v1/reddit/post-details", params)
    
    # ==================== SUBREDDITS ====================
    
    def get_popular_subreddits(self, limit: int = 25, after: Optional[str] = None) -> Dict[str, Any]:
        """Get list of popular subreddits"""
        params = {"limit": limit}
        if after:
            params["after"] = after
        return self._request("/v1/reddit/subreddit/popular", params)
    
    def get_new_subreddits(self, limit: int = 25) -> Dict[str, Any]:
        """Get newly created subreddits"""
        params = {"limit": limit}
        return self._request("/v1/reddit/subreddit/new", params)
    
    def get_subreddit_comments(self, subreddit: str, limit: int = 100) -> Dict[str, Any]:
        """Get recent comments from a subreddit"""
        params = {
            "subreddit": subreddit,
            "limit": limit
        }
        return self._request("/v1/reddit/subreddit/comments", params)
    
    # ==================== USER ====================
    
    def get_user_data(
        self,
        username: str,
        filter_type: Optional[str] = None,
        sort: str = "new"
    ) -> Dict[str, Any]:
        """
        Get user profile and activity data.
        
        Args:
            username: Reddit username
            filter_type: Filter content - 'posts', 'comments', 'submitted', 'gilded'
            sort: Sort order - 'new', 'hot', 'top', 'controversial'
        """
        params = {"username": username, "sort": sort}
        if filter_type:
            params["filter"] = filter_type
        return self._request("/v1/reddit/user-data", params)
    
    def get_user_comments(self, username: str, sort: str = "new") -> Dict[str, Any]:
        """Get user's comments"""
        return self.get_user_data(username, filter_type="comments", sort=sort)
    
    def get_user_posts(self, username: str, sort: str = "new") -> Dict[str, Any]:
        """Get user's submitted posts"""
        return self.get_user_data(username, filter_type="posts", sort=sort)


# Quick test
if __name__ == "__main__":
    client = RedditAPIClient()
    print("API Client initialized successfully")
    print(f"Host: {client.host}")
