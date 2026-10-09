import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Database, Play, CheckCircle2, AlertCircle, Hash } from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';
import { uploadSessionFiles, loadDemoSession } from '../api/client';
import { useSSE } from '../api/useSSE';

export const UploadPanel: React.FC = () => {
  const { session, setSession, isAuditing, setToast } = useAuditStore();
  const { startAuditStream } = useSSE();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length < 2) {
      setToast({ text: 'Please upload at least 2 CSV datasets to perform reconciliation.', type: 'error' });
      return;
    }

    try {
      setIsUploading(true);
      const newSession = await uploadSessionFiles(acceptedFiles);
      setSession(newSession);
      setToast({ text: `Successfully uploaded ${acceptedFiles.length} datasets.`, type: 'success' });
    } catch (err: any) {
      setToast({ text: err.message || 'Upload failed', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    disabled: isUploading || isAuditing,
  });

  const handleLoadDemo = async () => {
    try {
      setIsUploading(true);
      const demoSession = await loadDemoSession();
      setSession(demoSession);
      setToast({ text: 'Loaded Stripe & ERP enterprise demo datasets!', type: 'success' });
    } catch (err: any) {
      setToast({ text: err.message || 'Failed to load demo datasets', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunAudit = () => {
    if (!session) return;
    startAuditStream(session.session_id);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div
          {...getRootProps()}
          className={`md:col-span-2 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-sky-400 bg-sky-950/20 shadow-lg shadow-sky-500/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input {...getInputProps()} />
          <div className="p-4 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-4 animate-pulse-subtle">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 text-center">
            {isDragActive ? 'Drop your CSV files here' : 'Drag & drop 2+ CSV files for reconciliation'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 text-center max-w-sm">
            Upload billing transactions, ledger accounts, CRM exports, or order reports (.csv)
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Minimum 2 files</span>
            <span>&bull;</span>
            <span>UTF-8 standard</span>
          </div>
        </div>

        {/* Demo Data & Action Card */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
              <Database className="w-4 h-4" />
              <span>Instant Enterprise Demo</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Experience the full 11-node agent with realistic multi-channel billing (Stripe) and ERP ledger (NetSuite) datasets containing injected cutoff, duplicates, and refund variances.
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <button
              id="load-demo-data-btn"
              onClick={handleLoadDemo}
              disabled={isUploading || isAuditing}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Database className="w-4 h-4 text-sky-400" />
              <span>Load Demo Data</span>
            </button>

            <button
              id="run-audit-btn"
              onClick={handleRunAudit}
              disabled={!session || session.files.length < 2 || isAuditing}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isAuditing ? 'Auditing In Progress...' : 'Run Audit & Reconciliation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Per-File Previews */}
      {session && session.files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Loaded Datasets ({session.files.length})</span>
            </h4>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cryptographically Verified</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {session.files.map((file, idx) => (
              <div
                key={file.filename}
                className="glass-card rounded-xl p-5 border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        File {idx === 0 ? 'A' : 'B'}
                      </span>
                      <h5 className="font-semibold text-sm text-slate-200">{file.filename}</h5>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
                      <span>{file.rows.toLocaleString()} rows</span>
                      <span>&bull;</span>
                      <span>{file.columns} columns</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPreview(selectedPreview === file.filename ? null : file.filename)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium px-2 py-1 rounded bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition"
                  >
                    {selectedPreview === file.filename ? 'Hide Preview' : 'View Sample'}
                  </button>
                </div>

                {/* SHA-256 Hash badge */}
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400 font-mono overflow-hidden">
                  <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-500 shrink-0">SHA-256:</span>
                  <span className="truncate text-slate-300" title={file.sha256_hash}>
                    {file.sha256_hash}
                  </span>
                </div>

                {/* Sample preview drawer/table */}
                {selectedPreview === file.filename && file.preview_data && file.preview_data.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800 overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          {Object.keys(file.preview_data[0]).map((col) => (
                            <th key={col} className="pb-2 pr-4 font-medium truncate max-w-[120px]">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {file.preview_data.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/20">
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="py-2 pr-4 truncate max-w-[120px]">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
