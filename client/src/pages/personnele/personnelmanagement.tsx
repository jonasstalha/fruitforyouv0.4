import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Filter, 
  Search, 
  ChevronDown 
} from 'lucide-react';

// Worker interface to define worker structure
interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  position: 'Operator';
  phoneNumber: string;
  hireDate: string;
  salary?: number;
  status: 'Active' | 'Inactive' | 'On Leave';
}

const PersonnelManagement: React.FC = () => {
  // State to manage workers
  const [workers, setWorkers] = useState<Worker[]>([]);

  // State for new worker form
  const [newWorker, setNewWorker] = useState<Omit<Worker, 'id'>>({
    firstName: '',
    lastName: '',
    position: 'Operator',
    phoneNumber: '',
    hireDate: '',
    status: 'Active',
    salary: 0
  });

  // State for modal visibility and edit mode
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Worker['status'] | ''>('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{key: keyof Worker, direction: 'asc' | 'desc'}>({
    key: 'lastName',
    direction: 'asc'
  });

  // Handle input changes for new worker
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const currentWorker = editingWorker ? editingWorker : newWorker;

    const updatedWorker = {
      ...currentWorker,
      [name]: name === 'salary' ? Number(value) : value
    };

    if (editingWorker) {
      setEditingWorker(updatedWorker as Worker);
    } else {
      setNewWorker(updatedWorker);
    }
  };

  // Add or update worker
  const saveWorker = () => {
    if (editingWorker) {
      // Update existing worker
      setWorkers(prev => 
        prev.map(worker => 
          worker.id === editingWorker.id ? editingWorker : worker
        )
      );
      setEditingWorker(null);
    } else {
      // Add new worker
      const worker: Worker = {
        ...newWorker,
        id: `worker-${Date.now()}` // Generate unique ID
      };

      setWorkers(prev => [...prev, worker]);
    }

    // Reset form and close modal
    setNewWorker({
      firstName: '',
      lastName: '',
      position: 'Operator',
      phoneNumber: '',
      hireDate: '',
      status: 'Active',
      salary: 0
    });
    setIsModalOpen(false);
  };

  // Edit worker
  const editWorker = (worker: Worker) => {
    setEditingWorker({...worker});
    setIsModalOpen(true);
  };

  // Delete worker
  const deleteWorker = (workerId: string) => {
    // Confirm before deletion
    if (window.confirm('Are you sure you want to delete this worker?')) {
      setWorkers(prev => prev.filter(worker => worker.id !== workerId));
    }
  };

  // Sorting function
  const sortedWorkers = useMemo(() => {
    return [...workers].sort((a, b) => {
      const key = sortConfig.key;
      if (a[key] === undefined || b[key] === undefined) return 0; // Type guard to handle undefined keys
      if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [workers, sortConfig]);

  // Filtered and sorted workers
  const filteredWorkers = useMemo(() => {
    return sortedWorkers.filter(worker => {
      const matchesSearch = 
        worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.phoneNumber.includes(searchTerm);

      const matchesStatus = 
        !statusFilter || worker.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sortedWorkers, searchTerm, statusFilter]);

  // Handle sorting
  const handleSort = (key: keyof Worker) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="container mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Users className="text-white w-10 h-10" />
            <h1 className="text-3xl font-bold text-white">Personnel Management</h1>
          </div>
          <button 
            onClick={() => {
              setEditingWorker(null);
              setIsModalOpen(true);
            }}
            className="bg-white text-blue-600 hover:bg-blue-50 transition-colors duration-300 px-4 py-2 rounded-full flex items-center space-x-2 font-semibold"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Operator</span>
          </button>
        </div>

        {/* Workers Table */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {(['lastName', 'position', 'phoneNumber', 'status', 'salary', 'hireDate'] as (keyof Worker)[]).map((key) => (
                    <th 
                      key={key}
                      onClick={() => handleSort(key)}
                      className="py-4 px-4 text-left text-gray-600 font-semibold cursor-pointer hover:bg-gray-100 transition-colors duration-300 group"
                    >
                      <div className="flex items-center">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        <ChevronDown 
                          className={`ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                            sortConfig.key === key 
                              ? 'text-blue-600 opacity-100 ' + (sortConfig.direction === 'asc' ? 'rotate-180' : '') 
                              : 'text-gray-400'
                          }`} 
                        />
                      </div>
                    </th>
                  ))}
                  <th className="py-4 px-4 text-left text-gray-600 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="border-b hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-4 px-4">{`${worker.firstName} ${worker.lastName}`}</td>
                    <td className="py-4 px-4">{worker.position}</td>
                    <td className="py-4 px-4">{worker.phoneNumber}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${worker.status === 'Active' ? 'bg-green-100 text-green-700' : 
                          worker.status === 'Inactive' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'}`}>
                        {worker.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {worker.salary?.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      })}
                    </td>
                    <td className="py-4 px-4">{worker.hireDate}</td>
                    <td className="py-4 px-4 flex space-x-2">
                      <button
                        onClick={() => editWorker(worker)}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors duration-300"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteWorker(worker.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors duration-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredWorkers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-lg">No operators found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Adding/Editing Worker */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingWorker ? 'Edit Operator' : 'Add New Operator'}
                </h2>
              </div>
              <form className="p-6 space-y-6" onSubmit={(e) => {
                e.preventDefault();
                saveWorker();
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editingWorker ? editingWorker.firstName : newWorker.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={editingWorker ? editingWorker.lastName : newWorker.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={editingWorker ? editingWorker.phoneNumber : newWorker.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                    <input
                      type="number"
                      name="salary"
                      value={editingWorker ? editingWorker.salary : newWorker.salary}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
                    <input
                      type="date"
                      name="hireDate"
                      value={editingWorker ? editingWorker.hireDate : newWorker.hireDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={editingWorker ? editingWorker.status : newWorker.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-between space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2"
                  >
                    {editingWorker ? 'Update Operator' : 'Save Operator'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonnelManagement;