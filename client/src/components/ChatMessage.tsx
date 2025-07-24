import { useState } from 'react';

const getBadge = (score, flagged) => {
  if (flagged) {
    if (score <= 2) return { label: '❌ Hallucinated', color: 'bg-red-200 text-red-800' };
    return { label: '⚠ Suspect', color: 'bg-yellow-200 text-yellow-800' };
  }
  if (score >= 4) return { label: '✅ Excellent', color: 'bg-green-200 text-green-800' };
  if (score === 3) return { label: '⚠ Suspect', color: 'bg-yellow-200 text-yellow-800' };
  return { label: '❌ Hallucinated', color: 'bg-red-200 text-red-800' };
};

export default function ChatMessage({ message, devMode }) {
  const [showReason, setShowReason] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(!!message.userFeedback);
  const [submitting, setSubmitting] = useState(false);

  const evalResult = message.evaluation;
  const badge = evalResult ? getBadge(evalResult.score, evalResult.flagged) : null;

  const handleFeedback = async (feedback) => {
    setSubmitting(true);
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: message.id, feedback })
    });
    setFeedbackSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="chat-message">
      {/* ...existing message rendering... */}
      {evalResult && (
        <div className="flex items-center gap-2 mt-2">
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge.color}`}>{badge.label}</span>
          <button className="text-blue-600 underline text-xs" onClick={() => setShowReason(v => !v)}>
            {showReason ? 'Hide' : 'Why?'}
          </button>
        </div>
      )}
      {showReason && evalResult && (
        <div className="bg-gray-50 border-l-4 border-blue-400 p-2 mt-1 text-xs text-blue-900 rounded">
          {evalResult.reason} (Score: {evalResult.score}/5)
        </div>
      )}
      {/* Hallucination warning for sensitive categories (example: add logic for category) */}
      {evalResult && evalResult.flagged && (
        <div className="bg-red-100 border-l-4 border-red-500 p-2 mt-2 text-xs text-red-800 rounded">
          ⚠ Please verify this response before acting on it.
        </div>
      )}
      {/* Feedback UI */}
      {!feedbackSubmitted && (
        <div className="flex items-center gap-2 mt-2">
          <button
            className="text-green-600 hover:text-green-800 text-xl"
            disabled={submitting}
            onClick={() => handleFeedback('up')}
            title="Helpful"
          >
            👍
          </button>
          <button
            className="text-red-600 hover:text-red-800 text-xl"
            disabled={submitting}
            onClick={() => handleFeedback('down')}
            title="Not Helpful"
          >
            👎
          </button>
          {submitting && <span className="text-xs text-gray-500 ml-2">Submitting...</span>}
        </div>
      )}
      {feedbackSubmitted && (
        <div className="text-xs text-green-700 mt-2">Thank you for your feedback!</div>
      )}
      {/* ...rest of message... */}
      {message.functionCalls && message.functionCalls.length > 0 && (
        <div className="bg-gray-100 border-l-4 border-blue-400 p-2 mt-2 text-xs text-blue-900 rounded">
          <div className="font-bold mb-1">Function Calls:</div>
          <ul className="space-y-1">
            {message.functionCalls.map((call, idx) => (
              <li key={idx} className="border-b border-blue-200 pb-1 mb-1 last:border-b-0 last:pb-0 last:mb-0">
                <div><span className="font-semibold">{call.name}</span> <span className="text-gray-500">({call.timestamp})</span></div>
                <div>Duration: {call.duration}ms</div>
                <div>Output: <span className="font-mono">{call.outputPreview}</span></div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Per-message metadata (dev mode) */}
      {devMode && (
        <div className="bg-gray-50 border-l-4 border-gray-400 p-2 mt-2 text-xs text-gray-800 rounded">
          <div><b>Model:</b> {message.model}</div>
          <div><b>Latency:</b> {message.latency} ms</div>
          <div><b>Context Used:</b> {Array.isArray(message.contextUsed) ? message.contextUsed.length : 0} chunks</div>
        </div>
      )}
    </div>
  );
} 