import React from 'react';
import { UploadPanel } from '../components/UploadPanel';
import { AgentProgress } from '../components/AgentProgress';
import { QualityDashboard } from '../components/QualityDashboard';
import { ReconciliationBridge } from '../components/ReconciliationBridge';
import { AskPanel } from '../components/AskPanel';
import { UnresolvedIssues } from '../components/UnresolvedIssues';
import { Downloads } from '../components/Downloads';
import { useAuditStore } from '../store/useAuditStore';

export const DashboardPage: React.FC = () => {
  const { activeTab } = useAuditStore();

  return (
    <div className="space-y-6">
      <UploadPanel />
      <div className="pt-4">
        {activeTab === 'quality' && <QualityDashboard />}
        {activeTab === 'reconciliation' && <ReconciliationBridge />}
        {activeTab === 'progress' && <AgentProgress />}
        {activeTab === 'ask' && <AskPanel />}
        {activeTab === 'unresolved' && <UnresolvedIssues />}
        {activeTab === 'downloads' && <Downloads />}
      </div>
    </div>
  );
};
