import type { SummarizeRequest, SummarizeResponse } from '../types';

const BASE_URL = 'http://localhost:8080/api';

export async function summarizeSession(
  request: SummarizeRequest,
): Promise<SummarizeResponse> {
  const response = await fetch(`${BASE_URL}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Summarize request failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<SummarizeResponse>;
}
