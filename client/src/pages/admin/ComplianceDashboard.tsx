import React, { useState } from 'react';

const ComplianceDashboard: React.FC = () => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const handleDownloadAuditLogs = async () => {
    const res = await fetch('/api/compliance/audit-logs');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    // In production, password should be sent securely/out-of-band
    setPassword('secure-password');
  };
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Compliance & Audit Artifacts</h2>
      <button onClick={handleDownloadAuditLogs} className="bg-blue-600 text-white px-4 py-2 rounded">Download Encrypted Audit Logs (CSV)</button>
      {downloadUrl && (
        <div className="mt-4">
          <a href={downloadUrl} download="audit-logs.csv.enc" className="underline text-blue-700">Click here to download</a>
          <div className="mt-2 text-sm text-gray-700">Password: <b>{password}</b></div>
        </div>
      )}
    </div>
  );
};

export default ComplianceDashboard; 