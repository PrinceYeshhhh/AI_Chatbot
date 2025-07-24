import React from 'react';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import AdminConfigPanel from '../components/AdminConfigPanel';
import VideoAnalyticsPanel from '../components/VideoAnalyticsPanel';

const AdminPage: React.FC = () => {
  return (
    <div>
      <AnalyticsDashboard />
      <AdminConfigPanel />
      <VideoAnalyticsPanel userId="demo-user" />
      {/* Add more admin controls here in the future */}
    </div>
  );
};

export default AdminPage; 