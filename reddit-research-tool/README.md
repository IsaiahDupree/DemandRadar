# Reddit Niche Research Tool

A systematic research tool for discovering SaaS opportunities by analyzing Reddit communities.

## Features

- 🔍 **Subreddit Discovery**: Find relevant subreddits for any niche using keyword variations
- 📊 **Post Analysis**: Analyze top posts from the past year for insights
- 🎯 **Pain Point Extraction**: Automatically identify user frustrations and problems
- ❓ **Question Mining**: Extract common questions users are asking
- 💡 **SaaS Opportunity Detection**: Generate potential product ideas from community signals
- 📈 **Theme Analysis**: Identify recurring topics and trends

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Key

1. Get your API key from [RapidAPI - Reddit API](https://rapidapi.com/)
2. Copy `.env.example` to `.env`
3. Add your API key:

```bash
cp .env.example .env
# Edit .env and add your RAPIDAPI_KEY
```

### 3. Run the Tool

```bash
# Full niche research
python main.py research "email marketing"

# Discover subreddits only
python main.py discover "project management" --limit 20

# Analyze a specific subreddit
python main.py analyze entrepreneur --posts 100
```

## Commands

### `research <niche>`
Full research workflow - discovers subreddits, analyzes posts, extracts insights.

Options:
- `--max-subs`: Maximum subreddits to analyze (default: 5)
- `--posts`: Posts per subreddit to analyze (default: 50)

### `discover <niche>`
Find subreddits related to a niche keyword.

Options:
- `--limit`: Maximum subreddits to return (default: 20)

### `analyze <subreddit>`
Deep analysis of a single subreddit.

Options:
- `--posts`: Number of posts to analyze (default: 50)

## Output

Reports are saved to the `reports/` directory as JSON files containing:
- Discovered subreddits with subscriber counts
- Top posts with engagement metrics
- Extracted pain points and questions
- Common themes and keywords
- Potential SaaS opportunities

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/v1/search` | Search for subreddits and posts |
| `/v1/posts` | Get posts from a subreddit |
| `/v1/post-details` | Get full post with comments |
| `/v1/subreddit/popular` | Get popular subreddits |
| `/v1/subreddit/comments` | Get recent comments |

## Research Workflow

```
1. NICHE INPUT
   └─> Generate keyword variations

2. SUBREDDIT DISCOVERY
   └─> Search for relevant communities
   └─> Rank by subscriber count

3. POST COLLECTION
   └─> Fetch top posts (year)
   └─> Include engagement metrics

4. CONTENT ANALYSIS
   └─> Pattern matching for pain points
   └─> Question extraction
   └─> Feature request detection
   └─> Solution mentions

5. INSIGHT GENERATION
   └─> Deduplicate findings
   └─> Rank by frequency
   └─> Generate opportunity ideas

6. REPORT OUTPUT
   └─> JSON report saved
   └─> CLI display with tables
```

## Example Use Cases

### Finding SaaS Ideas
```bash
python main.py research "freelancer invoicing"
```
Discovers pain points freelancers have with invoicing → potential invoicing SaaS.

### Market Research
```bash
python main.py research "saas founders"
```
Understand what SaaS founders struggle with → build tools for founders.

### Competitor Analysis
```bash
python main.py analyze saas
```
See what tools people mention and complain about in r/saas.

## Project Structure

```
reddit-niche-search/
├── main.py              # CLI entry point
├── requirements.txt     # Dependencies
├── .env.example         # API key template
├── ENDPOINTS.md         # API documentation
├── README.md            # This file
├── src/
│   ├── __init__.py
│   ├── api_client.py    # Reddit API client
│   ├── niche_analyzer.py # Content analysis
│   └── researcher.py    # Research workflow
└── reports/             # Generated reports
```

## License

MIT
