
import React from 'react';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  isOpen: boolean;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScaleUp">
        <style>{`
          @keyframes modalFadeInScaleUp {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-modalFadeInScaleUp {
            animation: modalFadeInScaleUp 0.3s forwards;
          }
        `}</style>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none transition-colors duration-150"
                aria-label="Close modal"
            >
                &times;
            </button>
        </div>
        <div className="modal-body max-h-[70vh] overflow-y-auto pr-2 text-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
