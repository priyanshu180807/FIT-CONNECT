/**
 * FitConnect — API Client Module
 * Centralized HTTP helpers for all backend calls with JWT auth.
 */

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

// ─── Token Helpers ───────────────────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem('fitconnect_token');
}

export function setToken(token) {
  localStorage.setItem('fitconnect_token', token);
}

export function clearToken() {
  localStorage.removeItem('fitconnect_token');
}

// ─── Generic Fetch Wrapper ──────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  // Some endpoints may return 204 No Content
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function apiRegister(data) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiLogin(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiGetMe() {
  return apiFetch('/api/auth/me');
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export async function apiGetProfile() {
  return apiFetch('/api/profile');
}

export async function apiUpdateProfile(data) {
  return apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Activities ──────────────────────────────────────────────────────────────
export async function apiLogActivity(data) {
  return apiFetch('/api/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiGetActivities(params = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', params.limit);
  if (params.offset) qs.set('offset', params.offset);
  if (params.activity_type && params.activity_type !== 'All') qs.set('activity_type', params.activity_type);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/activities${query}`);
}

export async function apiGetTodaySummary() {
  return apiFetch('/api/activities/today');
}

export async function apiGetWeeklySummary() {
  return apiFetch('/api/activities/weekly');
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export async function apiGetDashboard() {
  return apiFetch('/api/dashboard');
}

// ─── Recommendations ────────────────────────────────────────────────────────
export async function apiGetRecommendations() {
  return apiFetch('/api/recommendations');
}

// ─── Challenges ────────────────────────────────────────────────────────────
export async function apiGetChallenges() {
  return apiFetch('/api/challenges');
}

export async function apiJoinChallenge(id) {
  return apiFetch(`/api/challenges/${id}/join`, { method: 'POST' });
}

export async function apiLeaveChallenge(id) {
  return apiFetch(`/api/challenges/${id}/leave`, { method: 'POST' });
}

export async function apiCreateChallenge(data) {
  const params = new URLSearchParams(data);
  return apiFetch(`/api/admin/challenges?${params.toString()}`, { method: 'POST' });
}

// ─── Leaderboards ─────────────────────────────────────────────────────────
export async function apiGetStudentLeaderboard() {
  return apiFetch('/api/leaderboard/students');
}

export async function apiGetDepartmentLeaderboard() {
  return apiFetch('/api/leaderboard/departments');
}

export async function apiGetHostelLeaderboard() {
  return apiFetch('/api/leaderboard/hostels');
}

export async function apiGetChallengeLeaderboard(challengeId) {
  return apiFetch(`/api/leaderboard/challenges/${challengeId}`);
}

// ─── Rewards ──────────────────────────────────────────────────────────────
export async function apiGetRewardsOverview() {
  return apiFetch('/api/rewards/overview');
}

export async function apiGetBadges() {
  return apiFetch('/api/rewards/badges');
}

export async function apiGetPerks() {
  return apiFetch('/api/rewards/perks');
}

export async function apiRedeemPerk(perkId) {
  return apiFetch(`/api/rewards/perks/${perkId}/redeem`, { method: 'POST' });
}
