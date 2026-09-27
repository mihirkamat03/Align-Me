const BASE_URL = '/api';

export async function fetchProfile() {
  const res = await fetch(`${BASE_URL}/profile`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return await res.json();
}

export async function updateProfile(data) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return await res.json();
}

export async function fetchGoals() {
  const res = await fetch(`${BASE_URL}/profile/goals`);
  if (!res.ok) throw new Error('Failed to fetch goals');
  return await res.json();
}

export async function fetchRecommendations() {
  const res = await fetch(`${BASE_URL}/profile/recommendations`);
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return await res.json();
}

export async function fetchSessions() {
  const res = await fetch(`${BASE_URL}/sessions`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return await res.json();
}

export async function createSession(payload = {}) {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create session');
  return await res.json();
}

export async function fetchSessionDetail(sessionId) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch session detail');
  return await res.json();
}

export async function addSessionMetrics(sessionId, metrics) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/metrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics })
  });
  if (!res.ok) throw new Error('Failed to add metrics');
  return await res.json();
}

export async function addSessionEvent(sessionId, eventData) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });
  if (!res.ok) throw new Error('Failed to add event');
  return await res.json();
}

export async function endSession(sessionId, payload = {}) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to end session');
  return await res.json();
}

export async function fetchDashboardAnalytics() {
  const res = await fetch(`${BASE_URL}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return await res.json();
}

export async function fetchLongitudinalProfile() {
  const res = await fetch(`${BASE_URL}/analytics/profile`);
  if (!res.ok) throw new Error('Failed to fetch profile analytics');
  return await res.json();
}

export async function fetchAnalyticsTrends() {
  const res = await fetch(`${BASE_URL}/analytics/trends`);
  if (!res.ok) throw new Error('Failed to fetch trends');
  return await res.json();
}

export async function fetchSessionComparison() {
  const res = await fetch(`${BASE_URL}/analytics/compare`);
  if (!res.ok) throw new Error('Failed to fetch session comparison');
  return await res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete session');
  return await res.json();
}

export async function purgeData() {
  const res = await fetch(`${BASE_URL}/privacy/purge`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to purge data');
  return await res.json();
}

export async function seedDemoData() {
  const res = await fetch(`${BASE_URL}/demo/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo data');
  return await res.json();
}

export async function fetchPostureRules() {
  const res = await fetch(`${BASE_URL}/posture/rules`);
  if (!res.ok) throw new Error('Failed to fetch rules');
  return await res.json();
}

export async function fetchPersonalRecords() {
  const res = await fetch(`${BASE_URL}/posture/records`);
  if (!res.ok) throw new Error('Failed to fetch personal records');
  return await res.json();
}

export async function evaluateFrameTelemetry(telemetry) {
  const res = await fetch(`${BASE_URL}/posture/evaluate-frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(telemetry)
  });
  if (!res.ok) throw new Error('Failed to evaluate frame');
  return await res.json();
}

export async function uploadVideoSession(formData) {
  const res = await fetch(`${BASE_URL}/posture/analyze-video`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to analyze video');
  return await res.json();
}

