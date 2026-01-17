# Reddit RapidAPI Endpoints Documentation

## API Configuration
- **Host**: `reddit13.p.rapidapi.com`
- **Base URL**: `https://reddit13.p.rapidapi.com`
- **Headers Required**:
  - `X-RapidAPI-Key`: Your API key
  - `X-RapidAPI-Host`: `reddit13.p.rapidapi.com`

---

## Endpoints

### 1. Search (`GET /v1/search`)
Search Reddit for posts, subreddits, or users.
```
GET https://reddit13.p.rapidapi.com/v1/reddit/search
Parameters:
  - search: string (search query)
  - subreddit: string (optional, filter by subreddit)
  - type: string (posts, subreddits, users)
  - sort: string (relevance, hot, top, new, comments)
  - time: string (hour, day, week, month, year, all)
```

### 2. Posts (`GET /v1/posts`)
Get posts from a subreddit.
```
GET https://reddit13.p.rapidapi.com/v1/reddit/posts
Parameters:
  - subreddit: string
  - sort: string (hot, new, top, rising)
  - time: string (for top: hour, day, week, month, year, all)
  - limit: integer
```

### 3. Post Details with Comments (`GET /v1/post-details`)
Get full post details including all comments.
```
GET https://reddit13.p.rapidapi.com/v1/reddit/post
Parameters:
  - postId: string (Reddit post ID)
  - subreddit: string
  - sort: string (best, top, new, controversial)
  - limit: integer (comment limit)
```

### 4. Popular Subreddits (`GET /v1/subreddit/popular`)
Get list of popular subreddits.
```
GET https://reddit13.p.rapidapi.com/v1/reddit/sub/reddit/popular
Parameters:
  - limit: integer
  - after: string (pagination cursor)
```

### 5. New Subreddits (`GET /v1/subreddit/new`)
Get newly created subreddits.
```
GET https://reddit13.p.rapidapi.com/v1/reddit/sub/reddit/new
Parameters:
  - limit: integer
```

### 6. Subreddit Comments (`GET /v1/subreddit/comments`)
Get recent comments from a subreddit.
```
GET https://reddit13.p.rapidapi.com/v1/reddit/subreddit/comments
Parameters:
  - subreddit: string
  - limit: integer
```

### 7. User Data (`GET /v1/user-data`)
Get user profile and activity data with filtering options.
```
GET https://reddit13.p.rapidapi.com/v1/reddit/user-data
Parameters:
  - username: string (Reddit username)
  - filter: string (posts, comments, submitted, gilded, etc.)
  - sort: string (new, hot, top, controversial)
  - type: string (optional, content type filter)
```

---

## Research Workflow

### Phase 1: Niche Discovery
1. Use `/v1/search` with niche keywords to find relevant subreddits
2. Use `/v1/subreddit/popular` to find trending communities

### Phase 2: Content Analysis
1. Use `/v1/posts` with `sort=top` and `time=year` to get popular posts
2. Use `/v1/post-details` to get full comments for sentiment/pain point analysis

### Phase 3: Pattern Extraction
1. Analyze post titles and content for:
   - Questions (pain points)
   - Complaints (frustrations)
   - Requests (unmet needs)
   - Recommendations (existing solutions)
