
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import EditRemarkModal from './EditRemarkModal';
import { Loan, CommunicationLogEntry, Agent } from '../types';

interface LoanDetailsModalProps {
  loan: Loan | null;
  onClose: () => void;
  isOpen: boolean;
  onUpdateLoanRemark: (loanId: string, remark: string) => void;
  onAddCommunicationLog: (loanId: string, logEntryData: Omit<CommunicationLogEntry, 'id' | 'date' | 'agentName'>) => void;
  loggedInUser: Agent; // To know who is adding the log
}

const DetailItem: React.FC<{ label: string; value?: string | number | null; isCurrency?: boolean; statusClass?: string }> = ({ label, value, isCurrency, statusClass }) => (
    <p><strong className="font-medium text-gray-600">{label}:</strong> 
        <span className={`ml-2 ${statusClass || 'text-gray-800'}`}>
            {value === null || value === undefined || value === '' ? 'N/A' : (isCurrency ? `$${Number(value).toFixed(2)}` : String(value))}
        </span>
    </p>
);


const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({ loan, onClose, isOpen, onUpdateLoanRemark, onAddCommunicationLog, loggedInUser }) => {
  const [isEditRemarkModalOpen, setIsEditRemarkModalOpen] = useState(false);
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(loan);

  const [commType, setCommType] = useState<CommunicationLogEntry['type']>('Call');
  const [commNotes, setCommNotes] = useState('');
  const [commMessage, setCommMessage] = useState('');


  useEffect(() => {
    setCurrentLoan(loan);
    if (isOpen) { // Reset comm form when modal opens or loan changes
        setCommType('Call');
        setCommNotes('');
        setCommMessage('');
    }
  }, [loan, isOpen]);


  if (!isOpen || !currentLoan) return null;

  const totalRepaid = currentLoan.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const principalRepaid = currentLoan.originalAmount - currentLoan.outstandingBalance;

  const handleAddCommSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commNotes.trim()) {
        setCommMessage('Notes cannot be empty.');
        return;
    }
    if(currentLoan && loggedInUser) {
        onAddCommunicationLog(currentLoan.id, {
            type: commType,
            notes: commNotes,
            agentId: loggedInUser.id,
        });
        setCommMessage('Communication log added successfully!');
        setCommNotes('');
        setCommType('Call');
        setTimeout(() => setCommMessage(''), 2000); // Clear message after 2s
    }
  };

  return (
    <>
      <Modal title={`Loan Details: ${currentLoan.accountNumber}`} onClose={onClose} isOpen={isOpen}>
        <div className="space-y-3 text-sm">
          {/* Loan Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <DetailItem label="Client" value={currentLoan.client} />
            <DetailItem label="Branch" value={currentLoan.branch} />
            <DetailItem label="Account Number" value={currentLoan.accountNumber} />
            <DetailItem label="Phone Number" value={currentLoan.phoneNumber} />
            <DetailItem label="Product" value={currentLoan.product} />
            <DetailItem label="Original Amount" value={currentLoan.originalAmount} isCurrency />
            <DetailItem label="Total Liability" value={currentLoan.totalLiab} isCurrency />
            <DetailItem label="Disbursed Date" value={currentLoan.startDate} />
            <DetailItem label="Expected Matured On" value={currentLoan.maturedOn} />
            <DetailItem label="Expected Repayment Date" value={currentLoan.expectedRepaymentDate} />
            <DetailItem label="Repayment Amount" value={currentLoan.repaymentAmount} isCurrency />
            <DetailItem label="Pass Due Date" value={currentLoan.passDueDate} />
            <DetailItem label="Principal Repaid" value={principalRepaid} isCurrency />
            <DetailItem label="Interest Repaid" value={currentLoan.interestRepaid} isCurrency />
            <DetailItem label="Total Repaid" value={totalRepaid} isCurrency />
            <DetailItem label="Principal Outstanding" value={currentLoan.outstandingBalance} isCurrency statusClass="text-red-600 font-semibold" />
            <DetailItem label="Interest Outstanding" value={currentLoan.interestOutstanding} isCurrency />
            <DetailItem 
              label="Status" 
              value={currentLoan.status} 
              statusClass={`font-semibold ${currentLoan.status === 'Paid Off' ? 'text-green-600' : 'text-red-600'}`} 
            />
            <DetailItem label="Assigned Agent ID" value={currentLoan.assignedAgentId} />
          </div>
          
          <div className="pt-2">
            <label className="block text-gray-700 font-medium mb-1">Remark</label>
            <p className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 min-h-[60px] whitespace-pre-wrap">
                {currentLoan.remark || 'N/A'}
            </p>
          </div>

          <div className="mt-6 flex flex-col space-y-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsEditRemarkModalOpen(true)}
              className="w-full bg-indigo-500 text-white py-2.5 px-5 rounded-lg hover:bg-indigo-600 transition duration-300 ease-in-out shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 text-sm"
            >
              <i className="fas fa-edit mr-2"></i>Edit Remark
            </button>
          </div>

          {/* Payment History Section */}
          <div className="pt-3 mt-3 border-t border-gray-200">
            <h4 className="text-md font-semibold mb-2 text-gray-700">Payment History</h4>
            {currentLoan.paymentHistory && currentLoan.paymentHistory.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 pl-1 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded-md border">
                {currentLoan.paymentHistory.map((payment, index) => (
                  <li key={index} className="text-xs text-gray-700">
                    {payment.date}: <span className="font-semibold text-green-700">${payment.amount?.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">No payment history.</p>
            )}
          </div>

          {/* Communication History Section */}
          <div className="pt-3 mt-3 border-t border-gray-200">
            <h4 className="text-md font-semibold mb-2 text-gray-700">Communication History</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 bg-gray-50 p-2 rounded-md border mb-3">
              {currentLoan.communicationHistory && currentLoan.communicationHistory.length > 0 ? (
                currentLoan.communicationHistory.map(log => (
                  <div key={log.id} className="text-xs p-1.5 border-b border-gray-200 last:border-b-0">
                    <div className="flex justify-between items-center">
                        <strong className="text-blue-600">{log.type}</strong>
                        <span className="text-gray-500">{log.date}</span>
                    </div>
                    <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{log.notes}</p>
                    <p className="text-gray-500 text-right text-[10px]">Logged by: {log.agentName || log.agentId}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">No communication history.</p>
              )}
            </div>

            {/* Add Communication Log Form */}
            <form onSubmit={handleAddCommSubmit} className="space-y-2 text-xs">
              <div>
                <label htmlFor="commType" className="block text-gray-600 font-medium mb-0.5">Log Type:</label>
                <select 
                    id="commType" 
                    value={commType} 
                    onChange={(e) => setCommType(e.target.value as CommunicationLogEntry['type'])}
                    className="w-full p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Visit">Visit</option>
                  <option value="SMS">SMS</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="commNotes" className="block text-gray-600 font-medium mb-0.5">Notes:</label>
                <textarea
                  id="commNotes"
                  rows={2}
                  value={commNotes}
                  onChange={(e) => setCommNotes(e.target.value)}
                  className="w-full p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs"
                  placeholder="Enter communication details..."
                ></textarea>
              </div>
              {commMessage && <p className={`text-xs ${commMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{commMessage}</p>}
              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 ease-in-out shadow-sm text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                <i className="fas fa-plus-circle mr-1"></i>Add Log Entry
              </button>
            </form>
          </div>

        </div>
      </Modal>
      <EditRemarkModal
        loan={currentLoan}
        isOpen={isEditRemarkModalOpen}
        onClose={() => setIsEditRemarkModalOpen(false)}
        onUpdateRemark={(loanId, remark) => {
            onUpdateLoanRemark(loanId, remark);
        }}
      />
    </>
  );
};

export default LoanDetailsModal;
