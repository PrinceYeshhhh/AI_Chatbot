import React from 'react';
import ComplianceDashboard from './ComplianceDashboard';

const AdminIndex: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <ComplianceDashboard />
    </div>
  );
};

export default AdminIndex; 