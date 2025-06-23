
import { v4 as uuidv4 } from 'uuid';
import { Agent, Loan, CommunicationLogEntry } from './types';

// Generate consistent IDs for agents to be referenced in loans
const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const AGENT_JOHN_ID = '00000000-0000-0000-0000-000000000002';
const AGENT_SARAH_ID = '00000000-0000-0000-0000-000000000003';

export const seedAgents: Agent[] = [
  { id: ADMIN_ID, name: 'Admin User', username: 'admin', isAdmin: true },
  { id: AGENT_JOHN_ID, name: 'John Collector', username: 'johnc', isAdmin: false },
  { id: AGENT_SARAH_ID, name: 'Sarah Field', username: 'sarahf', isAdmin: false },
];

const sampleCommunicationLogsJohn: CommunicationLogEntry[] = [
  { 
    id: uuidv4(), 
    date: '2024-04-20', 
    type: 'Call', 
    notes: 'Called client, discussed payment plan. Client agreed to pay $500 next week.', 
    agentId: AGENT_JOHN_ID,
    agentName: 'John Collector' 
  },
  { 
    id: uuidv4(), 
    date: '2024-04-22', 
    type: 'SMS', 
    notes: 'Sent reminder SMS about upcoming payment.', 
    agentId: AGENT_JOHN_ID,
    agentName: 'John Collector'
  },
];

export const seedLoans: Loan[] = [
  {
    id: uuidv4(),
    client: 'Alice Wonderland',
    branch: 'Main Street Branch',
    accountNumber: 'LN001',
    phoneNumber: '555-0101',
    product: 'Small Enterprise', // Matures in 4 months
    originalAmount: 5000,
    totalLiab: 5500,
    startDate: '2024-01-15',
    maturedOn: '2024-05-15',
    expectedRepaymentDate: '2024-05-15',
    repaymentAmount: 5500,
    remark: 'Client is responsive. Follow up on payment plan.',
    passDueDate: null,
    interestRepaid: 100,
    outstandingBalance: 2000,
    interestOutstanding: 50,
    status: 'Outstanding',
    assignedAgentId: AGENT_JOHN_ID,
    paymentHistory: [
      { amount: 1000, date: '2024-02-15' },
      { amount: 1000, date: '2024-03-15' },
      { amount: 1500, date: '2024-04-15' },
    ],
    communicationHistory: sampleCommunicationLogsJohn,
    term: 4,
  },
  {
    id: uuidv4(),
    client: 'Bob The Builder',
    branch: 'Downtown Office',
    accountNumber: 'LN002',
    phoneNumber: '555-0202',
    product: 'Lease Financing', // Matures in 30 months
    originalAmount: 25000,
    totalLiab: 28000,
    startDate: '2022-06-01',
    maturedOn: '2024-12-01',
    expectedRepaymentDate: '2024-12-01',
    repaymentAmount: 28000,
    remark: 'Paid off ahead of schedule.',
    passDueDate: null,
    interestRepaid: 3000,
    outstandingBalance: 0,
    interestOutstanding: 0,
    status: 'Paid Off',
    assignedAgentId: AGENT_SARAH_ID,
    paymentHistory: [
      { amount: 10000, date: '2023-01-01' },
      { amount: 10000, date: '2023-07-01' },
      { amount: 8000, date: '2024-01-01' },
    ],
    communicationHistory: [],
    term: 30,
  },
  {
    id: uuidv4(),
    client: 'Charlie Brown',
    branch: 'Westside Center',
    accountNumber: 'LN003',
    phoneNumber: '555-0303',
    product: 'Commercial Product One', // Matures in 18 months
    originalAmount: 15000,
    totalLiab: 17000,
    startDate: '2023-11-01',
    maturedOn: '2025-05-01',
    expectedRepaymentDate: '2025-05-01',
    repaymentAmount: 17000,
    remark: 'New client, monitor closely.',
    passDueDate: null,
    interestRepaid: 0,
    outstandingBalance: 15000,
    interestOutstanding: 2000,
    status: 'Outstanding',
    assignedAgentId: null, // Unassigned
    paymentHistory: [],
    communicationHistory: [],
    term: 18,
  },
  {
    id: uuidv4(),
    client: 'Diana Prince',
    branch: 'Metropolis HQ',
    accountNumber: 'LN004',
    phoneNumber: '555-0404',
    product: 'Small Enterprise', // Matures in 4 months
    originalAmount: 7000,
    totalLiab: 7700,
    startDate: '2023-12-01', // Disbursed
    maturedOn: '2024-04-01', // Matured
    expectedRepaymentDate: '2024-04-01', // Expected repayment
    repaymentAmount: 7700,
    remark: 'Payment overdue. Follow up required.',
    passDueDate: '2024-04-01', 
    interestRepaid: 0,
    outstandingBalance: 7000,
    interestOutstanding: 700,
    status: 'Outstanding',
    assignedAgentId: AGENT_JOHN_ID,
    paymentHistory: [],
    communicationHistory: [],
    term: 4,
  },
  {
    id: uuidv4(),
    client: 'Edward Scissorhands',
    branch: 'Suburban Outlet',
    accountNumber: 'LN005',
    phoneNumber: '555-0505',
    product: 'Medium Enterprise Capital Expenditure', // Matures in 30 months
    originalAmount: 50000,
    totalLiab: 58000,
    startDate: '2024-03-01',
    maturedOn: '2026-09-01',
    expectedRepaymentDate: '2026-09-01',
    repaymentAmount: 58000,
    remark: '',
    passDueDate: null,
    interestRepaid: 0,
    outstandingBalance: 50000,
    interestOutstanding: 8000,
    status: 'Outstanding',
    assignedAgentId: null, // Unassigned
    paymentHistory: [],
    communicationHistory: [],
    term: 30,
  }
];
