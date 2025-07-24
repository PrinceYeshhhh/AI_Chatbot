import React, { useState } from 'react';
// import { submitSupportTicket } from '../services/supportService'; // Implement as needed

const SupportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  // const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setLoading(true);
    // await submitSupportTicket(form);
    setSubmitted(true);
    // setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} aria-label="Close" className="absolute top-2 right-2 text-2xl">×</button>
        <h2 className="text-xl font-bold mb-4">Support & Help</h2>
        <div className="mb-4">
          <strong>Knowledge Base:</strong>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li><a href="/docs/v1/upload-files" target="_blank" rel="noopener noreferrer" className="underline">How to Upload Files</a></li>
            <li><a href="/docs/v1/smart-memory" target="_blank" rel="noopener noreferrer" className="underline">Smart Memory</a></li>
            <li><a href="/docs/v1/agent-chaining" target="_blank" rel="noopener noreferrer" className="underline">Agent Chaining</a></li>
          </ul>
        </div>
        <div className="mb-4">
          <strong>Live Chat:</strong> <span className="text-gray-500">(Coming soon)</span>
        </div>
        <form onSubmit={handleSubmit} className="mb-2">
          <div className="mb-2">
            <input
              required
              className="w-full border rounded px-2 py-1"
              placeholder="Subject"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <div className="mb-2">
            <textarea
              required
              className="w-full border rounded px-2 py-1"
              placeholder="Describe your issue"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Submit</button>
        </form>
        {submitted && <div className="text-green-700 mt-2">Thank you! Our team will get back to you soon.</div>}
      </div>
    </div>
  );
};

export default SupportModal; 