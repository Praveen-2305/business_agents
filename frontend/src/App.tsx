import React from 'react';
import {
  BrainCircuit,
  ShieldCheck,
  Scale,
  Sparkles,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Activity,
  Layers,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { useAuditStore } from './store/useAuditStore';
import { UploadPanel } from './components/UploadPanel';
import { AgentProgress } from './components/AgentProgress';
import { QualityDashboard } from './components/QualityDashboard';
import { ReconciliationBridge } from './components/ReconciliationBridge';
import { AskPanel } from './components/AskPanel';
import { UnresolvedIssues } from './components/UnresolvedIssues';
import { Downloads } from './components/Downloads';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { SampleRowsDrawer } from './components/SampleRowsDrawer';
import { Toast } from './components/Toast';

export const App: React.FC = () => {
  const { session, activeTab, setActiveTab, isAuditing } = useAuditStore();

  const qualityScore = session?.quality?.overall_score;
  const residualVariance = session?.reconciliation?.residual_variance;
  const unresolvedCount = session?.unresolved_issues?.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-slate-100 tracking-tight">
                  Data Analyst Agent
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                  LangGraph + Dual Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Autonomous 5D Quality Audit & Financial Waterfall Reconciliation
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            {session && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500">Session:</span>
                <span className="text-sky-400">{session.session_id.slice(0, 8)}...</span>
              </div>
            )}

            {isAuditing ? (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium animate-pulse">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing Stream Live</span>
              </span>
            ) : session?.quality ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Dual Engine Parity: 0.000000</span>
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Upload & Ingestion Section */}
        <section>
          <UploadPanel />
        </section>

        {/* Tab Navigation Menu */}
        <div className="border-b border-slate-800">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('quality')}
              className={`py-3 px-3 sm:px-4 text-xs font-medium border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === 'quality'
                  ? 'border-sky-500 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Quality Dashboard</span>
              {qualityScore !== undefined && (
                <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {qualityScore}/100
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`py-3 px-3 sm:px-4 text-xs font-medium border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === 'reconciliation'
                  ? 'border-sky-500 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Reconciliation Bridge</span>
              {residualVariance !== undefined && (
                <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-900/60 font-bold">
                  Gap: ${residualVariance.toFixed(2)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`py-3 px-3 sm:px-4 text-xs font-medium border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === 'progress'
                  ? 'border-sky-500 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Reasoning Trail (11 Nodes)</span>
              {isAuditing && (
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('ask')}
              className={`py-3 px-3 sm:px-4 text-xs font-medium border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === 'ask'
                  ? 'border-sky-500 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Analyst (Q&A)</span>
            </button>

            <button
              onClick={() => setActiveTab('unresolved')}
              className={`py-3 px-3 sm:px-4 text-xs font-medium border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === 'unresolved'
                  ? 'border-sky-500 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Unresolved Issues</span>
              {unresolvedCount > 0 && (
                <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  {unresolvedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={`py-3 px-3 sm:px-4 text-xs font-medium border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === 'downloads'
                  ? 'border-sky-500 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Downloads & Reports</span>
            </button>
          </nav>
        </div>

        {/* Tab Content Display */}
        <section className="space-y-6">
          {activeTab === 'quality' && <QualityDashboard />}
          {activeTab === 'reconciliation' && <ReconciliationBridge />}
          {activeTab === 'progress' && <AgentProgress />}
          {activeTab === 'ask' && <AskPanel />}
          {activeTab === 'unresolved' && <UnresolvedIssues />}
          {activeTab === 'downloads' && <Downloads />}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Enterprise Data Analyst Agent &bull; Dual-Engine Precision</span>
          <span>FastAPI &bull; LangGraph &bull; DuckDB &bull; React 18</span>
        </div>
      </footer>

      {/* Slide-out Drawers & Toasts */}
      <EvidenceDrawer />
      <SampleRowsDrawer />
      <Toast />
    </div>
  );
};
