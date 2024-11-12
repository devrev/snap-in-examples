import { betaSDK, publicSDK } from '@devrev/typescript-sdk';
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
          data: { work: { id: 'WORK-1', type: publicSDK.WorkType.Issue } },
        }),
      } as unknown as betaSDK.Api<unknown>;

      const result = await index.getExistingWorks(['WORK-1'], mockSDK);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'WORK-1', type: publicSDK.WorkType.Issue });
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

  describe('handlePROpened', () => {
    it('should update work items when PR is opened', async () => {
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
        worksUpdate: jest.fn().mockResolvedValue({
          data: { work: { id: 'WORK-1', stage: { name: WorkStages.IN_DEVELOPMENT } } },
        }),
      } as unknown as betaSDK.Api<unknown>;

      const payload = {
        pull_request: {
          body: 'This PR addresses the issue ISS-123',
          title: 'Fix for ISS-123',
        },
      };

      await index.handlePROpened(payload, mockSDK);

      expect(mockSDK.worksGet).toHaveBeenCalledWith({ id: 'ISS-123' });
      expect(mockSDK.worksUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'WORK-1',
          stage: { name: WorkStages.IN_DEVELOPMENT },
        })
      );
    });
  });
});
