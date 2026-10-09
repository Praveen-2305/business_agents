import type { SessionState, AnswerCard } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function uploadSessionFiles(files: File[]): Promise<SessionState> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

export async function loadDemoSession(): Promise<SessionState> {
  const response = await fetch(`${API_BASE_URL}/sessions/demo`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to load demo data`);
  }

  return response.json();
}

export async function fetchSessionState(sessionId: string): Promise<SessionState> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/state`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch session state`);
  }

  return response.json();
}

export async function askQuestion(sessionId: string, question: string): Promise<AnswerCard> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to query agent`);
  }

  return response.json();
}

export function getDownloadUrl(sessionId: string, type: 'report' | 'reproduce' | 'calculations'): string {
  return `${API_BASE_URL}/sessions/${sessionId}/downloads/${type}`;
}
