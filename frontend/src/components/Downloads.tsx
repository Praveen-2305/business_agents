import React from 'react';
import {
  Download,
  FileCode,
  FileText,
  FileJson,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';
import { getDownloadUrl } from '../api/client';

export const Downloads: React.FC = () => {
  const { session, setToast } = useAuditStore();

  if (!session) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center border-slate-800 text-slate-500 text-xs">
        Run an audit to generate exportable audit reports, reproduction scripts, and calculation logs.
      </div>
    );
  }

  const sid = session.session_id;

  const handleDownload = (type: 'report' | 'reproduce' | 'calculations', filename: string) => {
    const url = getDownloadUrl(sid, type);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ text: `Downloading ${filename}...`, type: 'info' });
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-6 border-slate-800">
        <div className="pb-4 border-b border-slate-800 mb-6">
          <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-sky-400" />
            <span>Audit Artifacts & Governance Deliverables</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Download certified audit packages for regulatory review, external compliance, and algorithmic reproduction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. HTML Report */}
          <div className="glass-card rounded-xl p-5 border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
            <div>
              <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 w-fit mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-sm text-slate-200">
                HTML Executive Audit Report
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Self-contained, styled HTML report containing the executive narrative, 5-dimension quality gauges, financial waterfall bridge table, and parity proofs.
              </p>
            </div>

            <button
              id="download-html-report-btn"
              onClick={() => handleDownload('report', `audit_report_${sid.slice(0, 8)}.html`)}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Download Report (.html)</span>
            </button>
          </div>

          {/* 2. Reproduce Script */}
          <div className="glass-card rounded-xl p-5 border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
            <div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mb-3">
                <FileCode className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-sm text-slate-200">
                Audit Reproduction Script
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Autonomous Python reproduction script (`reproduce_audit.py`). Allows auditors to independently verify all numbers and metrics offline.
              </p>
            </div>

            <button
              id="download-reproduce-script-btn"
              onClick={() => handleDownload('reproduce', `reproduce_audit_${sid.slice(0, 8)}.py`)}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Script (.py)</span>
            </button>
          </div>

          {/* 3. Calculation Log */}
          <div className="glass-card rounded-xl p-5 border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
            <div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit mb-3">
                <FileJson className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-sm text-slate-200">
                Calculation & Parity Log
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Machine-readable JSON log (`calculation_log.json`) recording every calculation ID, SQL query, Pandas code, row counts, and zero-variance verification.
              </p>
            </div>

            <button
              id="download-calc-log-btn"
              onClick={() => handleDownload('calculations', `calculation_log_${sid.slice(0, 8)}.json`)}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Log (.json)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
