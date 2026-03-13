import { describe, it, expect, vi, beforeEach } from 'vitest';
import { summarizeSession } from '../../api/summarizeApi';
import type { SummarizeRequest } from '../../types';

const mockRequest: SummarizeRequest = {
  ticketId: 'PROJ-1234',
  items: [{ type: 'TEXT', content: 'Worked on auth flow' }],
};

describe('summarizeApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed JSON on success', async () => {
    const mockSummary = { summary: 'Today I worked on the auth flow.' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSummary),
    } as unknown as Response);

    const result = await summarizeSession(mockRequest);
    expect(result).toEqual(mockSummary);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/summarize',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      }),
    );
  });

  it('throws an error on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    } as unknown as Response);

    await expect(summarizeSession(mockRequest)).rejects.toThrow(
      'Summarize request failed (500): Internal Server Error',
    );
  });

  it('throws when fetch rejects', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    await expect(summarizeSession(mockRequest)).rejects.toThrow('Network error');
  });
});
