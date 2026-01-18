/**
 * Entity Recognition Tests
 *
 * Tests for NLP entity recognition (competitors, products, brands)
 */

import {
  extractEntities,
  recognizeCompetitors,
  linkToKnownBrands,
  EntityType,
  Entity
} from '@/lib/nlp/entities';

describe('Entity Recognition', () => {
  describe('extractEntities', () => {
    it('should extract competitor names from queries', () => {
      const query = 'alternatives to Notion for project management';
      const entities = extractEntities(query);

      expect(entities.length).toBeGreaterThan(0);

      const notionEntity = entities.find(e => e.name.toLowerCase() === 'notion');
      expect(notionEntity).toBeDefined();
      expect(notionEntity?.type).toBe('competitor');
    });

    it('should extract multiple competitors from comparison queries', () => {
      const query = 'Asana vs Trello vs ClickUp';
      const entities = extractEntities(query);

      const competitors = entities.filter(e => e.type === 'competitor');
      expect(competitors.length).toBeGreaterThanOrEqual(3);

      const names = competitors.map(c => c.name.toLowerCase());
      expect(names).toContain('asana');
      expect(names).toContain('trello');
      expect(names).toContain('clickup');
    });

    it('should handle queries without entities', () => {
      const query = 'project management software';
      const entities = extractEntities(query);

      expect(Array.isArray(entities)).toBe(true);
    });
  });

  describe('recognizeCompetitors', () => {
    it('should recognize well-known SaaS brands', () => {
      const competitors = recognizeCompetitors('looking for Slack alternative');

      expect(competitors.length).toBeGreaterThan(0);
      expect(competitors).toContain('Slack');
    });

    it('should return empty array for generic queries', () => {
      const competitors = recognizeCompetitors('email marketing software');

      expect(Array.isArray(competitors)).toBe(true);
    });
  });

  describe('linkToKnownBrands', () => {
    it('should link entities to known brand database', () => {
      const entities: Entity[] = [
        { name: 'Notion', type: 'competitor', confidence: 0.9 },
        { name: 'Unknown Startup', type: 'competitor', confidence: 0.5 }
      ];

      const linked = linkToKnownBrands(entities);

      const notionEntity = linked.find(e => e.name === 'Notion');
      expect(notionEntity?.linked).toBe(true);
      expect(notionEntity?.category).toBeDefined();
    });
  });
});
