import { useCallback, useRef } from 'react';
import { useAuditStore } from '../store/useAuditStore';
import { API_BASE_URL, fetchSessionState } from './client';
import type { NodeStreamEvent } from '../types';

export function useSSE() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { session, setSession, updateTimelineEvent, setIsAuditing, setActiveTab, setToast } = useAuditStore();

  const startAuditStream = useCallback(
    (sessionId: string) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setIsAuditing(true);
      setActiveTab('progress');

      const url = `${API_BASE_URL}/sessions/${sessionId}/stream`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data: NodeStreamEvent = JSON.parse(event.data);
          updateTimelineEvent(data);

          if (data.node === 'workflow_complete' || (data.node === 'report' && data.status === 'completed')) {
            es.close();
            setIsAuditing(false);
            // Fetch finalized full state
            fetchSessionState(sessionId)
              .then((updatedSession) => {
                setSession(updatedSession);
                setToast({ text: 'Audit and reconciliation completed successfully!', type: 'success' });
              })
              .catch((err) => {
                setToast({ text: `Failed to load state: ${err.message}`, type: 'error' });
              });
          }
        } catch (e) {
          console.error('Failed to parse SSE payload:', e);
        }
      };

      es.onerror = (err) => {
        console.error('SSE connection error:', err);
        es.close();
        setIsAuditing(false);
        // Attempt fallback fetch in case stream completed
        fetchSessionState(sessionId)
          .then((updated) => setSession(updated))
          .catch(() => {});
      };
    },
    [setIsAuditing, setActiveTab, updateTimelineEvent, setSession, setToast]
  );

  return { startAuditStream };
}
