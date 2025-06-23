
import React from 'react';
import Modal from './Modal';

interface ConfirmDistributionModalProps {
  unassignedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const ConfirmDistributionModal: React.FC<ConfirmDistributionModalProps> = ({ unassignedCount, onConfirm, onCancel, isOpen }) => {
  if (!isOpen) return null;

  return (
    <Modal title="Confirm Loan Distribution" onClose={onCancel} isOpen={isOpen}>
      <div className="space-y-6 text-center">
        <p className="text-gray-700 text-lg">
          There are already <strong className="font-semibold text-blue-600">{unassignedCount}</strong> unassigned loan(s) in the system (including newly uploaded ones if any).
        </p>
        <p className="text-gray-700 text-md">
            How would you like to proceed with the loan distribution?
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Distribute ALL unassigned loans
          </button>
          <button
            onClick={onCancel}
            className="w-full sm:w-auto bg-gray-300 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-400 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Upload new loans only (keep unassigned)
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDistributionModal;
