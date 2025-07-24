import React, { useState } from 'react';
import SupportModal from './SupportModal';

const HelpButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-3xl z-50"
        onClick={() => setOpen(true)}
        aria-label="Help"
      >
        ?
      </button>
      {open && <SupportModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default HelpButton; 