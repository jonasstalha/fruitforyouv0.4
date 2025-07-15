import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  Save, 
  Eye,
  X,
  Plus,
  FileText,
  Scale,
  Target
} from 'lucide-react';

// Define the type for a lot/rapport - updated for new structure
interface QualityRapportLot {
  id: string;
  lotNumber: string;
  date: string;
  controller: string;
  palletNumber: string;
  calibres: (string | number)[];
  status: string;
  formData?: any;
  images?: File[];
  submittedAt?: string;
}

const LOCAL_STORAGE_KEY = 'quality_rapports';
const ARCHIVE_STORAGE_KEY = 'archived_reports';

const Rapportqualité = () => {
  const [submittedLots, setSubmittedLots] = useState<QualityRapportLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<QualityRapportLot | null>(null);
  const [selectedCalibre, setSelectedCalibre] = useState<string | number | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    calibre: '',
    lotId: ''
  });
  const [uploadedImages, setUploadedImages] = useState<Record<string | number, File[]>>({});
  const [testResults, setTestResults] = useState<Record<string | number, any>>({});
  const [inputMode, setInputMode] = useState<'manual' | 'image'>('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedRapports = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedRapports) {
      try {
        setSubmittedLots(JSON.parse(savedRapports));
      } catch (e) {
        setSubmittedLots([]);
      }
    } else {
      setSubmittedLots([]);
    }
  }, []);

  const filteredLots = submittedLots.filter((lot) => {
    const matchesDateFrom = !filters.dateFrom || lot.date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || lot.date <= filters.dateTo;
    const matchesCalibre = !filters.calibre || lot.calibres.some(cal => 
      String(cal).toLowerCase().includes(filters.calibre.toLowerCase())
    );
    const matchesLotId = !filters.lotId || 
      lot.id.toLowerCase().includes(filters.lotId.toLowerCase()) ||
      lot.lotNumber?.toLowerCase().includes(filters.lotId.toLowerCase());
    return matchesDateFrom && matchesDateTo && matchesCalibre && matchesLotId;
  });

  const handleImageUpload = (calibre: string | number | null, files: FileList | null) => {
    if (!calibre || !files) return;
    
    const fileArray = Array.from(files);
    if (fileArray.length > 12) {
      alert('Maximum 12 images allowed per calibre');
      return;
    }
    setUploadedImages(prev => ({
      ...prev,
      [calibre]: fileArray
    }));
  };

  const handleTestResultChange = (calibre: string | number | null, field: string, value: any) => {
    if (!calibre) return;
    
    setTestResults(prev => ({
      ...prev,
      [calibre]: {
        ...prev[calibre],
        [field]: value
      }
    }));
  };

  const handleTestImageUpload = (calibre: string | number | null, testType: string, file: File | null) => {
    if (!calibre || !file) return;
    
    setTestResults(prev => ({
      ...prev,
      [calibre]: {
        ...prev[calibre],
        [`${testType}_image`]: file
      }
    }));
  };

  const saveCaliberData = (calibre: string | number | null) => {
    if (!calibre) return;
    const images = uploadedImages[calibre] || [];
    const results = testResults[calibre] || {};
    if (images.length !== 12) {
      alert('Please upload exactly 12 images for this calibre');
      return;
    }
    if (inputMode === 'manual') {
      if (!results.poids || !results.firmness || !results.puree_image) {
        alert('Please complete all test results');
        return;
      }
    } else {
      if (!results.poids_image || !results.firmness_image || !results.puree_image) {
        alert('Please upload all test result images');
        return;
      }
    }
    // Save calibre data (could be extended to persist per lot)
    console.log('Saving calibre data:', { calibre, images, results });
    alert(`Data saved for calibre ${calibre}`);

    // Check if all calibres for the selected lot are complete
    if (selectedLot && Array.isArray(selectedLot.calibres)) {
      const allComplete = selectedLot.calibres.every((cal) => {
        const imgs = uploadedImages[cal] || [];
        const res = testResults[cal] || {};
        if (imgs.length !== 12) return false;
        if (inputMode === 'manual') {
          return res.poids && res.firmness && res.puree_image;
        } else {
          return res.poids_image && res.firmness_image && res.puree_image;
        }
      });
      if (allComplete) {
        // Archive the lot
        const archiveObj = {
          id: selectedLot.id,
          lotId: selectedLot.id,
          date: selectedLot.date,
          controller: selectedLot.controller,
          chief: 'N/A', // You can update this if you have chief info
          calibres: selectedLot.calibres,
          images: uploadedImages, // All images per calibre
          testResults: testResults, // All test results per calibre
          pdfController: null, // You can update this if you generate PDFs
          pdfChief: null, // You can update this if you generate PDFs
          status: 'Archived',
          submittedAt: new Date().toISOString(),
        };
        const prev = JSON.parse(localStorage.getItem(ARCHIVE_STORAGE_KEY) || '[]');
        // Avoid duplicate archive
        if (!prev.some((r: any) => r.lotId === archiveObj.lotId)) {
          prev.push(archiveObj);
          localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(prev));
          alert('Lot archived and available in Archive & PDF Management!');
        }
      }
    }
  };

  const updateLotStatus = (status: string) => {
    if (!selectedLot) return;
    // Here you would update the lot status in your backend
    console.log('Updating lot status:', selectedLot.id, status);
    setSelectedLot(prev => prev ? { ...prev, status } : prev);
    alert(`Lot ${selectedLot.id} marked as ${status}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-green-600 bg-green-100';
      case 'needs_revision':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4" />;
      case 'needs_revision':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  if (selectedCalibre && selectedLot) {
    const calibreImages = uploadedImages[selectedCalibre] || [];
    const calibreResults = testResults[selectedCalibre] || {};
    
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => setSelectedCalibre(null)}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2"
            >
              ← Back to Lot {selectedLot.id}
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Calibre {selectedCalibre} - Quality Control
            </h1>
            <p className="text-gray-600">Lot: {selectedLot.id} | Pallet: {selectedLot.palletNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Unit Images (12 required)
            </h3>
            
            <div className="mb-4">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(selectedCalibre, e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                Upload Images ({calibreImages.length}/12)
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {calibreImages.map((file, index) => (
                <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Unit ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {Array.from({ length: 12 - calibreImages.length }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Test Results Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Test Results
            </h3>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Input Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('manual')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    inputMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Manual Input
                </button>
                <button
                  onClick={() => setInputMode('image')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    inputMode === 'image'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Image Upload
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Poids (Weight) */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Poids (Weight)
                </label>
                {inputMode === 'manual' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="240"
                      value={calibreResults.poids || ''}
                      onChange={(e) => handleTestResultChange(selectedCalibre, 'poids', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">g</span>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTestImageUpload(selectedCalibre, 'poids', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>

              {/* Firmness */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Firmness
                </label>
                {inputMode === 'manual' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.7"
                      value={calibreResults.firmness || ''}
                      onChange={(e) => handleTestResultChange(selectedCalibre, 'firmness', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">kg/cm²</span>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTestImageUpload(selectedCalibre, 'firmness', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>

              {/* Purée (Always image) */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Purée Test Result (Image)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleTestImageUpload(selectedCalibre, 'puree', e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={() => saveCaliberData(selectedCalibre)}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              <Save className="w-4 h-4" />
              Save Calibre Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedLot) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => setSelectedLot(null)}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2"
            >
              ← Back to Lots
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Lot Details</h1>
            <p className="text-gray-600">Quality Control - Chief Phase</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => updateLotStatus('complete')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Complete
            </button>
            <button
              onClick={() => updateLotStatus('needs_revision')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <AlertCircle className="w-4 h-4" />
              Needs Revision
            </button>
          </div>
        </div>

        {/* Lot Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Lot Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Lot ID</label>
              <p className="text-lg font-semibold">{selectedLot.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date</label>
              <p className="text-lg font-semibold">{selectedLot.date}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Controller</label>
              <p className="text-lg font-semibold">{selectedLot.controller}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Pallet Number</label>
              <p className="text-lg font-semibold">{selectedLot.palletNumber}</p>
            </div>
          </div>
        </div>

        {/* Calibres */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Calibres</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.isArray(selectedLot.calibres) && selectedLot.calibres.length > 0 ? (
              selectedLot.calibres.map((calibre, idx) => {
                const images = uploadedImages[calibre] || [];
                const results = testResults[calibre] || {};
                const isComplete = images.length === 12 && 
                  (inputMode === 'manual' 
                    ? results.poids && results.firmness && results.puree_image
                    : results.poids_image && results.firmness_image && results.puree_image);
                return (
                  <button
                    key={calibre + '-' + idx}
                    onClick={() => setSelectedCalibre(calibre)}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    <div className="text-2xl font-bold mb-2">{calibre}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      Images: {images.length}/12
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isComplete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isComplete ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Complete
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full text-gray-500">No calibres</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Control - Chief Phase</h1>
          <p className="text-gray-600">Review and process submitted lots</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Calibre</label>
            <select
              value={filters.calibre}
              onChange={(e) => setFilters(prev => ({ ...prev, calibre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Calibres</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="22">22</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lot ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search lot ID..."
                value={filters.lotId}
                onChange={(e) => setFilters(prev => ({ ...prev, lotId: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lots Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Submitted Lots ({filteredLots.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Controller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pallet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calibres</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLots.map((lot) => (
                <tr key={lot.id || Math.random()} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {lot.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lot.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lot.controller}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lot.palletNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Array.isArray(lot.calibres) ? lot.calibres.map((cal, idx) => (
                      <span key={cal + '-' + idx}>{cal}{idx < lot.calibres.length - 1 ? ', ' : ''}</span>
                    )) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lot.status)}`}>
                      {getStatusIcon(lot.status)}
                      {typeof lot.status === 'string' ? lot.status.replace('_', ' ') : 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedLot(lot)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Rapportqualité;