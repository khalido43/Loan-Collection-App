
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Loan, Agent, CommunicationLogEntry } from './types';
import AdminDashboard from './components/AdminDashboard';
import AgentDashboard from './components/AgentDashboard';
import { seedAgents, seedLoans } from './seedData'; // Import seed data

// Define LoginScreen as a sub-component within App.tsx
interface LoginScreenProps {
  onLogin: (username: string) => void;
  error: string;
  agents: Agent[]; // Pass agents to suggest available usernames
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error, agents }) => {
  const [username, setUsername] = useState('');
  
  const nonAdminAgents = agents.filter(a => !a.isAdmin);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center border border-gray-200 transform transition-all hover:scale-105 duration-300">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 mb-4">
          Loan Collection System
        </h1>
        <h2 className="text-2xl text-gray-700 mb-6 font-medium">Welcome Back!</h2>
        
        <p className="text-gray-600 mb-2 text-sm">
          Please enter your username to login.
        </p>
        <p className="text-gray-500 mb-4 text-xs">
          Default admin: <code className="bg-gray-200 px-1 rounded">admin</code>
          {nonAdminAgents.length > 0 && 
            <> | Available agents: {nonAdminAgents.map(a => <code key={a.id} className="bg-gray-200 px-1 rounded mr-1">{a.username}</code>)}</>
          }
        </p>
        
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow"
          onKeyPress={(e) => e.key === 'Enter' && username.trim() && onLogin(username)}
        />
        <button
          onClick={() => onLogin(username)}
          disabled={!username.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Login
        </button>
        {error && <p className="text-red-500 mt-4 text-sm animate-pulse">{error}</p>}
      </div>
    </div>
  );
};


function App() {
  const [agents, setAgents] = useState<Agent[]>(() => {
    const savedAgents = localStorage.getItem('agents');
    try {
      return savedAgents ? JSON.parse(savedAgents) : seedAgents; 
    } catch {
      return seedAgents;
    }
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const savedLoans = localStorage.getItem('loans');
     try {
      const parsedLoans = savedLoans ? JSON.parse(savedLoans) : seedLoans;
      // Ensure communicationHistory is always an array
      return parsedLoans.map((loan: Loan) => ({
        ...loan,
        communicationHistory: Array.isArray(loan.communicationHistory) ? loan.communicationHistory : [],
      }));
    } catch {
      return seedLoans.map(loan => ({ ...loan, communicationHistory: [] }));
    }
  });

  const [loggedInUser, setLoggedInUser] = useState<Agent | null>(() => {
    const savedUser = localStorage.getItem('loggedInUser');
    if (savedUser) {
        try {
          const userFromStorage = JSON.parse(savedUser);
          const userExists = agents.find(a => a.id === userFromStorage.id && a.username === userFromStorage.username);
          return userExists ? userFromStorage : null;
        } catch {
          return null;
        }
    }
    return null;
  });
  
  const [loginError, setLoginError] = useState('');
  const [isXLSXLoaded, setIsXLSXLoaded] = useState(false);

  useEffect(() => {
    if (window.XLSX) {
      setIsXLSXLoaded(true);
    } else {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.async = true;
      script.onload = () => setIsXLSXLoaded(true);
      script.onerror = () => console.error('Failed to load SheetJS library dynamically.');
      document.head.appendChild(script);
      return () => { if(document.head.contains(script)) document.head.removeChild(script); };
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('loans', JSON.stringify(loans));
  }, [loans]);
  
  useEffect(() => {
    if (loggedInUser) {
        localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    } else {
        localStorage.removeItem('loggedInUser');
    }
  }, [loggedInUser]);


  const handleLogin = (username: string) => {
    const user = agents.find(agent => agent.username.toLowerCase() === username.toLowerCase());
    if (user) {
      setLoggedInUser(user);
      setLoginError('');
    } else {
      setLoginError('Invalid username. Please try again.');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
  };

  const handleUpdateLoanRemark = useCallback((loanId: string, newRemark: string) => {
    setLoans(prevLoans =>
      prevLoans.map(loan =>
        loan.id === loanId ? { ...loan, remark: newRemark } : loan
      )
    );
  }, []);

  const handleAddCommunicationLog = useCallback((loanId: string, logEntryData: Omit<CommunicationLogEntry, 'id' | 'date' | 'agentName'>) => {
    setLoans(prevLoans =>
      prevLoans.map(loan => {
        if (loan.id === loanId) {
          const agent = agents.find(a => a.id === logEntryData.agentId);
          const newLog: CommunicationLogEntry = {
            ...logEntryData,
            id: uuidv4(),
            date: new Date().toISOString().split('T')[0],
            agentName: agent?.name || 'Unknown Agent'
          };
          // Ensure communicationHistory is an array before spreading
          const existingCommHistory = Array.isArray(loan.communicationHistory) ? loan.communicationHistory : [];
          return {
            ...loan,
            communicationHistory: [newLog, ...existingCommHistory],
          };
        }
        return loan;
      })
    );
  }, [agents]);


  return (
    <div className="min-h-screen bg-gray-100">
      {loggedInUser ? (
        <>
          <header className="bg-gray-800 text-white py-4 px-6 sm:px-8 shadow-lg flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50">
            <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">Loan Collection System</h1>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="text-sm sm:text-lg">Welcome, <strong className="font-semibold">{loggedInUser.name}</strong> ({loggedInUser.isAdmin ? 'Admin' : 'Agent'})</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-red-600 transition duration-300 ease-in-out shadow-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
              >
                <i className="fas fa-sign-out-alt mr-1 sm:mr-2"></i>Logout
              </button>
            </div>
          </header>
          {loggedInUser.isAdmin ? (
            <AdminDashboard
              loans={loans}
              agents={agents}
              setLoans={setLoans}
              setAgents={setAgents}
              isXLSXLoaded={isXLSXLoaded}
              onUpdateLoanRemark={handleUpdateLoanRemark}
              onAddCommunicationLog={handleAddCommunicationLog}
              loggedInUser={loggedInUser}
            />
          ) : (
            <AgentDashboard
              loans={loans}
              agents={agents}
              setLoans={setLoans}
              currentAgentId={loggedInUser.id}
              onUpdateLoanRemark={handleUpdateLoanRemark}
              onAddCommunicationLog={handleAddCommunicationLog}
              loggedInUser={loggedInUser}
            />
          )}
        </>
      ) : (
        <LoginScreen onLogin={handleLogin} error={loginError} agents={agents} />
      )}
    </div>
  );
}

export default App;
