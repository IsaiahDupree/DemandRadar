"""
Niche Analyzer
Analyzes Reddit data to extract pain points, questions, and SaaS opportunities
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from collections import Counter


@dataclass
class InsightCategory:
    """Represents a category of insights extracted from Reddit"""
    pain_points: List[str] = field(default_factory=list)
    questions: List[str] = field(default_factory=list)
    frustrations: List[str] = field(default_factory=list)
    requests: List[str] = field(default_factory=list)
    solutions_mentioned: List[str] = field(default_factory=list)
    beliefs: List[str] = field(default_factory=list)
    perspectives: List[str] = field(default_factory=list)


@dataclass
class SubredditInsight:
    """Insights from a single subreddit"""
    name: str
    subscribers: int = 0
    description: str = ""
    top_posts: List[Dict] = field(default_factory=list)
    insights: InsightCategory = field(default_factory=InsightCategory)
    common_themes: List[str] = field(default_factory=list)


class NicheAnalyzer:
    """Analyzes Reddit content to extract niche insights for SaaS opportunities"""
    
    # Patterns that indicate pain points or problems
    PAIN_PATTERNS = [
        r'\b(struggle|struggling|difficult|hard to|can\'t|cannot|unable to)\b',
        r'\b(frustrated|frustrating|annoying|annoyed|hate|hating)\b',
        r'\b(problem|issue|bug|broken|doesn\'t work|not working)\b',
        r'\b(wish there was|if only|would be nice if)\b',
        r'\b(tired of|sick of|fed up with)\b',
        r'\b(waste of time|time consuming|takes forever)\b',
        r'\b(expensive|overpriced|costs too much|can\'t afford)\b',
        r'\b(complicated|confusing|complex|overwhelming)\b',
    ]
    
    # Patterns that indicate questions/seeking help
    QUESTION_PATTERNS = [
        r'\b(how do I|how can I|how to|what\'s the best way)\b',
        r'\b(anyone know|does anyone|has anyone)\b',
        r'\b(looking for|searching for|need help with|need a)\b',
        r'\b(recommend|suggestion|advice|tips)\b',
        r'\b(alternative to|replacement for|instead of)\b',
        r'\b(is there a|are there any)\b',
        r'\?$',  # Ends with question mark
    ]
    
    # Patterns for feature requests / wishes
    REQUEST_PATTERNS = [
        r'\b(wish|want|need|require|would love)\b',
        r'\b(should have|must have|needs to have)\b',
        r'\b(feature request|suggestion|idea)\b',
        r'\b(please add|can you add|would be great if)\b',
    ]
    
    # Patterns for existing solutions mentioned
    SOLUTION_PATTERNS = [
        r'\b(I use|I\'m using|we use|currently using)\b',
        r'\b(switched to|moved to|migrated to)\b',
        r'\b(recommend|love|great tool|best tool)\b',
        r'\b(solved by|fixed by|helped by)\b',
    ]
    
    # Patterns for beliefs/perspectives
    BELIEF_PATTERNS = [
        r'\b(I think|I believe|in my opinion|IMO|IMHO)\b',
        r'\b(the problem is|the issue is|the truth is)\b',
        r'\b(people don\'t realize|most people think)\b',
        r'\b(the best approach|the right way|should be)\b',
    ]
    
    def __init__(self):
        self.compiled_patterns = {
            'pain': [re.compile(p, re.IGNORECASE) for p in self.PAIN_PATTERNS],
            'question': [re.compile(p, re.IGNORECASE) for p in self.QUESTION_PATTERNS],
            'request': [re.compile(p, re.IGNORECASE) for p in self.REQUEST_PATTERNS],
            'solution': [re.compile(p, re.IGNORECASE) for p in self.SOLUTION_PATTERNS],
            'belief': [re.compile(p, re.IGNORECASE) for p in self.BELIEF_PATTERNS],
        }
    
    def _matches_patterns(self, text: str, pattern_type: str) -> bool:
        """Check if text matches any pattern of the given type"""
        patterns = self.compiled_patterns.get(pattern_type, [])
        return any(p.search(text) for p in patterns)
    
    def _extract_sentence_with_pattern(self, text: str, pattern_type: str) -> List[str]:
        """Extract sentences that match patterns"""
        sentences = re.split(r'[.!?\n]', text)
        matches = []
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence and self._matches_patterns(sentence, pattern_type):
                matches.append(sentence)
        return matches
    
    def analyze_post(self, post: Dict[str, Any]) -> Dict[str, List[str]]:
        """
        Analyze a single post for insights.
        
        Args:
            post: Post data with 'title', 'selftext', 'score', etc.
            
        Returns:
            Dictionary of categorized insights
        """
        title = post.get('title', '')
        body = post.get('selftext', '') or post.get('body', '')
        full_text = f"{title}. {body}"
        
        return {
            'pain_points': self._extract_sentence_with_pattern(full_text, 'pain'),
            'questions': self._extract_sentence_with_pattern(full_text, 'question'),
            'requests': self._extract_sentence_with_pattern(full_text, 'request'),
            'solutions': self._extract_sentence_with_pattern(full_text, 'solution'),
            'beliefs': self._extract_sentence_with_pattern(full_text, 'belief'),
        }
    
    def analyze_comments(self, comments: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Analyze a list of comments for insights"""
        all_insights = {
            'pain_points': [],
            'questions': [],
            'requests': [],
            'solutions': [],
            'beliefs': [],
        }
        
        for comment in comments:
            body = comment.get('body', '') or comment.get('text', '')
            if not body:
                continue
                
            insights = {
                'pain_points': self._extract_sentence_with_pattern(body, 'pain'),
                'questions': self._extract_sentence_with_pattern(body, 'question'),
                'requests': self._extract_sentence_with_pattern(body, 'request'),
                'solutions': self._extract_sentence_with_pattern(body, 'solution'),
                'beliefs': self._extract_sentence_with_pattern(body, 'belief'),
            }
            
            for key in all_insights:
                all_insights[key].extend(insights[key])
        
        return all_insights
    
    def extract_common_themes(self, posts: List[Dict[str, Any]], top_n: int = 20) -> List[str]:
        """
        Extract common themes/keywords from post titles.
        
        Args:
            posts: List of posts
            top_n: Number of top themes to return
            
        Returns:
            List of common themes/keywords
        """
        # Common stopwords to filter out
        stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
            'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my',
            'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who',
            'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
            'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'same',
            'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
            'about', 'into', 'over', 'after', 'before', 'up', 'down', 'out', 'off',
            'if', 'then', 'else', 'because', 'as', 'until', 'while', 'during',
            'through', 'again', 'once', 'any', 'get', 'got', 'like', 'know', 'think',
            'want', 'need', 'use', 'using', 'used', 'new', 'first', 'last', 'one',
            'two', 'way', 'even', 'well', 'back', 'still', 'going', 'make', 'made',
            'anyone', 'someone', 'everyone', 'something', 'anything', 'everything',
            'really', 'much', 'many', 'dont', "don't", 'im', "i'm", 'ive', "i've",
        }
        
        word_counts = Counter()
        
        for post in posts:
            title = post.get('title', '')
            # Extract words, convert to lowercase
            words = re.findall(r'\b[a-zA-Z]{3,}\b', title.lower())
            # Filter stopwords
            words = [w for w in words if w not in stopwords]
            word_counts.update(words)
        
        return [word for word, _ in word_counts.most_common(top_n)]
    
    def categorize_post_by_intent(self, post: Dict[str, Any]) -> str:
        """
        Categorize a post by user intent.
        
        Returns one of:
        - 'question': Seeking help or information
        - 'complaint': Expressing frustration
        - 'request': Requesting a feature or solution
        - 'discussion': General discussion
        - 'showcase': Sharing work or achievement
        """
        title = post.get('title', '').lower()
        
        if '?' in title or self._matches_patterns(title, 'question'):
            return 'question'
        elif self._matches_patterns(title, 'pain'):
            return 'complaint'
        elif self._matches_patterns(title, 'request'):
            return 'request'
        elif any(word in title for word in ['i made', 'i built', 'i created', 'check out', 'showcase']):
            return 'showcase'
        else:
            return 'discussion'
    
    def generate_saas_opportunities(self, insights: InsightCategory) -> List[Dict[str, str]]:
        """
        Generate potential SaaS opportunity ideas from insights.
        
        Returns list of opportunity objects with problem and potential solution
        """
        opportunities = []
        
        # Analyze pain points for opportunities
        for pain in insights.pain_points[:10]:  # Top 10 pain points
            opportunities.append({
                'type': 'pain_point',
                'signal': pain,
                'opportunity': f"Tool to address: {pain[:100]}..."
            })
        
        # Analyze questions for opportunities
        for question in insights.questions[:10]:
            opportunities.append({
                'type': 'question',
                'signal': question,
                'opportunity': f"Solution that answers: {question[:100]}..."
            })
        
        # Analyze feature requests
        for request in insights.requests[:10]:
            opportunities.append({
                'type': 'feature_request',
                'signal': request,
                'opportunity': f"Build feature: {request[:100]}..."
            })
        
        return opportunities


# Quick test
if __name__ == "__main__":
    analyzer = NicheAnalyzer()
    
    test_post = {
        'title': "How do I automate my invoicing? Spending too much time on this",
        'selftext': "I'm frustrated with the current tools. They're all so complicated and expensive. Does anyone know a better alternative to QuickBooks?"
    }
    
    insights = analyzer.analyze_post(test_post)
    print("Pain points:", insights['pain_points'])
    print("Questions:", insights['questions'])
    print("Solutions:", insights['solutions'])
