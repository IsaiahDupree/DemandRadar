/**
 * Reddit Collector Tests
 */

import { collectRedditMentions, searchSubreddit } from '@/lib/collectors/reddit';

describe('Reddit Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collectRedditMentions', () => {
    it('returns array of mentions', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              children: [
                {
                  data: {
                    subreddit: 'fitness',
                    title: 'Best fitness app?',
                    selftext: 'Looking for recommendations',
                    score: 100,
                    num_comments: 25,
                    permalink: '/r/fitness/123',
                    created_utc: Date.now() / 1000,
                  },
                },
              ],
            },
          }),
        } as Response)
      );

      const mentions = await collectRedditMentions('fitness app', ['workout'], []);
      
      expect(Array.isArray(mentions)).toBe(true);
      expect(mentions.length).toBeGreaterThan(0);
      expect(mentions[0]).toHaveProperty('subreddit');
      expect(mentions[0]).toHaveProperty('title');
      expect(mentions[0]).toHaveProperty('score');
    });

    it('deduplicates by permalink', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              children: [
                { data: { subreddit: 'test', title: 'Dup', selftext: '', permalink: '/same', score: 1, num_comments: 0, created_utc: Date.now() / 1000 } },
                { data: { subreddit: 'test', title: 'Dup2', selftext: '', permalink: '/same', score: 2, num_comments: 0, created_utc: Date.now() / 1000 } },
              ],
            },
          }),
        } as Response)
      );

      const mentions = await collectRedditMentions('test', [], []);
      const permalinks = mentions.map(m => m.permalink);
      const uniquePermalinks = [...new Set(permalinks)];
      
      expect(permalinks.length).toBe(uniquePermalinks.length);
    });

    it('handles API errors gracefully', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const mentions = await collectRedditMentions('test', [], []);
      
      // Should return mock data on error
      expect(Array.isArray(mentions)).toBe(true);
    });

    it('handles rate limiting', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: { children: [{ data: { subreddit: 'test', title: 'Post 1', selftext: '', permalink: '/1', score: 10, created_utc: Date.now() / 1000 } }] },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: { children: [{ data: { subreddit: 'test', title: 'Post 2', selftext: '', permalink: '/2', score: 20, created_utc: Date.now() / 1000 } }] },
          }),
        } as Response);

      const start = Date.now();
      await collectRedditMentions('test', ['term1'], []);
      const elapsed = Date.now() - start;

      // Should have some delay between requests
      expect(elapsed).toBeGreaterThanOrEqual(400); // At least 400ms for rate limiting
    });
  });

  describe('searchSubreddit', () => {
    it('searches specific subreddit', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: { children: [] },
          }),
        } as Response)
      );

      await searchSubreddit('fitness', 'workout');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('r/fitness/search'),
        expect.any(Object)
      );
    });

    it('applies sort and time filters', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: { children: [] },
          }),
        } as Response)
      );

      await searchSubreddit('fitness', 'workout', 'top', 'month');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=top'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('t=month'),
        expect.any(Object)
      );
    });
  });
});
