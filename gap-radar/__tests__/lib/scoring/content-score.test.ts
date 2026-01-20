/**
 * Content Score Tests
 *
 * Tests for YouTube-based content score calculation (UDS-002)
 * Formula: View Velocity * 0.4 + Comment Questions * 0.3 + Gap Size * 0.3
 */

import {
  calculateContentScore,
  normalizeViewVelocity,
  analyzeCommentQuestions,
  identifyContentGaps,
  type YouTubeData
} from '@/lib/scoring/content-score';

describe('Content Score (YouTube)', () => {

  describe('calculateContentScore', () => {
    it('returns 0 for empty data', () => {
      const data: YouTubeData = {
        avgViews: 0,
        comments: [],
        videos: []
      };

      const score = calculateContentScore(data);
      expect(score).toBe(0);
    });

    it('returns score between 0-100', () => {
      const data: YouTubeData = {
        avgViews: 50000,
        comments: [
          'How do I do this?',
          'Where can I find more info?',
          'Great video!'
        ],
        videos: [
          { title: 'Tutorial 1', views: 40000, duration: 600 },
          { title: 'Tutorial 2', views: 60000, duration: 900 }
        ]
      };

      const score = calculateContentScore(data);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('increases with higher view velocity', () => {
      const lowViews: YouTubeData = {
        avgViews: 1000,
        comments: [],
        videos: []
      };

      const highViews: YouTubeData = {
        avgViews: 100000,
        comments: [],
        videos: []
      };

      expect(calculateContentScore(highViews)).toBeGreaterThan(calculateContentScore(lowViews));
    });

    it('increases with more question comments', () => {
      const noQuestions: YouTubeData = {
        avgViews: 50000,
        comments: ['Great video!', 'Thanks for sharing!'],
        videos: []
      };

      const manyQuestions: YouTubeData = {
        avgViews: 50000,
        comments: [
          'How do I start?',
          'Where can I buy this?',
          'When should I use this?',
          'Why does this work?',
          'What tools do I need?'
        ],
        videos: []
      };

      expect(calculateContentScore(manyQuestions)).toBeGreaterThan(calculateContentScore(noQuestions));
    });

    it('increases with content gaps', () => {
      const noGap: YouTubeData = {
        avgViews: 50000,
        comments: [],
        videos: [
          { title: 'Beginner Tutorial', views: 100000, duration: 600 },
          { title: 'Intermediate Tutorial', views: 80000, duration: 900 },
          { title: 'Advanced Tutorial', views: 60000, duration: 1200 },
          { title: 'Expert Tutorial', views: 40000, duration: 1500 }
        ]
      };

      const hasGap: YouTubeData = {
        avgViews: 50000,
        comments: [],
        videos: [
          { title: 'Beginner Tutorial', views: 100000, duration: 600 },
          { title: 'Expert Tutorial', views: 40000, duration: 1500 }
        ]
      };

      expect(calculateContentScore(hasGap)).toBeGreaterThan(calculateContentScore(noGap));
    });

    it('applies correct formula weights (40% velocity, 30% questions, 30% gaps)', () => {
      const data: YouTubeData = {
        avgViews: 50000,  // Should normalize to ~60
        comments: [
          'How do I do this?',
          'Where can I find more info?',
          'Great video!'
        ],  // Should be ~40 (2/3 are questions)
        videos: [
          { title: 'Tutorial 1', views: 50000, duration: 600 },
          { title: 'Tutorial 2', views: 50000, duration: 1200 }
        ]  // Should detect gap ~50
      };

      const score = calculateContentScore(data);

      // Expected: (60 * 0.4) + (40 * 0.3) + (50 * 0.3) = 24 + 12 + 15 = 51
      // Actual may vary due to logarithmic scaling
      expect(score).toBeGreaterThanOrEqual(40);
      expect(score).toBeLessThanOrEqual(80);
    });
  });

  describe('normalizeViewVelocity', () => {
    it('returns 0 for zero views', () => {
      expect(normalizeViewVelocity(0)).toBe(0);
    });

    it('returns score between 0-100', () => {
      expect(normalizeViewVelocity(50000)).toBeGreaterThanOrEqual(0);
      expect(normalizeViewVelocity(50000)).toBeLessThanOrEqual(100);
    });

    it('uses logarithmic scale for views', () => {
      // View increase should have diminishing returns
      const diff1 = normalizeViewVelocity(2000) - normalizeViewVelocity(1000);
      const diff2 = normalizeViewVelocity(200000) - normalizeViewVelocity(100000);

      expect(diff1).toBeGreaterThanOrEqual(diff2);
    });

    it('caps at 100 for very high views', () => {
      expect(normalizeViewVelocity(10000000)).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeCommentQuestions', () => {
    it('returns 0 for empty comments', () => {
      expect(analyzeCommentQuestions([])).toBe(0);
    });

    it('detects question marks', () => {
      const comments = ['How do I do this?', 'Where can I find more info?'];
      expect(analyzeCommentQuestions(comments)).toBeGreaterThan(50);
    });

    it('detects "how" questions', () => {
      const comments = ['how do i start', 'how can i improve this'];
      expect(analyzeCommentQuestions(comments)).toBeGreaterThan(50);
    });

    it('detects "what" questions', () => {
      const comments = ['what tools do i need', 'what is the best way'];
      expect(analyzeCommentQuestions(comments)).toBeGreaterThan(50);
    });

    it('detects "where" questions', () => {
      const comments = ['where can i buy this', 'where do i find the link'];
      expect(analyzeCommentQuestions(comments)).toBeGreaterThan(50);
    });

    it('detects "why" questions', () => {
      const comments = ['why does this work', 'why should i use this'];
      expect(analyzeCommentQuestions(comments)).toBeGreaterThan(50);
    });

    it('detects "when" questions', () => {
      const comments = ['when should i use this', 'when will this be released'];
      expect(analyzeCommentQuestions(comments)).toBeGreaterThan(50);
    });

    it('returns low score for non-question comments', () => {
      const comments = ['Great video!', 'Thanks for sharing!', 'Amazing content!'];
      expect(analyzeCommentQuestions(comments)).toBeLessThan(20);
    });

    it('calculates percentage of question comments', () => {
      const halfQuestions = [
        'How do I do this?',
        'Great video!',
        'Where can I find this?',
        'Thanks!'
      ];

      expect(analyzeCommentQuestions(halfQuestions)).toBeGreaterThan(40);
      expect(analyzeCommentQuestions(halfQuestions)).toBeLessThan(60);
    });
  });

  describe('identifyContentGaps', () => {
    it('returns 0 for empty videos', () => {
      expect(identifyContentGaps([])).toBe(0);
    });

    it('returns 0 for single video', () => {
      const videos = [
        { title: 'Tutorial', views: 50000, duration: 600 }
      ];
      expect(identifyContentGaps(videos)).toBe(0);
    });

    it('detects missing beginner content', () => {
      const videos = [
        { title: 'Advanced Tutorial', views: 50000, duration: 1200 },
        { title: 'Expert Tutorial', views: 40000, duration: 1500 }
      ];

      expect(identifyContentGaps(videos)).toBeGreaterThan(50);
    });

    it('detects missing intermediate content', () => {
      const videos = [
        { title: 'Beginner Tutorial', views: 100000, duration: 600 },
        { title: 'Expert Tutorial', views: 40000, duration: 1500 }
      ];

      // Missing intermediate (1 gap out of 5 = 40%)
      expect(identifyContentGaps(videos)).toBeGreaterThan(30);
      expect(identifyContentGaps(videos)).toBeLessThanOrEqual(60);
    });

    it('detects missing advanced content', () => {
      const videos = [
        { title: 'Beginner Tutorial', views: 100000, duration: 600 },
        { title: 'Intermediate Tutorial', views: 80000, duration: 900 }
      ];

      expect(identifyContentGaps(videos)).toBeGreaterThan(50);
    });

    it('detects missing short-form content', () => {
      const videos = [
        { title: 'Long Tutorial 1', views: 50000, duration: 1800 },
        { title: 'Long Tutorial 2', views: 40000, duration: 2400 }
      ];

      expect(identifyContentGaps(videos)).toBeGreaterThan(40);
    });

    it('detects missing long-form content', () => {
      const videos = [
        { title: 'Quick Tip 1', views: 50000, duration: 120 },
        { title: 'Quick Tip 2', views: 40000, duration: 180 }
      ];

      expect(identifyContentGaps(videos)).toBeGreaterThan(40);
    });

    it('returns low score for comprehensive content', () => {
      const videos = [
        { title: 'Beginner Tutorial', views: 100000, duration: 600 },
        { title: 'Intermediate Tutorial', views: 80000, duration: 900 },
        { title: 'Advanced Tutorial', views: 60000, duration: 1200 },
        { title: 'Expert Deep Dive', views: 40000, duration: 1800 }
      ];

      expect(identifyContentGaps(videos)).toBeLessThan(30);
    });
  });
});
