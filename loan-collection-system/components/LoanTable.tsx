
import React from 'react';
import { Loan, Agent } from '../types';

interface LoanTableProps {
  loans: Loan[];
  agents: Agent[];
  onLoanClick: (loan: Loan) => void;
  onRecordPaymentClick?: (loan: Loan) => void; // Optional for admin view
  onLoanDelete?: (loanId: string, loanAccNum: string) => void; // Optional for agent view
  isAdmin: boolean;
}

const LoanTable: React.FC<LoanTableProps> = ({ loans, agents, onLoanClick, onRecordPaymentClick, onLoanDelete, isAdmin }) => {
  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : 'N/A';
  };

  const thClasses = "px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider whitespace-nowrap";
  const tdClasses = "px-4 py-3 whitespace-nowrap text-sm text-gray-700";

  return (
    <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-50">
          <tr>
            <th className={thClasses}>Client</th>
            <th className={thClasses}>Branch</th>
            <th className={thClasses}>Account Number</th>
            <th className={thClasses}>Phone</th>
            <th className={thClasses}>Product</th>
            <th className={thClasses}>Loan Amount</th>
            <th className={thClasses}>Total Liab</th>
            <th className={thClasses}>Disbursed</th>
            <th className={thClasses}>Matured On</th>
            <th className={thClasses}>Repay Date</th>
            <th className={thClasses}>Repay Amt</th>
            <th className={thClasses}>Principal Repaid</th>
            <th className={thClasses}>Outstanding</th>
            <th className={thClasses}>Pass Due Date</th>
            <th className={thClasses}>Status</th>
            <th className={thClasses}>Assigned Agent</th>
            <th className={thClasses}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loans.length === 0 ? (
            <tr>
              <td colSpan={17} className="px-6 py-10 text-center text-gray-500 text-lg">
                No loans available.
              </td>
            </tr>
          ) : (
            loans.map((loan) => (
              <tr key={loan.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className={tdClasses}>{loan.client || 'N/A'}</td>
                <td className={tdClasses}>{loan.branch || 'N/A'}</td>
                <td 
                    className={`${tdClasses} font-medium text-blue-600 cursor-pointer hover:underline`}
                    onClick={() => onLoanClick(loan)}
                >
                  {loan.accountNumber}
                </td>
                <td className={tdClasses}>{loan.phoneNumber || 'N/A'}</td>
                <td className={tdClasses}>{loan.product}</td>
                <td className={tdClasses}>${loan.originalAmount?.toFixed(2)}</td>
                <td className={tdClasses}>${loan.totalLiab?.toFixed(2) || 'N/A'}</td>
                <td className={tdClasses}>{loan.startDate}</td>
                <td className={tdClasses}>{loan.maturedOn}</td>
                <td className={tdClasses}>{loan.expectedRepaymentDate || 'N/A'}</td>
                <td className={tdClasses}>${loan.repaymentAmount?.toFixed(2) || 'N/A'}</td>
                <td className={tdClasses}>${(loan.originalAmount - loan.outstandingBalance)?.toFixed(2)}</td>
                <td className={`${tdClasses} font-bold ${loan.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${loan.outstandingBalance?.toFixed(2)}
                </td>
                <td className={`${tdClasses} ${loan.passDueDate ? 'text-yellow-600 font-semibold' : ''}`}>{loan.passDueDate || 'N/A'}</td>
                <td className={tdClasses}>
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    loan.status === 'Paid Off' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {loan.status}
                  </span>
                </td>
                <td className={tdClasses}>{getAgentName(loan.assignedAgentId)}</td>
                <td className={`${tdClasses} text-center`}>
                  {isAdmin && onLoanDelete ? (
                    <button
                      onClick={() => onLoanDelete(loan.id, loan.accountNumber)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-150"
                      title="Delete Loan"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  ) : !isAdmin && onRecordPaymentClick ? (
                    <button
                      onClick={() => onRecordPaymentClick(loan)}
                      disabled={loan.status === 'Paid Off'}
                      className={`text-blue-500 hover:text-blue-700 transition-colors duration-150 ${loan.status === 'Paid Off' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Record Payment"
                    >
                      <i className="fas fa-money-bill-wave"></i>
                    </button>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LoanTable;
