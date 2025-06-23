
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loan, Agent, CommunicationLogEntry } from '../types';
import LoanTable from './LoanTable';
import LoanDetailsModal from './LoanDetailsModal';
import RecordPaymentModal from './RecordPaymentModal';

interface AgentDashboardProps {
  loans: Loan[];
  agents: Agent[]; 
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
  currentAgentId: string;
  onUpdateLoanRemark: (loanId: string, remark: string) => void;
  onAddCommunicationLog: (loanId: string, logEntryData: Omit<CommunicationLogEntry, 'id' | 'date' | 'agentName'>) => void;
  loggedInUser: Agent;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ 
    loans, agents, setLoans, currentAgentId, 
    onUpdateLoanRemark, onAddCommunicationLog, loggedInUser 
}) => {
  const [isLoanDetailsModalOpen, setIsLoanDetailsModalOpen] = useState(false);
  const [selectedLoanForModal, setSelectedLoanForModal] = useState<Loan | null>(null);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedLoanForModal) {
      const updatedSelectedLoan = loans.find(l => l.id === selectedLoanForModal.id);
      if (updatedSelectedLoan && JSON.stringify(updatedSelectedLoan) !== JSON.stringify(selectedLoanForModal)) {
        setSelectedLoanForModal(updatedSelectedLoan);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loans]); 

  const agentLoans = useMemo(() => {
    const allAgentLoans = loans.filter(loan => loan.assignedAgentId === currentAgentId);
    if (!searchTerm.trim()) return allAgentLoans;
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allAgentLoans.filter(loan => 
        (loan.client && loan.client.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (loan.accountNumber && loan.accountNumber.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (loan.phoneNumber && String(loan.phoneNumber).toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [loans, currentAgentId, searchTerm]);

  const handleRecordPayment = useCallback((loanId: string, amount: number) => {
    setLoans(prevLoans => {
      const updatedLoans = prevLoans.map(loan => {
        if (loan.id === loanId) {
          const newOutstandingBalance = Math.max(0, loan.outstandingBalance - amount);
          const updatedPaymentHistory = [...loan.paymentHistory, { amount, date: new Date().toISOString().split('T')[0] }];
          
          let updatedPassDueDate = loan.passDueDate;
          if (newOutstandingBalance <= 0) {
            updatedPassDueDate = null;
          } else if (loan.expectedRepaymentDate) {
            const today = new Date();
            const repaymentDateObj = new Date(loan.expectedRepaymentDate);
            today.setHours(0,0,0,0);
            repaymentDateObj.setHours(0,0,0,0);
            if (today > repaymentDateObj && !updatedPassDueDate) {
              updatedPassDueDate = loan.expectedRepaymentDate;
            } else if (today <= repaymentDateObj) {
                updatedPassDueDate = null; 
            }
          } else {
            updatedPassDueDate = null;
          }

          const updatedLoan = {
            ...loan,
            outstandingBalance: newOutstandingBalance,
            status: newOutstandingBalance <= 0 ? 'Paid Off' : 'Outstanding',
            paymentHistory: updatedPaymentHistory,
            passDueDate: updatedPassDueDate,
          } as Loan;

          if (selectedLoanForModal && selectedLoanForModal.id === updatedLoan.id) {
            setSelectedLoanForModal(updatedLoan);
          }
          return updatedLoan;
        }
        return loan;
      });
      return updatedLoans;
    });
    setMessage('Payment recorded successfully!');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLoans, selectedLoanForModal]); 

  const handleLoanClick = (loan: Loan) => {
    setSelectedLoanForModal(loan);
    setIsLoanDetailsModalOpen(true);
  };

  const handleRecordPaymentClick = (loan: Loan) => {
    setSelectedLoanForModal(loan);
    setIsRecordPaymentModalOpen(true);
  };

  const currentAgentDetails = agents.find(a => a.id === currentAgentId);

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 text-center sm:text-left">
        Agent Dashboard <span className="text-xl font-semibold text-blue-600">({currentAgentDetails?.name})</span>
      </h2>

      {message && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <span className="block sm:inline">{message}</span>
          <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setMessage('')}>
             <i className="fas fa-times text-blue-500"></i>
          </button>
        </div>
      )}

      <section className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 pb-3 mb-6 border-b-2 border-blue-200">My Assigned Loans</h3>
        <input
            type="text"
            placeholder="Search by Client, Account No, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
        <LoanTable
          loans={agentLoans}
          agents={agents}
          onLoanClick={handleLoanClick}
          onRecordPaymentClick={handleRecordPaymentClick}
          isAdmin={false}
        />
      </section>

      {selectedLoanForModal && isLoanDetailsModalOpen && (
        <LoanDetailsModal
            isOpen={isLoanDetailsModalOpen}
            onClose={() => setIsLoanDetailsModalOpen(false)}
            loan={selectedLoanForModal}
            onUpdateLoanRemark={onUpdateLoanRemark}
            onAddCommunicationLog={onAddCommunicationLog}
            loggedInUser={loggedInUser}
            key={`agent-details-${selectedLoanForModal?.id}-${selectedLoanForModal?.communicationHistory?.length}-${selectedLoanForModal?.remark}`}
        />
      )}
      {selectedLoanForModal && isRecordPaymentModalOpen && (
        <RecordPaymentModal
            isOpen={isRecordPaymentModalOpen}
            onClose={() => setIsRecordPaymentModalOpen(false)}
            loan={selectedLoanForModal}
            onRecordPayment={handleRecordPayment}
            key={`agent-record-${selectedLoanForModal?.id}`}
        />
      )}
    </div>
  );
};

export default AgentDashboard;
