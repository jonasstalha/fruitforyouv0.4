import { useState, useEffect } from 'react';
import { Calendar, Check, Filter } from 'lucide-react';

// Sample worker data
const workers = [
  { id: 1, name: "Ibrahim Jilali" },
  { id: 2, name: "Mohammed Alaoui" },
  { id: 3, name: "Fatima Benani" },
  { id: 4, name: "Ahmed Tazi" },
  { id: 5, name: "Salma Bakri" },
  { id: 6, name: "Youssef Mamoun" },
  { id: 7, name: "Karima Ziani" },
];

export default function Horaires() {
  const [selectedDate, setSelectedDate] = useState("");
  const [workerEntries, setWorkerEntries] = useState({});
  const [showCheckedOnly, setShowCheckedOnly] = useState(false);
  
  // Calculate total stats
  const totalWorkers = Object.values(workerEntries).filter(entry => entry.checked).length;
  const totalPay = Object.values(workerEntries)
    .filter(entry => entry.checked)
    .reduce((sum, entry) => sum + calculateSalary(entry.startTime, entry.endTime), 0);

  // Calculate salary based on hours worked
  const calculateSalary = (start, end) => {
    if (!start || !end) return 0;
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    if (minutes < 0) {
      hours--;
      minutes += 60;
    }
    
    const totalHours = hours + (minutes / 60);
    return Math.round(totalHours * 11);
  };

  // Update worker entry
  const updateWorkerEntry = (workerId, field, value) => {
    setWorkerEntries(prev => {
      const workerData = prev[workerId] || { startTime: "", endTime: "", checked: false };
      
      return {
        ...prev,
        [workerId]: {
          ...workerData,
          [field]: value
        }
      };
    });
  };

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    
    // Reset entries for new date (in real app, you'd fetch entries for the selected date)
    setWorkerEntries({});
  };

  // Filter workers based on the checked status
  const filteredWorkers = workers.filter(worker => {
    if (!showCheckedOnly) return true;
    return workerEntries[worker.id]?.checked;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-6">Pointage des Travailleurs</h1>
        
        {/* Date Picker */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center">
          <Calendar className="text-gray-500 mr-2" size={20} />
          <label htmlFor="date" className="mr-2 font-medium">📅 Date de travail :</label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {selectedDate && (
          <>
            {/* Filter Option */}
            <div className="flex items-center mb-4 justify-end">
              <div className="flex items-center cursor-pointer" onClick={() => setShowCheckedOnly(!showCheckedOnly)}>
                <Filter size={16} className="mr-1 text-gray-600" />
                <span className="text-sm text-gray-700">Afficher uniquement les travailleurs pointés</span>
                <div className={`ml-2 w-4 h-4 border rounded flex items-center justify-center ${showCheckedOnly ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                  {showCheckedOnly && <Check size={12} className="text-white" />}
                </div>
              </div>
            </div>
            
            {/* Worker Cards */}
            <div className="space-y-4">
              {filteredWorkers.map(worker => {
                const entry = workerEntries[worker.id] || { startTime: "", endTime: "", checked: false };
                const salary = calculateSalary(entry.startTime, entry.endTime);
                
                return (
                  <div key={worker.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold">👤 {worker.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label htmlFor={`start-${worker.id}`} className="block mb-1 text-gray-700">⏰ Début:</label>
                        <input
                          id={`start-${worker.id}`}
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => updateWorkerEntry(worker.id, 'startTime', e.target.value)}
                          placeholder="hh:mm"
                          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor={`end-${worker.id}`} className="block mb-1 text-gray-700">⏰ Fin:</label>
                        <input
                          id={`end-${worker.id}`}
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => updateWorkerEntry(worker.id, 'endTime', e.target.value)}
                          placeholder="hh:mm"
                          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-green-600 text-lg">🧮 Salaire: {salary} MAD</p>
                      <button 
                        className={`flex items-center ${entry.checked ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'} px-4 py-2 rounded-md transition-colors`}
                        onClick={() => updateWorkerEntry(worker.id, 'checked', !entry.checked)}
                      >
                        <Check size={16} className="mr-1" />
                        {entry.checked ? 'Pointé' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Summary Section */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Résumé du jour:</h3>
              <div className="flex justify-between">
                <p>Total travailleurs pointés: <span className="font-bold">{totalWorkers}</span></p>
                <p>Total payé ce jour: <span className="font-bold text-green-600">{totalPay} MAD</span></p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}