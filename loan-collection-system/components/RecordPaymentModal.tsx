
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Loan } from '../types';

interface RecordPaymentModalProps {
  loan: Loan | null;
  onClose: () => void;
  isOpen: boolean;
  onRecordPayment: (loanId: string, amount: number) => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ loan, onClose, isOpen, onRecordPayment }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount('');
      setMessage('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!loan) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid positive amount.');
      return;
    }
    if (amount > loan.outstandingBalance) {
      setMessage(`Payment amount cannot exceed outstanding balance ($${loan.outstandingBalance?.toFixed(2)}).`);
      return;
    }
    onRecordPayment(loan.id, amount);
    setMessage('Payment recorded successfully!');
    setPaymentAmount('');
    setTimeout(() => { // Give a small delay for user to see message
        onClose();
    }, 1000);
  };

  if (!isOpen || !loan) return null;

  return (
    <Modal title={`Record Payment for Acc: ${loan.accountNumber}`} onClose={onClose} isOpen={isOpen}>
      <div className="space-y-4">
        <p className="text-gray-700">Outstanding Balance: <strong className="text-red-600">${loan.outstandingBalance?.toFixed(2)}</strong></p>
        <div>
          <label htmlFor="paymentAmount" className="block text-gray-700 font-medium mb-1">Payment Amount</label>
          <input
            type="number"
            id="paymentAmount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder="e.g., 100.00"
            min="0.01"
            step="0.01"
          />
        </div>
        {message && <p className={`${message.includes('successfully') ? 'text-green-600' : 'text-red-600'} text-sm font-medium`}>{message}</p>}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Record Payment
        </button>
      </div>
    </Modal>
  );
};

export default RecordPaymentModal;
