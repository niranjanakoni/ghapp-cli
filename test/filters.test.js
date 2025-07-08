/**
 * Filters utility tests
 * Tests for data filtering and sorting functionality
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Filters Module', () => {
  
  describe('filterRepositories', () => {
    const sampleRepos = [
      {
        name: 'public-js-repo',
        full_name: 'org/public-js-repo',
        private: false,
        language: 'JavaScript',
        stargazers_count: 15,
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        name: 'private-py-repo',
        full_name: 'org/private-py-repo',
        private: true,
        language: 'Python',
        stargazers_count: 5,
        updated_at: '2024-12-01T00:00:00Z'
      },
      {
        name: 'internal-repo',
        full_name: 'org/internal-repo',
        visibility: 'internal',
        language: 'Go',
        stargazers_count: 25,
        updated_at: '2025-01-15T00:00:00Z'
      }
    ];

    it('should filter repositories by visibility', async () => {
      const { filterRepositories } = await import('../src/utils/filters.js');
      
      const privateRepos = filterRepositories(sampleRepos, { visibility: 'private' });
      assert.strictEqual(privateRepos.length, 1);
      assert.strictEqual(privateRepos[0].name, 'private-py-repo');
      
      const publicRepos = filterRepositories(sampleRepos, { visibility: 'public' });
      assert.strictEqual(publicRepos.length, 1);
      assert.strictEqual(publicRepos[0].name, 'public-js-repo');
      
      const internalRepos = filterRepositories(sampleRepos, { visibility: 'internal' });
      assert.strictEqual(internalRepos.length, 1);
      assert.strictEqual(internalRepos[0].name, 'internal-repo');
    });

    it('should filter repositories by language', async () => {
      const { filterRepositories } = await import('../src/utils/filters.js');
      
      const jsRepos = filterRepositories(sampleRepos, { language: 'JavaScript' });
      assert.strictEqual(jsRepos.length, 1);
      assert.strictEqual(jsRepos[0].name, 'public-js-repo');
      
      const pyRepos = filterRepositories(sampleRepos, { language: 'python' }); // Case insensitive
      assert.strictEqual(pyRepos.length, 1);
      assert.strictEqual(pyRepos[0].name, 'private-py-repo');
    });

    it('should filter repositories by minimum stars', async () => {
      const { filterRepositories } = await import('../src/utils/filters.js');
      
      const popularRepos = filterRepositories(sampleRepos, { minStars: 10 });
      assert.strictEqual(popularRepos.length, 2);
      assert(popularRepos.some(repo => repo.name === 'public-js-repo'));
      assert(popularRepos.some(repo => repo.name === 'internal-repo'));
    });

    it('should filter repositories by maximum stars', async () => {
      const { filterRepositories } = await import('../src/utils/filters.js');
      
      const smallRepos = filterRepositories(sampleRepos, { maxStars: 10 });
      assert.strictEqual(smallRepos.length, 1);
      assert.strictEqual(smallRepos[0].name, 'private-py-repo');
    });

    it('should filter repositories by since date', async () => {
      const { filterRepositories } = await import('../src/utils/filters.js');
      
      const recentRepos = filterRepositories(sampleRepos, { since: '2025-01-01T00:00:00Z' });
      assert.strictEqual(recentRepos.length, 2);
      assert(recentRepos.some(repo => repo.name === 'public-js-repo'));
      assert(recentRepos.some(repo => repo.name === 'internal-repo'));
    });

    it('should apply multiple filters', async () => {
      const { filterRepositories } = await import('../src/utils/filters.js');
      
      const filtered = filterRepositories(sampleRepos, { 
        visibility: 'public',
        language: 'JavaScript',
        minStars: 10
      });
      
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].name, 'public-js-repo');
    });

    it('should return empty array when no repositories match filters', async () => {
      const { filterRepositories } = await import('../src/utils/filters.js');
      
      const filtered = filterRepositories(sampleRepos, { 
        language: 'Rust' // No Rust repos in sample
      });
      
      assert.strictEqual(filtered.length, 0);
    });
  });

  describe('filterTeams', () => {
    const sampleTeams = [
      {
        name: 'Public Team',
        privacy: 'open',
        members_count: 10
      },
      {
        name: 'Secret Team',
        privacy: 'secret',
        members_count: 3
      },
      {
        name: 'Closed Team',
        privacy: 'closed',
        members_count: 15
      }
    ];

    it('should filter teams by privacy/visibility', async () => {
      const { filterTeams } = await import('../src/utils/filters.js');
      
      const secretTeams = filterTeams(sampleTeams, { visibility: 'secret' });
      assert.strictEqual(secretTeams.length, 1);
      assert.strictEqual(secretTeams[0].name, 'Secret Team');
      
      const openTeams = filterTeams(sampleTeams, { visibility: 'open' });
      assert.strictEqual(openTeams.length, 1);
      assert.strictEqual(openTeams[0].name, 'Public Team');
    });

    it('should filter teams by minimum members', async () => {
      const { filterTeams } = await import('../src/utils/filters.js');
      
      const largeTeams = filterTeams(sampleTeams, { minMembers: 10 });
      assert.strictEqual(largeTeams.length, 2);
      assert(largeTeams.some(team => team.name === 'Public Team'));
      assert(largeTeams.some(team => team.name === 'Closed Team'));
    });

    it('should filter teams by maximum members', async () => {
      const { filterTeams } = await import('../src/utils/filters.js');
      
      const smallTeams = filterTeams(sampleTeams, { maxMembers: 5 });
      assert.strictEqual(smallTeams.length, 1);
      assert.strictEqual(smallTeams[0].name, 'Secret Team');
    });
  });

  describe('filterRepositoriesByNames', () => {
    const sampleRepos = [
      { name: 'repo1', full_name: 'org/repo1' },
      { name: 'repo2', full_name: 'org/repo2' },
      { name: 'special-repo', full_name: 'another-org/special-repo' }
    ];

    it('should filter repositories by exact names', async () => {
      const { filterRepositoriesByNames } = await import('../src/utils/filters.js');
      
      const filtered = filterRepositoriesByNames(sampleRepos, ['repo1', 'special-repo']);
      
      assert.strictEqual(filtered.length, 2);
      assert(filtered.some(repo => repo.name === 'repo1'));
      assert(filtered.some(repo => repo.name === 'special-repo'));
    });

    it('should filter repositories by full names', async () => {
      const { filterRepositoriesByNames } = await import('../src/utils/filters.js');
      
      const filtered = filterRepositoriesByNames(sampleRepos, ['another-org/special-repo']);
      
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].name, 'special-repo');
    });

    it('should be case insensitive', async () => {
      const { filterRepositoriesByNames } = await import('../src/utils/filters.js');
      
      const filtered = filterRepositoriesByNames(sampleRepos, ['REPO1', 'SPECIAL-REPO']);
      
      assert.strictEqual(filtered.length, 2);
    });
  });

  describe('sortRepositories', () => {
    const sampleRepos = [
      {
        name: 'z-repo',
        stargazers_count: 5,
        forks_count: 2,
        size: 1000,
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        name: 'a-repo',
        stargazers_count: 15,
        forks_count: 8,
        size: 2000,
        updated_at: '2025-01-15T00:00:00Z'
      },
      {
        name: 'm-repo',
        stargazers_count: 10,
        forks_count: 5,
        size: 1500,
        updated_at: '2025-01-10T00:00:00Z'
      }
    ];

    it('should sort repositories by name ascending', async () => {
      const { sortRepositories } = await import('../src/utils/filters.js');
      
      const sorted = sortRepositories(sampleRepos, 'name', 'asc');
      
      assert.strictEqual(sorted[0].name, 'a-repo');
      assert.strictEqual(sorted[1].name, 'm-repo');
      assert.strictEqual(sorted[2].name, 'z-repo');
    });

    it('should sort repositories by stars descending', async () => {
      const { sortRepositories } = await import('../src/utils/filters.js');
      
      const sorted = sortRepositories(sampleRepos, 'stars', 'desc');
      
      assert.strictEqual(sorted[0].stargazers_count, 15);
      assert.strictEqual(sorted[1].stargazers_count, 10);
      assert.strictEqual(sorted[2].stargazers_count, 5);
    });

    it('should sort repositories by forks ascending', async () => {
      const { sortRepositories } = await import('../src/utils/filters.js');
      
      const sorted = sortRepositories(sampleRepos, 'forks', 'asc');
      
      assert.strictEqual(sorted[0].forks_count, 2);
      assert.strictEqual(sorted[1].forks_count, 5);
      assert.strictEqual(sorted[2].forks_count, 8);
    });

    it('should sort repositories by updated date', async () => {
      const { sortRepositories } = await import('../src/utils/filters.js');
      
      const sorted = sortRepositories(sampleRepos, 'updated', 'desc');
      
      assert.strictEqual(sorted[0].updated_at, '2025-01-15T00:00:00Z');
      assert.strictEqual(sorted[1].updated_at, '2025-01-10T00:00:00Z');
      assert.strictEqual(sorted[2].updated_at, '2025-01-01T00:00:00Z');
    });
  });

  describe('sortTeams', () => {
    const sampleTeams = [
      { name: 'Z Team', members_count: 5, repos_count: 2 },
      { name: 'A Team', members_count: 15, repos_count: 8 },
      { name: 'M Team', members_count: 10, repos_count: 5 }
    ];

    it('should sort teams by name ascending', async () => {
      const { sortTeams } = await import('../src/utils/filters.js');
      
      const sorted = sortTeams(sampleTeams, 'name', 'asc');
      
      assert.strictEqual(sorted[0].name, 'A Team');
      assert.strictEqual(sorted[1].name, 'M Team');
      assert.strictEqual(sorted[2].name, 'Z Team');
    });

    it('should sort teams by members descending', async () => {
      const { sortTeams } = await import('../src/utils/filters.js');
      
      const sorted = sortTeams(sampleTeams, 'members', 'desc');
      
      assert.strictEqual(sorted[0].members_count, 15);
      assert.strictEqual(sorted[1].members_count, 10);
      assert.strictEqual(sorted[2].members_count, 5);
    });

    it('should sort teams by repos ascending', async () => {
      const { sortTeams } = await import('../src/utils/filters.js');
      
      const sorted = sortTeams(sampleTeams, 'repos', 'asc');
      
      assert.strictEqual(sorted[0].repos_count, 2);
      assert.strictEqual(sorted[1].repos_count, 5);
      assert.strictEqual(sorted[2].repos_count, 8);
    });
  });
});
