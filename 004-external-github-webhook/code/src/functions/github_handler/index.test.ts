import { betaSDK, publicSDK } from '@devrev/typescript-sdk';
import axios from 'axios';
import * as index from './index';
import { WorkStages } from './index';

describe('GitHub PR Handler', () => {
  describe('isStageOpen', () => {
    it('should return true for open stages', () => {
      expect(index.isStageOpen(WorkStages.TRIAGE)).toBe(true);
      expect(index.isStageOpen(WorkStages.PRIORITIZED)).toBe(true);
      expect(index.isStageOpen(WorkStages.BACKLOG)).toBe(true);
    });

    it('should return false for non-open stages', () => {
      expect(index.isStageOpen(WorkStages.IN_DEVELOPMENT)).toBe(false);
      expect(index.isStageOpen(WorkStages.COMPLETED)).toBe(false);
    });
  });

  describe('getWorkItemID', () => {
    it('should extract work item IDs from PR text', () => {
      const prText = 'This PR fixes ISS-123 and relates to TKT-456. Also addresses ISSUE:789';
      const result = index.getWorkItemID(prText);
      expect(result).toEqual(new Set(['ISS-123', 'TKT-456', 'ISS-789']));
    });

    it('should handle mixed case and return uppercase IDs', () => {
      const prText = 'Working on iss-123 and TkT-456';
      const result = index.getWorkItemID(prText);
      expect(result).toEqual(new Set(['ISS-123', 'TKT-456']));
    });

    it('should return an empty set if no IDs are found', () => {
      const prText = 'This PR does not reference any specific issues';
      const result = index.getWorkItemID(prText);
      expect(result).toEqual(new Set());
    });
  });

  describe('getExistingWorks', () => {
    it('should fetch works for given IDs', async () => {
      const mockSDK = {
        worksGet: jest.fn().mockResolvedValue({
          data: {
            work: {
              id: 'WORK-1',
              stage: { name: WorkStages.TRIAGE },
              type: publicSDK.WorkType.Issue,
            },
          },
        }),
      } as unknown as betaSDK.Api<unknown>;

      const result = await index.getExistingWorks(['WORK-1'], mockSDK);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'WORK-1',
        stage: { name: WorkStages.TRIAGE },
        type: publicSDK.WorkType.Issue,
      });
      expect(mockSDK.worksGet).toHaveBeenCalledWith({ id: 'WORK-1' });
    });

    it('should handle errors when fetching works', async () => {
      const mockSDK = {
        worksGet: jest.fn().mockRejectedValue(new Error('API Error')),
      } as unknown as betaSDK.Api<unknown>;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await index.getExistingWorks(['WORK-1'], mockSDK);
      expect(result).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith('Error while fetching work with id WORK-1 : API Error');

      consoleSpy.mockRestore();
    });
  });

  describe('handlePREvent', () => {
    it('should update work items when PR is opened', async () => {
      const mockSDK = {
        worksGet: jest.fn().mockResolvedValue({
          data: {
            work: {
              id: 'WORK-1',
              owned_by: [{ id: 'USER-1' }],
              stage: { name: WorkStages.TRIAGE },
              type: publicSDK.WorkType.Issue,
            },
          },
        }),
        worksUpdate: jest.fn().mockResolvedValue({
          data: { work: { id: 'WORK-1', stage: { name: WorkStages.IN_DEVELOPMENT } } },
        }),
      } as unknown as betaSDK.Api<unknown>;

      jest.spyOn(axios, 'post').mockResolvedValue({
        data: { inputs: { update_issue_on_pr: true } },
      });

      const payload = {
        pull_request: {
          body: 'This PR addresses the issue ISS-123',
          html_url: 'https://github.com/org/repo/pull/1',
          title: 'Fix for ISS-123',
        },
        action: index.GithubPrEventTypes.OPENED,
      };

      await index.handlePREvent(payload, mockSDK, 'fake-token', 'fake-endpoint', 'snap-in-id');

      expect(mockSDK.worksGet).toHaveBeenCalledWith({ id: 'ISS-123' });
      expect(mockSDK.worksUpdate).toHaveBeenCalledWith({
        custom_fields: {
          tnt__github_pr_url: 'https://github.com/org/repo/pull/1',
        },
        custom_schema_spec: {
          tenant_fragment: true,
          validate_required_fields: false,
        },
        id: 'WORK-1',
        stage: { name: WorkStages.IN_DEVELOPMENT },
        stage_validation_options: ['allow_invalid_transition'],
      });
    });
  });
});

describe('getStageCategory', () => {
  it('should categorize open stages correctly', () => {
    expect(index.getStageCategory(WorkStages.TRIAGE)).toBe('open');
    expect(index.getStageCategory(WorkStages.PRIORITIZED)).toBe('open');
    expect(index.getStageCategory(WorkStages.BACKLOG)).toBe('open');
  });

  it('should categorize in_progress stages correctly', () => {
    expect(index.getStageCategory(WorkStages.IN_DEVELOPMENT)).toBe('in_progress');
    expect(index.getStageCategory(WorkStages.IN_REVIEW)).toBe('in_progress');
    expect(index.getStageCategory(WorkStages.IN_TESTING)).toBe('in_progress');
    expect(index.getStageCategory(WorkStages.IN_DEPLOYMENT)).toBe('in_progress');
  });

  it('should categorize completed stages correctly', () => {
    expect(index.getStageCategory(WorkStages.COMPLETED)).toBe('completed');
    expect(index.getStageCategory(WorkStages.WONT_FIX)).toBe('completed');
    expect(index.getStageCategory(WorkStages.DUPLICATE)).toBe('completed');
    expect(index.getStageCategory(WorkStages.RESOLVED)).toBe('completed');
  });
});

describe('isValidStageTransition', () => {
  describe('transitions from open stages', () => {
    it('should allow transitions to open stages', () => {
      expect(index.isValidStageTransition(WorkStages.TRIAGE, WorkStages.BACKLOG)).toBe(true);
      expect(index.isValidStageTransition(WorkStages.BACKLOG, WorkStages.PRIORITIZED)).toBe(true);
    });

    it('should allow transitions to in_progress stages', () => {
      expect(index.isValidStageTransition(WorkStages.TRIAGE, WorkStages.IN_DEVELOPMENT)).toBe(true);
      expect(index.isValidStageTransition(WorkStages.BACKLOG, WorkStages.IN_REVIEW)).toBe(true);
    });

    it('should not allow transitions to completed stages', () => {
      expect(index.isValidStageTransition(WorkStages.TRIAGE, WorkStages.COMPLETED)).toBe(false);
      expect(index.isValidStageTransition(WorkStages.BACKLOG, WorkStages.RESOLVED)).toBe(false);
    });
  });

  describe('transitions from in_progress stages', () => {
    it('should allow transitions to in_progress stages', () => {
      expect(index.isValidStageTransition(WorkStages.IN_DEVELOPMENT, WorkStages.IN_REVIEW)).toBe(true);
      expect(index.isValidStageTransition(WorkStages.IN_REVIEW, WorkStages.IN_TESTING)).toBe(true);
    });

    it('should allow transitions to completed stages', () => {
      expect(index.isValidStageTransition(WorkStages.IN_DEVELOPMENT, WorkStages.COMPLETED)).toBe(true);
      expect(index.isValidStageTransition(WorkStages.IN_REVIEW, WorkStages.RESOLVED)).toBe(true);
    });

    it('should not allow transitions to open stages', () => {
      expect(index.isValidStageTransition(WorkStages.IN_DEVELOPMENT, WorkStages.TRIAGE)).toBe(false);
      expect(index.isValidStageTransition(WorkStages.IN_REVIEW, WorkStages.BACKLOG)).toBe(false);
    });
  });

  describe('transitions from completed stages', () => {
    it('should not allow any transitions', () => {
      expect(index.isValidStageTransition(WorkStages.COMPLETED, WorkStages.IN_DEVELOPMENT)).toBe(false);
      expect(index.isValidStageTransition(WorkStages.RESOLVED, WorkStages.TRIAGE)).toBe(false);
      expect(index.isValidStageTransition(WorkStages.COMPLETED, WorkStages.COMPLETED)).toBe(false);
    });
  });
});

describe('shouldUpdateStage', () => {
  const mockWork = {
    id: 'WORK-1',
    owned_by: [{ id: 'USER-1' }],
    stage: { name: WorkStages.TRIAGE },
    type: publicSDK.WorkType.Issue,
  };

  beforeEach(() => {
    jest.spyOn(axios, 'post').mockReset();
  });

  it('should return true for valid transition with user preference enabled', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: { inputs: { update_issue_on_pr: true } },
    });

    const result = await index.shouldUpdateStage(
      mockWork,
      'snap-in-id',
      'fake-endpoint',
      'fake-token',
      WorkStages.IN_DEVELOPMENT
    );

    expect(result).toBe(true);
  });

  it('should return false for valid transition with user preference disabled', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: { inputs: { update_issue_on_pr: false } },
    });

    const result = await index.shouldUpdateStage(
      mockWork,
      'snap-in-id',
      'fake-endpoint',
      'fake-token',
      WorkStages.IN_DEVELOPMENT
    );

    expect(result).toBe(false);
  });

  it('should return false for invalid stage transition', async () => {
    const result = await index.shouldUpdateStage(
      mockWork,
      'snap-in-id',
      'fake-endpoint',
      'fake-token',
      WorkStages.COMPLETED
    );

    expect(result).toBe(false);
    // Verify that user preferences weren't even checked
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should return false when work has no owners', async () => {
    const workWithNoOwners = {
      ...mockWork,
      owned_by: [],
    };

    const result = await index.shouldUpdateStage(
      workWithNoOwners,
      'snap-in-id',
      'fake-endpoint',
      'fake-token',
      WorkStages.IN_DEVELOPMENT
    );

    expect(result).toBe(false);
    // Verify that user preferences weren't checked
    expect(axios.post).not.toHaveBeenCalled();
  });
});