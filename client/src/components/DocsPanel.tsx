import React, { useState } from "react";

const docsSections = [
  {
    key: "upload_files",
    title: "How to Upload Files",
    gif: "/docs/upload-files.gif", // Place GIF in public/docs/
    content: "To upload files, click the 'Upload' button in the sidebar. Supported formats: PDF, DOCX, TXT, and more.",
    faqs: [
      { q: "What file types are supported?", a: "PDF, DOCX, TXT, CSV, and more." },
      { q: "Is there a file size limit?", a: "Yes, 100MB per file." },
    ],
  },
  {
    key: "smart_memory",
    title: "Smart Memory",
    gif: "/docs/smart-memory.gif",
    content: "Smart Memory helps the AI remember important facts and context from your chats.",
    faqs: [
      { q: "How does Smart Memory work?", a: "It stores key facts and lets the AI reference them in future conversations." },
    ],
  },
  {
    key: "agent_chaining",
    title: "Agent Chaining",
    gif: "/docs/agent-chaining.gif",
    content: "Chain multiple agents to automate complex workflows.",
    faqs: [
      { q: "Can I create custom agent chains?", a: "Yes, use the Agent Manager to design custom chains." },
    ],
  },
  // Add more sections as needed
];

export default function DocsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeSection, setActiveSection] = useState(docsSections[0].key);
  if (!isOpen) return null;
  const section = docsSections.find(s => s.key === activeSection)!;
  return (
    <aside className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-50 overflow-y-auto transition-transform" role="dialog" aria-modal="true">
      <button onClick={onClose} aria-label="Close docs" className="absolute top-4 right-4 text-2xl">×</button>
      <nav className="flex flex-row gap-2 p-4 border-b">
        {docsSections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-3 py-1 rounded ${activeSection === s.key ? 'bg-blue-100 font-bold' : ''}`}
            aria-current={activeSection === s.key}
          >
            {s.title}
          </button>
        ))}
      </nav>
      <section className="p-6">
        <img src={section.gif} alt="" className="mb-4 rounded shadow" style={{ maxHeight: 180 }} />
        <div className="mb-4 text-base">{section.content}</div>
        <details className="mb-2" open>
          <summary className="font-semibold">FAQs</summary>
          <ul className="mt-2 space-y-2">
            {section.faqs.map((faq, i) => (
              <li key={i}>
                <strong>{faq.q}</strong>
                <div>{faq.a}</div>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </aside>
  );
} 