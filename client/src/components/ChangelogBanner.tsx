import React, { useEffect, useState } from 'react';

function parseLatestChangelogEntry(text: string) {
  // Simple parser: assumes changelog entries start with '## [version] - date' and are separated by blank lines
  const entries = text.split(/^## /gm).filter(Boolean);
  if (entries.length === 0) return null;
  const [header, ...rest] = entries[0].split('\n');
  const summary = rest.find(line => line.trim() !== '') || '';
  return { header: header.trim(), summary: summary.trim() };
}

const ChangelogBanner: React.FC = () => {
  const [latest, setLatest] = useState<{ header: string; summary: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/docs/CHANGELOG.md')
      .then(res => res.text())
      .then(text => setLatest(parseLatestChangelogEntry(text)));
  }, []);

  if (!latest || dismissed) return null;
  return (
    <div className="bg-blue-100 border-b border-blue-300 text-blue-900 px-4 py-2 flex items-center justify-between" role="status">
      <div>
        <strong>What’s New:</strong> <span className="font-semibold">{latest.header}</span> — {latest.summary}
        <a href="/docs/CHANGELOG.md" className="ml-2 underline" target="_blank" rel="noopener noreferrer">Read more</a>
      </div>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="ml-4 text-lg">×</button>
    </div>
  );
};

export default ChangelogBanner; 