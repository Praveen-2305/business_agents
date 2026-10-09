import { create } from 'zustand';
import type { SessionState, NodeStreamEvent, EvidenceChip, AnswerCard } from '../types';

interface AuditStore {
  session: SessionState | null;
  activeTab: 'progress' | 'quality' | 'reconciliation' | 'ask' | 'unresolved' | 'downloads';
  isAuditing: boolean;
  activeEvidence: EvidenceChip | null;
  activeSampleRows: { title: string; rows: Record<string, any>[] } | null;
  toast: { text: string; type: 'error' | 'success' | 'info' } | null;

  setSession: (session: SessionState | null) => void;
  updateTimelineEvent: (event: NodeStreamEvent) => void;
  setActiveTab: (tab: 'progress' | 'quality' | 'reconciliation' | 'ask' | 'unresolved' | 'downloads') => void;
  setIsAuditing: (isAuditing: boolean) => void;
  setActiveEvidence: (evidence: EvidenceChip | null) => void;
  setActiveSampleRows: (sample: { title: string; rows: Record<string, any>[] } | null) => void;
  setToast: (toast: { text: string; type: 'error' | 'success' | 'info' } | null) => void;
  addAnswer: (answer: AnswerCard) => void;
}

export const useAuditStore = create<AuditStore>((set) => ({
  session: null,
  activeTab: 'quality',
  isAuditing: false,
  activeEvidence: null,
  activeSampleRows: null,
  toast: null,

  setSession: (session) => set({ session }),

  updateTimelineEvent: (event) =>
    set((state) => {
      if (!state.session) return state;
      const currentTimeline = [...(state.session.node_timeline || [])];
      const existingIdx = currentTimeline.findIndex(
        (e) => e.node === event.node && e.status === event.status
      );

      if (existingIdx >= 0) {
        currentTimeline[existingIdx] = event;
      } else {
        currentTimeline.push(event);
      }

      return {
        session: {
          ...state.session,
          current_node: event.node,
          node_timeline: currentTimeline,
        },
      };
    }),

  setActiveTab: (activeTab) => set({ activeTab }),
  setIsAuditing: (isAuditing) => set({ isAuditing }),
  setActiveEvidence: (activeEvidence) => set({ activeEvidence }),
  setActiveSampleRows: (activeSampleRows) => set({ activeSampleRows }),
  setToast: (toast) => set({ toast }),

  addAnswer: (answer) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          chat_history: [...(state.session.chat_history || []), answer],
        },
      };
    }),
}));
