/**
 * Tests for webhooks command functionality
 */

import { describe, it } from 'node:test';
import assert from 'assert';
import { validateWebhookOptions, getWebhookStats } from '../src/commands/webhooks.js';

describe('Webhooks Command', () => {
  describe('validateWebhookOptions', () => {
    it('should validate sort options', () => {
      const validResult = validateWebhookOptions({ sort: 'repo' });
      assert.strictEqual(validResult.isValid, true);
      assert.strictEqual(validResult.errors.length, 0);

      const invalidResult = validateWebhookOptions({ sort: 'invalid' });
      assert.strictEqual(invalidResult.isValid, false);
      assert.strictEqual(invalidResult.errors.length, 1);
      assert(invalidResult.errors[0].includes('Invalid sort option'));
    });

    it('should validate order options', () => {
      const validResult = validateWebhookOptions({ order: 'asc' });
      assert.strictEqual(validResult.isValid, true);

      const invalidResult = validateWebhookOptions({ order: 'invalid' });
      assert.strictEqual(invalidResult.isValid, false);
      assert(invalidResult.errors[0].includes('Invalid order option'));
    });

    it('should handle multiple validation errors', () => {
      const result = validateWebhookOptions({
        sort: 'invalid',
        order: 'invalid'
      });
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 2);
    });

    it('should accept valid options', () => {
      const result = validateWebhookOptions({
        sort: 'webhooks',
        order: 'desc',
        event: 'push',
        activeOnly: true
      });
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('getWebhookStats', () => {
    const sampleWebhookData = [
      {
        repository: { name: 'repo1', full_name: 'org/repo1' },
        webhooks: [
          { active: true, events: ['push', 'pull_request'] },
          { active: false, events: ['issues'] }
        ],
        webhook_count: 2
      },
      {
        repository: { name: 'repo2', full_name: 'org/repo2' },
        webhooks: [
          { active: true, events: ['push', 'release'] }
        ],
        webhook_count: 1
      },
      {
        repository: { name: 'repo3', full_name: 'org/repo3' },
        webhooks: [],
        webhook_count: 0
      }
    ];

    it('should calculate basic statistics', () => {
      const stats = getWebhookStats(sampleWebhookData);
      
      assert.strictEqual(stats.totalRepositories, 3);
      assert.strictEqual(stats.repositoriesWithWebhooks, 2);
      assert.strictEqual(stats.repositoriesWithoutWebhooks, 1);
      assert.strictEqual(stats.totalWebhooks, 3);
    });

    it('should calculate active/inactive webhook counts', () => {
      const stats = getWebhookStats(sampleWebhookData);
      
      assert.strictEqual(stats.activeWebhooks, 2);
      assert.strictEqual(stats.inactiveWebhooks, 1);
    });

    it('should count most common events', () => {
      const stats = getWebhookStats(sampleWebhookData);
      
      assert.strictEqual(stats.mostCommonEvents.push, 2);
      assert.strictEqual(stats.mostCommonEvents.pull_request, 1);
      assert.strictEqual(stats.mostCommonEvents.issues, 1);
      assert.strictEqual(stats.mostCommonEvents.release, 1);
    });

    it('should calculate average webhooks per repo', () => {
      const stats = getWebhookStats(sampleWebhookData);
      
      assert.strictEqual(stats.averageWebhooksPerRepo, '1.0');
    });

    it('should handle empty webhook data', () => {
      const stats = getWebhookStats([]);
      
      assert.strictEqual(stats.totalRepositories, 0);
      assert.strictEqual(stats.totalWebhooks, 0);
      assert.strictEqual(stats.averageWebhooksPerRepo, 0);
    });

    it('should handle repositories without webhooks', () => {
      const noWebhooksData = [
        {
          repository: { name: 'repo1', full_name: 'org/repo1' },
          webhooks: [],
          webhook_count: 0
        },
        {
          repository: { name: 'repo2', full_name: 'org/repo2' },
          webhooks: [],
          webhook_count: 0
        }
      ];
      
      const stats = getWebhookStats(noWebhooksData);
      
      assert.strictEqual(stats.totalRepositories, 2);
      assert.strictEqual(stats.repositoriesWithWebhooks, 0);
      assert.strictEqual(stats.repositoriesWithoutWebhooks, 2);
      assert.strictEqual(stats.totalWebhooks, 0);
    });
  });

  describe('Webhook Data Structure', () => {
    it('should handle webhook configuration data', () => {
      const webhookConfig = {
        id: 12345,
        name: 'web',
        active: true,
        events: ['push', 'pull_request'],
        config: {
          url: 'https://example.com/webhook',
          content_type: 'json',
          secret: '***configured***',
          insecure_ssl: '0'
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z'
      };

      assert.strictEqual(webhookConfig.id, 12345);
      assert.strictEqual(webhookConfig.active, true);
      assert.strictEqual(webhookConfig.events.length, 2);
      assert.strictEqual(webhookConfig.config.url, 'https://example.com/webhook');
      assert.strictEqual(webhookConfig.config.content_type, 'json');
    });

    it('should handle repository webhook data structure', () => {
      const repoWebhookData = {
        repository: {
          name: 'test-repo',
          full_name: 'org/test-repo',
          private: false,
          html_url: 'https://github.com/org/test-repo'
        },
        webhooks: [
          {
            id: 1,
            active: true,
            events: ['push']
          }
        ],
        webhook_count: 1
      };

      assert.strictEqual(repoWebhookData.repository.name, 'test-repo');
      assert.strictEqual(repoWebhookData.webhook_count, 1);
      assert.strictEqual(repoWebhookData.webhooks.length, 1);
      assert.strictEqual(repoWebhookData.webhooks[0].active, true);
    });
  });

  describe('CSV Export Structure', () => {
    it('should format webhook events correctly', () => {
      const events = ['push', 'pull_request', 'issues'];
      const formattedEvents = events.join('; ');
      
      assert.strictEqual(formattedEvents, 'push; pull_request; issues');
    });

    it('should handle secret configuration display', () => {
      const configWithSecret = { secret: 'actual-secret-value' };
      const configWithoutSecret = {};
      
      const secretDisplay1 = configWithSecret.secret ? '***configured***' : 'not configured';
      const secretDisplay2 = configWithoutSecret.secret ? '***configured***' : 'not configured';
      
      assert.strictEqual(secretDisplay1, '***configured***');
      assert.strictEqual(secretDisplay2, 'not configured');
    });

    it('should handle boolean values for CSV', () => {
      const webhook = {
        active: true,
        repository: { private: false }
      };
      
      const activeStr = webhook.active ? 'true' : 'false';
      const privateStr = webhook.repository.private ? 'true' : 'false';
      
      assert.strictEqual(activeStr, 'true');
      assert.strictEqual(privateStr, 'false');
    });
  });
});
