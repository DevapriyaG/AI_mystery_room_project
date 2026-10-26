export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch {
    throw new ApiError("Couldn't reach the server. Check your connection and try again.", 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status);
  }
  return data;
}

export function createMystery(scenario) {
  return request('/mysteries', { method: 'POST', body: JSON.stringify({ scenario }) });
}

export function getMystery(id) {
  return request(`/mysteries/${encodeURIComponent(id)}`);
}

export function revealHint(id) {
  return request(`/mysteries/${encodeURIComponent(id)}/hint`, { method: 'POST' });
}

export function accuse(id, suspectId) {
  return request(`/mysteries/${encodeURIComponent(id)}/accuse`, {
    method: 'POST',
    body: JSON.stringify({ suspectId }),
  });
}
