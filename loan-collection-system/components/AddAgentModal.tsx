
import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface AddAgentModalProps {
  onClose: () => void;
  isOpen: boolean;
  onAddAgent: (name: string, username: string) => void;
}

const AddAgentModal: React.FC<AddAgentModalProps> = ({ onClose, isOpen, onAddAgent }) => {
  const [agentName, setAgentName] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAgentName('');
      setUsername('');
      setMessage('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!agentName.trim() || !username.trim()) {
      setMessage('Agent name and username cannot be empty.');
      return;
    }
    onAddAgent(agentName.trim(), username.trim());
    setMessage('Agent added successfully!');
    setAgentName('');
    setUsername('');
    setTimeout(() => { // Give a small delay for user to see message
        onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <Modal title="Add New Agent" onClose={onClose} isOpen={isOpen}>
      <div className="space-y-4">
        <div>
          <label htmlFor="agentName" className="block text-gray-700 font-medium mb-1">Agent Name</label>
          <input
            type="text"
            id="agentName"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder="e.g., Jane Doe"
          />
        </div>
        <div>
          <label htmlFor="username" className="block text-gray-700 font-medium mb-1">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder="e.g., jane.doe"
          />
        </div>
        {message && <p className={`${message.includes('successfully') ? 'text-green-600' : 'text-red-600'} text-sm font-medium`}>{message}</p>}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Add Agent
        </button>
      </div>
    </Modal>
  );
};

export default AddAgentModal;
