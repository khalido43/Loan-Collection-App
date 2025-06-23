
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Loan } from '../types';

interface EditRemarkModalProps {
  loan: Loan | null;
  onClose: () => void;
  isOpen: boolean;
  onUpdateRemark: (loanId: string, remark: string) => void;
}

const EditRemarkModal: React.FC<EditRemarkModalProps> = ({ loan, onClose, isOpen, onUpdateRemark }) => {
  const [editedRemark, setEditedRemark] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && loan) {
      setEditedRemark(loan.remark || '');
      setMessage('');
    }
  }, [isOpen, loan]);

  const handleSubmit = () => {
    if (loan) {
      onUpdateRemark(loan.id, editedRemark);
      setMessage('Remark updated successfully!');
      // onClose(); // Optionally close immediately, or let user close. Here, we close.
      setTimeout(() => { // Give a small delay for user to see message
        onClose();
      }, 1000);
    }
  };

  if (!isOpen || !loan) return null;

  return (
    <Modal title={`Edit Remark for Acc: ${loan.accountNumber}`} onClose={onClose} isOpen={isOpen}>
      <div className="space-y-4">
        <div>
          <label htmlFor="remarkText" className="block text-gray-700 font-medium mb-1">Remark</label>
          <textarea
            id="remarkText"
            rows={4}
            value={editedRemark}
            onChange={(e) => setEditedRemark(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder="Enter new remark..."
          ></textarea>
        </div>
        {message && <p className="text-green-600 text-sm font-medium">{message}</p>}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Save Remark
        </button>
      </div>
    </Modal>
  );
};

export default EditRemarkModal;
