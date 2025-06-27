import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { Conversation } from '../types';

interface SaveChatButtonProps {
  conversation: Conversation;
}

export const SaveChatButton: React.FC<SaveChatButtonProps> = ({ conversation }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSave = () => {
    setShowModal(true);
  };

  const handleConfirmSave = () => {
    // Simulate saving
    setIsSaved(true);
    setShowModal(false);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <>
      <button
        onClick={handleSave}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isSaved
            ? 'bg-green-100 text-green-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Save Conversation"
      >
        {isSaved ? (
          <Check className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
      </button>

      {/* Save Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Save Conversation
              </h3>
              <p className="text-gray-600 mb-6">
                This feature is coming soon! You'll be able to save and export your conversations.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};