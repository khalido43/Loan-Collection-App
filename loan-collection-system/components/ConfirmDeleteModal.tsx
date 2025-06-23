
import React from 'react';

interface ConfirmDeleteModalProps {
  onClose: () => void;
  isOpen: boolean;
  onConfirm: () => void;
  itemType: string;
  itemName?: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ onClose, isOpen, onConfirm, itemType, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative text-center transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScaleUp">
            <style>{`
              @keyframes modalFadeInScaleUp {
                0% { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
              }
              .animate-modalFadeInScaleUp {
                animation: modalFadeInScaleUp 0.3s forwards;
              }
            `}</style>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Confirm Delete {itemType}</h3>
            <p className="text-gray-700 text-lg mb-6">
                Are you sure you want to delete {itemType.toLowerCase()} <strong className="font-semibold">{itemName || 'this item'}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
                <button
                    onClick={onConfirm}
                    className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                    Delete
                </button>
                <button
                    onClick={onClose}
                    className="bg-gray-300 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-400 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
  );
};

export default ConfirmDeleteModal;
