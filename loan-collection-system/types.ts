
export interface Payment {
  amount: number;
  date: string; 
}

export interface CommunicationLogEntry {
  id: string;
  date: string;
  type: 'Call' | 'Email' | 'Visit' | 'SMS' | 'Other';
  notes: string;
  agentId: string; // ID of the agent who logged this
  agentName?: string; // Optional: denormalized for easier display
}

export interface Loan {
  id: string;
  client?: string;
  branch?: string;
  accountNumber: string;
  phoneNumber?: string;
  product: string;
  originalAmount: number;
  totalLiab?: number;
  startDate: string | null; 
  maturedOn: string | null; 
  expectedRepaymentDate?: string | null;
  repaymentAmount?: number;
  remark?: string;
  passDueDate?: string | null;
  interestRepaid?: number;
  outstandingBalance: number;
  interestOutstanding?: number;
  status: 'Outstanding' | 'Paid Off';
  assignedAgentId: string | null;
  paymentHistory: Payment[];
  communicationHistory: CommunicationLogEntry[]; // New field
  term?: number; 
  interestRate?: number; 
}

export interface Agent {
  id: string;
  name: string;
  username: string;
  isAdmin: boolean;
}

// For SheetJS, which is loaded globally
declare global {
  interface Window {
    XLSX: any; 
  }
}
