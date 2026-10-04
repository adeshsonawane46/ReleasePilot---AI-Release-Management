const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getReleases: () => request('/releases'),
  getRelease: (id) => request(`/releases/${id}`),
  createRelease: (data) => request('/releases', { method: 'POST', body: JSON.stringify(data) }),
  updateRelease: (id, data) => request(`/releases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRelease: (id) => request(`/releases/${id}`, { method: 'DELETE' }),

  getBriefs: () => request('/briefs'),
  getBrief: (id) => request(`/briefs/${id}`),
  generateBrief: (data) => request('/briefs/generate', { method: 'POST', body: JSON.stringify(data) }),
  updateBrief: (id, data) => request(`/briefs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  analyzeRelease: (data) => request('/analysis', { method: 'POST', body: JSON.stringify(data) }),
  analyzeReleaseStream: async (data, onProgress) => {
    const res = await fetch(`${BASE}/analysis?stream=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }

    if (!res.body) {
      const json = await res.json();
      if (onProgress) onProgress({ status: 'completed', result: json });
      return json;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lastResult = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const event = JSON.parse(trimmed.slice(6).trim());
            if (event.result) lastResult = event.result;
            if (onProgress) onProgress(event);
          } catch (e) {
            console.error('Failed to parse SSE line:', e);
          }
        }
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      try {
        const event = JSON.parse(buffer.trim().slice(6).trim());
        if (event.result) lastResult = event.result;
        if (onProgress) onProgress(event);
      } catch {}
    }

    return lastResult;
  },
  getStatements: (version) => request(`/analysis/statements/${version}`),
  updateStatement: (id, data) => request(`/analysis/statements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/audit${qs ? `?${qs}` : ''}`);
  },
  createAuditLog: (data) => request('/audit', { method: 'POST', body: JSON.stringify(data) }),

  compareReleases: (a, b) => request(`/compare/${a}/${b}`),
};
