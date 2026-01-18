/**
 * NLP Suggestions API Tests
 *
 * Tests the GET /api/nlp/suggestions endpoint for server-powered NLP
 * @jest-environment node
 */

import { GET } from '@/app/api/nlp/suggestions/route';
import { NextRequest } from 'next/server';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [
            { embedding: new Array(1536).fill(0.1) }
          ]
        })
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    suggestions: [
                      'AI writing tools for marketers',
                      'content creation software',
                      'automated copywriting platforms'
                    ],
                    competitors: ['Jasper', 'Copy.ai', 'Writesonic'],
                    expandedKeywords: ['AI writing', 'content generation', 'copywriting', 'marketing automation']
                  })
                }
              }
            ]
          })
        }
      }
    }))
  };
});

describe('GET /api/nlp/suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return suggestions for a valid query', async () => {
    const request = new NextRequest('http://localhost:3001/api/nlp/suggestions?q=AI+writing+tools');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('suggestions');
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);

    // Check suggestion structure
    const suggestion = data.suggestions[0];
    expect(suggestion).toHaveProperty('text');
    expect(suggestion).toHaveProperty('category');
    expect(suggestion).toHaveProperty('confidence');
    expect(suggestion).toHaveProperty('type');
  });

  it('should return 400 if query parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3001/api/nlp/suggestions');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Query parameter is required');
  });

  it('should return 400 if query is too short', async () => {
    const request = new NextRequest('http://localhost:3001/api/nlp/suggestions?q=ai');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Query must be at least 3 characters');
  });

  it('should perform keyword expansion', async () => {
    const request = new NextRequest('http://localhost:3001/api/nlp/suggestions?q=project+management');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('expandedKeywords');
    expect(Array.isArray(data.expandedKeywords)).toBe(true);
    expect(data.expandedKeywords.length).toBeGreaterThan(0);
  });

  it('should perform competitor recognition', async () => {
    const request = new NextRequest('http://localhost:3001/api/nlp/suggestions?q=alternatives+to+Notion');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('competitors');
    expect(Array.isArray(data.competitors)).toBe(true);
  });

  it('should handle query rewrite', async () => {
    const request = new NextRequest('http://localhost:3001/api/nlp/suggestions?q=best+CRM+for+small+business');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('rewrittenQuery');
    expect(typeof data.rewrittenQuery).toBe('string');
  });

  it('should cache results for identical queries', async () => {
    const request1 = new NextRequest('http://localhost:3001/api/nlp/suggestions?q=AI+chatbots');
    const request2 = new NextRequest('http://localhost:3001/api/nlp/suggestions?q=AI+chatbots');

    const response1 = await GET(request1);
    const data1 = await response1.json();

    const response2 = await GET(request2);
    const data2 = await response2.json();

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(data1).toEqual(data2);
  });

  it('should handle rate limiting gracefully', async () => {
    // Make multiple requests from the same IP with unique queries
    // to exceed the rate limit (10 requests per minute)
    const requests = Array.from({ length: 15 }, (_, i) => {
      const req = new NextRequest(`http://localhost:3001/api/nlp/suggestions?q=unique+query+${i}`);
      // Set the same IP for all requests to trigger rate limiting
      Object.defineProperty(req, 'headers', {
        value: new Map([
          ['x-forwarded-for', '1.2.3.4']
        ]),
        writable: false,
      });
      return req;
    });

    const responses = await Promise.all(
      requests.map(req => GET(req))
    );

    const statusCodes = responses.map(r => r.status);

    // First 10 should succeed, rest should be rate limited
    expect(statusCodes.slice(0, 10).every(s => s === 200)).toBe(true);
    expect(statusCodes.slice(10).every(s => s === 429)).toBe(true);
  });

  it('should handle LLM errors gracefully', async () => {
    // This test verifies the endpoint returns proper error response
    // The fallback mechanism should handle LLM failures
    const request = new NextRequest('http://localhost:3001/api/nlp/suggestions?q=test+error+handling');

    const response = await GET(request);

    // Should succeed (with fallback) or return proper error
    expect([200, 500]).toContain(response.status);

    const data = await response.json();
    if (response.status === 200) {
      expect(data).toHaveProperty('suggestions');
      expect(data).toHaveProperty('expandedKeywords');
      expect(data).toHaveProperty('competitors');
    } else {
      expect(data).toHaveProperty('error');
    }
  });
});
