
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Loan, Agent, CommunicationLogEntry } from '../types';
import { parseDateDDMonYY } from '../utils/dateUtils';
import LoanTable from './LoanTable';
import AddAgentModal from './AddAgentModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import LoanDetailsModal from './LoanDetailsModal';
import ConfirmDistributionModal from './ConfirmDistributionModal';

interface AdminDashboardProps {
  loans: Loan[];
  agents: Agent[];
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  isXLSXLoaded: boolean;
  onUpdateLoanRemark: (loanId: string, remark: string) => void;
  onAddCommunicationLog: (loanId: string, logEntryData: Omit<CommunicationLogEntry, 'id' | 'date' | 'agentName'>) => void;
  loggedInUser: Agent;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    loans, agents, setLoans, setAgents, isXLSXLoaded, 
    onUpdateLoanRemark, onAddCommunicationLog, loggedInUser 
}) => {
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);
  const [isConfirmDeleteLoanModalOpen, setIsConfirmDeleteLoanModalOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<{ id: string; accountNumber: string } | null>(null);
  const [isConfirmDeleteAgentModalOpen, setIsConfirmDeleteAgentModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isLoanDetailsModalOpen, setIsLoanDetailsModalOpen] = useState(false);
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState<Loan | null>(null);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isConfirmDistributionModalOpen, setIsConfirmDistributionModalOpen] = useState(false);
  const [newlyUploadedLoans, setNewlyUploadedLoans] = useState<Loan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const importLoansRef = useRef<HTMLElement>(null);
  const allLoansRef = useRef<HTMLElement>(null);
  const agentsRef = useRef<HTMLElement>(null);
  const performanceRef = useRef<HTMLElement>(null);
  const portfolioSnapshotRef = useRef<HTMLElement>(null); // Ref for new chart section


  useEffect(() => {
    if (selectedLoanForDetails) {
        const updatedSelectedLoan = loans.find(l => l.id === selectedLoanForDetails.id);
        // Deep comparison or specific field check might be better if objects are complex
        if (updatedSelectedLoan && JSON.stringify(updatedSelectedLoan) !== JSON.stringify(selectedLoanForDetails)) {
            setSelectedLoanForDetails(updatedSelectedLoan);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [loans]); 

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setMessage('');
    } else {
      setSelectedFile(null);
    }
  };
  
  const processAndPotentiallyDistributeLoans = useCallback(() => {
    if (!isXLSXLoaded) {
      setMessage('File import library not yet loaded. Please wait and try again.');
      return;
    }
    if (!selectedFile) {
      setMessage('Please select a file to upload.');
      return;
    }

    const availableAgents = agents.filter(agent => !agent.isAdmin);
    if (availableAgents.length === 0) {
        setMessage('No collection agents available for distribution. Please add agents first.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[][] = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd'});

            if (json.length < 2) { 
                setMessage('The uploaded file is empty or contains no data rows.');
                return;
            }

            const headers: string[] = json[0].map(h => String(h).toLowerCase().replace(/\s+/g, ''));
            const loanData = json.slice(1);

            const parsedLoansFromFile: Loan[] = loanData.map((row) => {
                const loan: Partial<Loan> & { communicationHistory?: CommunicationLogEntry[] } = { 
                  id: uuidv4(), 
                  paymentHistory: [], 
                  communicationHistory: [], // Initialize communication history
                  status: 'Outstanding', 
                  assignedAgentId: null 
                };
                
                headers.forEach((header, index) => {
                    const value = row[index];
                    if (value === undefined || value === null) return;

                    switch (header) {
                        case 'loanaccountnumber': case 'accountnumber': loan.accountNumber = String(value); break;
                        case 'product': loan.product = String(value); break;
                        case 'originalamount': case 'loanamount': loan.originalAmount = parseFloat(String(value)); break;
                        case 'term': loan.term = parseInt(String(value), 10); break;
                        case 'startdate': case 'disburseddate': loan.startDate = parseDateDDMonYY(value); break;
                        case 'client': loan.client = String(value); break;
                        case 'branch': loan.branch = String(value); break;
                        case 'phonenumber': loan.phoneNumber = String(value); break;
                        case 'totalliab': case 'totalliability': loan.totalLiab = parseFloat(String(value)); break;
                        case 'repaymentamount': case 'expectedrepaymentamount': loan.repaymentAmount = parseFloat(String(value)) || 0; break;
                        case 'repaymentdate': case 'expectedrepaymentdate': loan.expectedRepaymentDate = parseDateDDMonYY(value); break;
                        case 'remark': loan.remark = String(value); break;
                        case 'interestrepaid': loan.interestRepaid = parseFloat(String(value)); break;
                        case 'interestoutstanding': loan.interestOutstanding = parseFloat(String(value)); break;
                    }
                });

                if (!loan.accountNumber || isNaN(loan.originalAmount ?? NaN) || (loan.originalAmount ?? 0) <= 0) {
                    console.warn('Skipping invalid loan row:', row);
                    return null;
                }
                
                loan.outstandingBalance = loan.originalAmount;

                if (loan.startDate) {
                    const [year, month, day] = loan.startDate.split('-').map(Number);
                    const startDateTime = new Date(year, month - 1, day);
                    let monthsToAdd = 0;
                    switch (loan.product?.toLowerCase()) {
                        case 'small enterprise': monthsToAdd = 4; break;
                        case 'medium enterprise capital expenditure': case 'lease financing': monthsToAdd = 30; break;
                        case 'commercial product one': monthsToAdd = 18; break;
                    }
                    if (monthsToAdd > 0) {
                      const maturedDateTime = new Date(startDateTime);
                      maturedDateTime.setMonth(maturedDateTime.getMonth() + monthsToAdd);
                      loan.maturedOn = maturedDateTime.toISOString().split('T')[0];
                    } else {
                      loan.maturedOn = null; 
                    }
                } else {
                    loan.maturedOn = null;
                }

                if (loan.expectedRepaymentDate && (loan.outstandingBalance ?? 0) > 0) {
                    const today = new Date();
                    const repaymentDate = new Date(loan.expectedRepaymentDate);
                    today.setHours(0,0,0,0);
                    repaymentDate.setHours(0,0,0,0);
                    if (today > repaymentDate) loan.passDueDate = loan.expectedRepaymentDate;
                    else loan.passDueDate = null;
                } else {
                    loan.passDueDate = null;
                }
                return loan as Loan;
            }).filter((loan): loan is Loan => loan !== null);


            if (parsedLoansFromFile.length === 0) {
                setMessage('No valid loan data found in the file.');
                return;
            }

            setNewlyUploadedLoans(parsedLoansFromFile);
            const existingUnassignedCount = loans.filter(l => !l.assignedAgentId && l.status === 'Outstanding').length;
            if (existingUnassignedCount > 0 || parsedLoansFromFile.length > 0) { 
                setIsConfirmDistributionModalOpen(true);
            } else {
                setLoans(prev => [...prev, ...parsedLoansFromFile]);
                setMessage(`Successfully uploaded ${parsedLoansFromFile.length} loans. No distribution performed.`);
            }

            setSelectedFile(null); 
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error: any) {
            setMessage(`Error processing file: ${error.message}`);
            console.error("File processing error:", error);
        }
    };
    reader.readAsArrayBuffer(selectedFile);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, isXLSXLoaded, agents, loans, setLoans]); 

  const distributeLoans = useCallback((loansToProcess: Loan[], existingLoans: Loan[]) => {
    const availableAgents = agents.filter(agent => !agent.isAdmin);
    if (availableAgents.length === 0) return loansToProcess; 

    let currentAgentIndex = 0;
    const allUnassigned = [...existingLoans.filter(l => !l.assignedAgentId && l.status === 'Outstanding'), ...loansToProcess];
    
    const distributedUnassigned = allUnassigned.map(loan => {
        const agent = availableAgents[currentAgentIndex];
        currentAgentIndex = (currentAgentIndex + 1) % availableAgents.length;
        return { ...loan, assignedAgentId: agent.id };
    });

    const alreadyAssignedOrPaid = existingLoans.filter(l => l.assignedAgentId || l.status === 'Paid Off');
    // Filter out loans that were unassigned before and are now in distributedUnassigned
    const uniqueAlreadyAssignedOrPaid = alreadyAssignedOrPaid.filter(l => !allUnassigned.find(ul => ul.id === l.id && !l.assignedAgentId)); 

    return [...uniqueAlreadyAssignedOrPaid, ...distributedUnassigned];
  }, [agents]);


  const handleConfirmDistribution = () => {
    setLoans(prevLoans => distributeLoans(newlyUploadedLoans, prevLoans));
    setMessage(`Successfully uploaded and distributed all unassigned loans.`);
    finishDistribution();
  };

  const handleCancelDistribution = () => { 
    setLoans(prevLoans => [...prevLoans, ...newlyUploadedLoans]);
    setMessage(`Successfully uploaded ${newlyUploadedLoans.length} loans (currently unassigned).`);
    finishDistribution();
  };
  
  const finishDistribution = () => {
    setIsConfirmDistributionModalOpen(false);
    setNewlyUploadedLoans([]);
  }


  const handleAddAgent = (name: string, username: string) => {
    const newAgent: Agent = { id: uuidv4(), name, username, isAdmin: false };
    setAgents(prevAgents => [...prevAgents, newAgent]);
    setMessage(`Agent "${name}" added successfully.`);
  };

  const handleDeleteAgent = (agentId?: string) => {
    if(!agentId) return;
    const agentName = agents.find(a => a.id === agentId)?.name;
    setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
    setLoans(prevLoans => prevLoans.map(loan =>
      loan.assignedAgentId === agentId ? { ...loan, assignedAgentId: null } : loan
    ));
    setMessage(`Agent "${agentName}" deleted. Their loans are now unassigned.`);
    setIsConfirmDeleteAgentModalOpen(false);
    setAgentToDelete(null);
  };

  const confirmDeleteAgent = (agent: Agent) => {
    setAgentToDelete(agent);
    setIsConfirmDeleteAgentModalOpen(true);
  };

  const handleDeleteLoan = (loanId?: string) => {
    if(!loanId) return;
    const loanAccNum = loans.find(l => l.id === loanId)?.accountNumber;
    setLoans(prevLoans => prevLoans.filter(loan => loan.id !== loanId));
    setMessage(`Loan "${loanAccNum}" deleted successfully.`);
    setIsConfirmDeleteLoanModalOpen(false);
    setLoanToDelete(null);
  };

  const confirmDeleteLoan = (loanId: string, loanAccNum: string) => {
    setLoanToDelete({ id: loanId, accountNumber: loanAccNum });
    setIsConfirmDeleteLoanModalOpen(true);
  };

  const handleLoanClick = (loan: Loan) => {
    setSelectedLoanForDetails(loan);
    setIsLoanDetailsModalOpen(true);
  };

  const filteredLoans = useMemo(() => {
    if (!searchTerm.trim()) return loans;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return loans.filter(loan => 
      (loan.client && loan.client.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (loan.accountNumber && loan.accountNumber.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (loan.phoneNumber && String(loan.phoneNumber).toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [loans, searchTerm]);

  const agentPerformance = useMemo(() => {
    return agents.filter(agent => !agent.isAdmin).map(agent => {
      const agentLoans = loans.filter(loan => loan.assignedAgentId === agent.id);
      const totalOriginalAssignedAmount = agentLoans.reduce((sum, loan) => sum + loan.originalAmount, 0);
      const totalAmountCollected = agentLoans.reduce((sum, loan) => 
        sum + loan.paymentHistory.reduce((pSum, payment) => pSum + payment.amount, 0), 0);
      const totalOutstandingAmount = agentLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
      
      return {
        id: agent.id,
        name: agent.name,
        assignedLoansCount: agentLoans.length,
        totalOriginalAssignedAmount,
        paymentsCollectedCount: agentLoans.reduce((sum, loan) => sum + loan.paymentHistory.length, 0),
        totalAmountCollected,
        paidOffLoansCount: agentLoans.filter(loan => loan.status === 'Paid Off').length,
        outstandingLoansCount: agentLoans.filter(loan => loan.status === 'Outstanding').length,
        totalOutstandingAmount,
      };
    });
  }, [loans, agents]);

  const maxOutstandingForChart = useMemo(() => {
    const amounts = agentPerformance.map(ap => ap.totalOutstandingAmount);
    return amounts.length > 0 ? Math.max(...amounts, 0) : 0;
  }, [agentPerformance]);


  return (
    <div className="p-4 sm:p-8 space-y-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 text-center sm:text-left">Admin Dashboard</h2>

      <nav className="flex flex-wrap justify-center gap-2 sm:gap-4 py-4 px-2 bg-white rounded-xl shadow-lg border border-gray-100 sticky top-0 z-40">
        {[
          { label: 'Import Loans', ref: importLoansRef },
          { label: 'All Loans', ref: allLoansRef },
          { label: 'Manage Agents', ref: agentsRef },
          { label: 'Agent Performance', ref: performanceRef },
          { label: 'Portfolio Snapshot', ref: portfolioSnapshotRef }
        ].map(item => (
          <button
            key={item.label}
            onClick={() => scrollToSection(item.ref)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md transition duration-300 ease-in-out text-sm sm:text-base whitespace-nowrap"
          >
            {item.label}
          </button>
        ))}
      </nav>

      {message && (
        <div className={`border px-4 py-3 rounded-lg relative mb-4 ${message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('empty') ? 'bg-red-100 border-red-400 text-red-700' : 'bg-blue-100 border-blue-400 text-blue-700'}`} role="alert">
          <span className="block sm:inline">{message}</span>
          <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setMessage('')}>
            <i className={`fas fa-times ${message.toLowerCase().includes('error') ? 'text-red-500' : 'text-blue-500'}`}></i>
          </button>
        </div>
      )}

      <section ref={importLoansRef} className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 pb-3 mb-6 border-b-2 border-blue-200">Import and Distribute Loans</h3>
        <div className="space-y-4">
            <div>
                <label htmlFor="file-upload" className="block text-gray-700 font-medium mb-2">Select CSV/Excel File</label>
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                    <input
                        id="file-upload"
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        className={`block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-colors ${!isXLSXLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isXLSXLoaded}
                    />
                    <button
                        onClick={processAndPotentiallyDistributeLoans}
                        disabled={!selectedFile || !isXLSXLoaded || agents.filter(a => !a.isAdmin).length === 0}
                        className="w-full sm:w-auto bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        Upload Loans
                    </button>
                </div>
            </div>
            {!isXLSXLoaded && <p className="mt-2 text-sm text-yellow-600 animate-pulse">Loading file import library...</p>}
            {agents.filter(a => !a.isAdmin).length === 0 && (
                <p className="mt-2 text-sm text-red-600">No collection agents available for distribution. Please add non-admin agents first.</p>
            )}
            <p className="mt-2 text-xs sm:text-sm text-gray-500">Ensure file headers include: AccountNumber, Product, OriginalAmount, StartDate, Client, Branch, PhoneNumber, TotalLiab, ExpectedRepaymentDate, RepaymentAmount, Remark, etc. Dates preferred as YYYY-MM-DD or DD-Mon-YY.</p>
        </div>
      </section>

      <section ref={allLoansRef} className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 pb-3 mb-6 border-b-2 border-blue-200">All Loans</h3>
        <input
            type="text"
            placeholder="Search by Client, Account No, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
        <LoanTable
            loans={filteredLoans}
            agents={agents}
            onLoanClick={handleLoanClick}
            onLoanDelete={confirmDeleteLoan}
            isAdmin={true}
        />
      </section>

      <section ref={agentsRef} className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center pb-3 mb-6 border-b-2 border-blue-200">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-0">Collection Agents</h3>
          <button
            onClick={() => setIsAddAgentModalOpen(true)}
            className="w-full sm:w-auto bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <i className="fas fa-plus mr-2"></i>Add New Agent
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {agents.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-lg">No agents added.</td></tr>
              ) : (
                agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{agent.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{agent.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        agent.isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                      }`}>{agent.isAdmin ? 'Administrator' : 'Agent'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!agent.isAdmin && (
                        <button onClick={() => confirmDeleteAgent(agent)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete Agent">
                          <i className="fas fa-user-times"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section ref={performanceRef} className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 pb-3 mb-6 border-b-2 border-blue-200">Agent Performance Metrics</h3>
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                {['Agent Name', 'Assigned Loans', 'Orig. Amt Assigned', 'Payments Made', 'Amt Collected', 'Loans Paid Off', 'Loans Outstanding', 'Total Outstanding'].map(header => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {agentPerformance.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-500 text-lg">No agent performance data. Add agents and assign loans.</td></tr>
              ) : (
                agentPerformance.map((data) => (
                  <tr key={data.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{data.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{data.assignedLoansCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">${data.totalOriginalAssignedAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{data.paymentsCollectedCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-700 font-semibold">${data.totalAmountCollected?.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{data.paidOffLoansCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{data.outstandingLoansCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-bold">${data.totalOutstandingAmount?.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      {/* New Agent Portfolio Snapshot Section */}
      <section ref={portfolioSnapshotRef} className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 pb-3 mb-6 border-b-2 border-blue-200">Agent Portfolio Snapshot: Outstanding Balances</h3>
        {agentPerformance.length > 0 && maxOutstandingForChart > 0 ? (
          <div className="space-y-4">
            {agentPerformance.map(agentPerf => (
              <div key={agentPerf.id} className="text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700 w-1/3 truncate" title={agentPerf.name}>{agentPerf.name}</span>
                  <span className="text-gray-600 w-2/3 text-right">${agentPerf.totalOutstandingAmount.toFixed(2)}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-5 w-full shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-5 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium shadow-md transition-all duration-500 ease-out"
                    style={{ width: `${maxOutstandingForChart > 0 ? (agentPerf.totalOutstandingAmount / maxOutstandingForChart) * 100 : 0}%` }}
                    title={`$${agentPerf.totalOutstandingAmount.toFixed(2)}`}
                  >
                   {/* Display percentage inside bar if space allows, or value itself */}
                   { (agentPerf.totalOutstandingAmount / maxOutstandingForChart) * 100 > 10 ? `${((agentPerf.totalOutstandingAmount / maxOutstandingForChart) * 100).toFixed(0)}%` : ''}

                  </div>
                </div>
              </div>
            ))}
             <p className="text-xs text-gray-500 mt-2 text-center">Bar width represents outstanding amount relative to the agent with the highest total.</p>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-5">
            {agentPerformance.length === 0 ? "No agent data available to display snapshot." : "No outstanding balances to display in snapshot."}
          </p>
        )}
      </section>


      <AddAgentModal isOpen={isAddAgentModalOpen} onClose={() => setIsAddAgentModalOpen(false)} onAddAgent={handleAddAgent} />
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteLoanModalOpen}
        onClose={() => setIsConfirmDeleteLoanModalOpen(false)}
        onConfirm={() => handleDeleteLoan(loanToDelete?.id)}
        itemType="Loan"
        itemName={loanToDelete?.accountNumber}
      />
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteAgentModalOpen}
        onClose={() => setIsConfirmDeleteAgentModalOpen(false)}
        onConfirm={() => handleDeleteAgent(agentToDelete?.id)}
        itemType="Agent"
        itemName={agentToDelete?.name}
      />
      {selectedLoanForDetails && isLoanDetailsModalOpen && (
        <LoanDetailsModal
            isOpen={isLoanDetailsModalOpen}
            onClose={() => setIsLoanDetailsModalOpen(false)}
            loan={selectedLoanForDetails}
            onUpdateLoanRemark={onUpdateLoanRemark}
            onAddCommunicationLog={onAddCommunicationLog}
            loggedInUser={loggedInUser}
            key={`admin-details-${selectedLoanForDetails?.id}-${selectedLoanForDetails?.communicationHistory?.length}-${selectedLoanForDetails?.remark}`}
        />
      )}
      <ConfirmDistributionModal
          isOpen={isConfirmDistributionModalOpen}
          unassignedCount={loans.filter(l => !l.assignedAgentId && l.status === 'Outstanding').length + newlyUploadedLoans.length}
          onConfirm={handleConfirmDistribution}
          onCancel={handleCancelDistribution}
      />
    </div>
  );
};

export default AdminDashboard;
