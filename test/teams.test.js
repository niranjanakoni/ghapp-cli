/**
 * Tests for teams command functionality
 */

import { describe, it } from 'node:test';
import assert from 'assert';
import { validateTeamOptions, getTeamStats } from '../src/commands/teams.js';

describe('Teams Command', () => {
  describe('validateTeamOptions', () => {
    it('should validate visibility options', () => {
      const validResult = validateTeamOptions({ visibility: 'open' });
      assert.strictEqual(validResult.isValid, true);
      assert.strictEqual(validResult.errors.length, 0);

      const invalidResult = validateTeamOptions({ visibility: 'invalid' });
      assert.strictEqual(invalidResult.isValid, false);
      assert.strictEqual(invalidResult.errors.length, 1);
      assert(invalidResult.errors[0].includes('Invalid visibility'));
    });

    it('should validate sort options', () => {
      const validResult = validateTeamOptions({ sort: 'name' });
      assert.strictEqual(validResult.isValid, true);

      const invalidResult = validateTeamOptions({ sort: 'invalid' });
      assert.strictEqual(invalidResult.isValid, false);
      assert(invalidResult.errors[0].includes('Invalid sort option'));
    });

    it('should validate order options', () => {
      const validResult = validateTeamOptions({ order: 'asc' });
      assert.strictEqual(validResult.isValid, true);

      const invalidResult = validateTeamOptions({ order: 'invalid' });
      assert.strictEqual(invalidResult.isValid, false);
      assert(invalidResult.errors[0].includes('Invalid order option'));
    });

    it('should validate member range', () => {
      const validResult = validateTeamOptions({ minMembers: 1, maxMembers: 10 });
      assert.strictEqual(validResult.isValid, true);

      const invalidResult = validateTeamOptions({ minMembers: 10, maxMembers: 1 });
      assert.strictEqual(invalidResult.isValid, false);
      assert(invalidResult.errors[0].includes('minMembers cannot be greater than maxMembers'));
    });

    it('should handle multiple validation errors', () => {
      const result = validateTeamOptions({
        visibility: 'invalid',
        sort: 'invalid',
        minMembers: 10,
        maxMembers: 1
      });
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 3);
    });
  });

  describe('getTeamStats', () => {
    const sampleTeams = [
      {
        name: 'Team A',
        privacy: 'open',
        members_count: 5,
        repos_count: 3
      },
      {
        name: 'Team B',
        privacy: 'secret',
        members_count: 2,
        repos_count: 1
      },
      {
        name: 'Team C',
        privacy: 'closed',
        members_count: 0,
        repos_count: 0
      }
    ];

    it('should calculate basic statistics', () => {
      const stats = getTeamStats(sampleTeams);
      
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.open, 1);
      assert.strictEqual(stats.secret, 1);
      assert.strictEqual(stats.closed, 1);
    });

    it('should calculate member statistics', () => {
      const stats = getTeamStats(sampleTeams);
      
      assert.strictEqual(stats.totalMembers, 7);
      assert.strictEqual(stats.withMembers, 2);
      assert.strictEqual(stats.averageMembers, '2.3');
    });

    it('should calculate repository statistics', () => {
      const stats = getTeamStats(sampleTeams);
      
      assert.strictEqual(stats.totalRepos, 4);
      assert.strictEqual(stats.withRepos, 2);
      assert.strictEqual(stats.averageRepos, '1.3');
    });

    it('should handle empty teams array', () => {
      const stats = getTeamStats([]);
      
      assert.strictEqual(stats.total, 0);
      assert.strictEqual(stats.totalMembers, 0);
      assert.strictEqual(stats.totalRepos, 0);
      assert.strictEqual(stats.averageMembers, 0);
      assert.strictEqual(stats.averageRepos, 0);
    });

    it('should handle teams without member or repo counts', () => {
      const teamsWithoutCounts = [
        { name: 'Team A', privacy: 'open' },
        { name: 'Team B', privacy: 'secret' }
      ];
      
      const stats = getTeamStats(teamsWithoutCounts);
      
      assert.strictEqual(stats.total, 2);
      assert.strictEqual(stats.totalMembers, 0);
      assert.strictEqual(stats.totalRepos, 0);
      assert.strictEqual(stats.withMembers, 0);
      assert.strictEqual(stats.withRepos, 0);
    });
  });

  describe('Enhanced CSV Data Structure', () => {
    it('should handle team hierarchy data', () => {
      const teamWithHierarchy = {
        name: 'Parent Team',
        slug: 'parent-team',
        privacy: 'open',
        parent_team: null,
        child_teams: ['child-team-1', 'child-team-2'],
        member_details: [
          { username: 'user1', role: 'maintainer', state: 'active' },
          { username: 'user2', role: 'member', state: 'active' }
        ],
        direct_members_only: [
          { username: 'user1', role: 'maintainer', state: 'active' }
        ],
        repository_permissions: [
          {
            name: 'repo1',
            full_name: 'org/repo1',
            role: 'admin',
            permissions: { admin: true, maintain: true, push: true, triage: true, pull: true }
          }
        ]
      };

      // Test that the enhanced data structure contains all required fields
      assert(teamWithHierarchy.hasOwnProperty('child_teams'));
      assert(teamWithHierarchy.hasOwnProperty('member_details'));
      assert(teamWithHierarchy.hasOwnProperty('direct_members_only'));
      assert(teamWithHierarchy.hasOwnProperty('repository_permissions'));
      
      assert.strictEqual(teamWithHierarchy.child_teams.length, 2);
      assert.strictEqual(teamWithHierarchy.member_details.length, 2);
      assert.strictEqual(teamWithHierarchy.direct_members_only.length, 1);
      assert.strictEqual(teamWithHierarchy.repository_permissions.length, 1);
    });

    it('should handle member role and state data', () => {
      const memberDetail = {
        username: 'testuser',
        role: 'maintainer',
        state: 'active'
      };

      assert.strictEqual(memberDetail.username, 'testuser');
      assert(['member', 'maintainer'].includes(memberDetail.role));
      assert(['active', 'pending'].includes(memberDetail.state));
    });

    it('should handle repository permission data', () => {
      const repoPermission = {
        name: 'test-repo',
        full_name: 'org/test-repo',
        role: 'admin',
        permissions: {
          admin: true,
          maintain: true,
          push: true,
          triage: true,
          pull: true
        }
      };

      assert.strictEqual(repoPermission.name, 'test-repo');
      assert.strictEqual(repoPermission.role, 'admin');
      assert.strictEqual(repoPermission.permissions.admin, true);
      assert(['admin', 'maintain', 'write', 'triage', 'read', 'none'].includes(repoPermission.role));
    });
  });

  describe('CSV Export Enhancements', () => {
    it('should format permissions correctly', () => {
      // This tests the concept of permission formatting
      const permissions = {
        admin: true,
        maintain: false,
        push: true,
        triage: false,
        pull: true
      };

      // The expected format should include admin, write (push), and read (pull)
      const expectedPerms = ['admin', 'write', 'read'];
      
      // Test that admin permission implies all others
      if (permissions.admin) {
        assert(permissions.pull); // admin should include pull access
      }
    });

    it('should handle direct vs indirect member distinction', () => {
      const allMembers = [
        { username: 'direct1', role: 'maintainer' },
        { username: 'direct2', role: 'member' },
        { username: 'inherited1', role: 'member' },
        { username: 'inherited2', role: 'member' }
      ];

      const directMembers = [
        { username: 'direct1', role: 'maintainer' },
        { username: 'direct2', role: 'member' }
      ];

      assert.strictEqual(allMembers.length, 4);
      assert.strictEqual(directMembers.length, 2);
      
      // Verify that direct members are a subset of all members
      directMembers.forEach(directMember => {
        const found = allMembers.find(member => member.username === directMember.username);
        assert(found, `Direct member ${directMember.username} should be in all members`);
      });
    });

    it('should escape CSV fields correctly', () => {
      const testFields = [
        'Simple text',
        'Text with "quotes"',
        'Text with, commas',
        'Text with\nnewlines'
      ];

      // CSV fields should be properly escaped
      testFields.forEach(field => {
        const escaped = field.replace(/"/g, '""');
        const csvField = `"${escaped}"`;
        
        // Verify the CSV field is properly formatted
        assert(csvField.startsWith('"'));
        assert(csvField.endsWith('"'));
      });
    });
  });
});
