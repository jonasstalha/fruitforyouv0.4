import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Calendar, 
  User, 
  Wrench, 
  Hash,
  FileText,
  Plus,
  RotateCcw,
  Check,
  AlertTriangle,
  Archive
} from 'lucide-react';

const ARCHIVE_STORAGE_KEY = 'archived_reports';

// Add a type for archived reports
interface ArchivedReport {
  id: string;
  lotId: string;
  date: string;
  controller: string;
  chief: string;
  calibres: (string | number)[];
  images?: Record<string, any>;
  testResults?: Record<string, any>;
  pdfController?: string | null;
  pdfChief?: string | null;
  status: string;
  submittedAt: string;
}

const Archivagedescontroles = () => {
  const [reports, setReports] = useState<ArchivedReport[]>([]);
  // State management
  const [filteredReports, setFilteredReports] = useState(reports);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    controller: '',
    chief: '',
    calibre: '',
    status: ''
  });
  const [editingReport, setEditingReport] = useState<ArchivedReport | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Load archived reports from localStorage on mount
  useEffect(() => {
    const archived = JSON.parse(localStorage.getItem(ARCHIVE_STORAGE_KEY) || '[]');
    setReports(archived);
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = reports;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.lotId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.controller.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.chief.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.calibres.some(cal => cal.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply filters
    if (filters.dateStart) {
      filtered = filtered.filter(report => report.date >= filters.dateStart);
    }
    if (filters.dateEnd) {
      filtered = filtered.filter(report => report.date <= filters.dateEnd);
    }
    if (filters.controller) {
      filtered = filtered.filter(report => 
        report.controller.toLowerCase().includes(filters.controller.toLowerCase())
      );
    }
    if (filters.chief) {
      filtered = filtered.filter(report => 
        report.chief.toLowerCase().includes(filters.chief.toLowerCase())
      );
    }
    if (filters.calibre) {
      filtered = filtered.filter(report => 
        report.calibres.some(cal => cal.toLowerCase().includes(filters.calibre.toLowerCase()))
      );
    }
    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    setFilteredReports(filtered);
  }, [searchTerm, filters, reports]);

  // Handle edit
  const handleEdit = (report: ArchivedReport) => {
    setEditingReport({ ...report });
  };

  // Save edited report
  const saveEdit = () => {
    setReports((prev: ArchivedReport[]) => prev.map(report =>
      editingReport && report.id === editingReport.id ? editingReport : report
    ));
    setEditingReport(null);
  };

  // Handle delete
  const handleDelete = (reportId: string) => {
    setReports((prev: ArchivedReport[]) => prev.filter(report => report.id !== reportId));
    setDeleteConfirm(null);
  };

  // Handle PDF download/view
  const handlePdfAction = (pdfName: string, action: string) => {
    // In real app, this would download/view the actual PDF
    console.log(`${action} PDF: ${pdfName}`);
    alert(`${action}: ${pdfName}`);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusProps = (status: string) => {
      switch (status) {
        case 'Completed':
          return {
            bg: 'bg-green-100',
            text: 'text-green-800',
            icon: <Check className="w-3 h-3" />
          };
        case 'Incomplete':
          return {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            icon: <AlertTriangle className="w-3 h-3" />
          };
        case 'Archived':
          return {
            bg: 'bg-gray-100',
            text: 'text-gray-800',
            icon: <Archive className="w-3 h-3" />
          };
        default:
          return {
            bg: 'bg-gray-100',
            text: 'text-gray-800',
            icon: null
          };
      }
    };

    const props = getStatusProps(status);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${props.bg} ${props.text}`}>
        {props.icon}
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Archive className="w-8 h-8 text-blue-600" />
                Archive & PDF Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and access all controller and chief reports with advanced filtering
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{filteredReports.length}</p>
              <p className="text-sm text-gray-500">Total Reports</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Search Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Lot ID, Controller, Chief, or Calibre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg border transition-colors flex items-center gap-2 ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date Start
                  </label>
                  <input
                    type="date"
                    value={filters.dateStart}
                    onChange={(e) => setFilters(prev => ({...prev, dateStart: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date End
                  </label>
                  <input
                    type="date"
                    value={filters.dateEnd}
                    onChange={(e) => setFilters(prev => ({...prev, dateEnd: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Controller
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by controller"
                    value={filters.controller}
                    onChange={(e) => setFilters(prev => ({...prev, controller: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Wrench className="w-4 h-4 inline mr-1" />
                    Chief
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by chief"
                    value={filters.chief}
                    onChange={(e) => setFilters(prev => ({...prev, chief: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Calibre
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by calibre"
                    value={filters.calibre}
                    onChange={(e) => setFilters(prev => ({...prev, calibre: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Incomplete">Incomplete</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setFilters({
                    dateStart: '', dateEnd: '', controller: '', chief: '', calibre: '', status: ''
                  })}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lot ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Controller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chief
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calibres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDF Controller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDF Chief
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.lotId}</div>
                      <div className="text-xs text-gray-500">Submitted: {report.submittedAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{report.controller}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Wrench className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{report.chief}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {report.calibres.map((calibre, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {calibre}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.pdfController ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePdfAction(report.pdfController, 'View')}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">View</span>
                          </button>
                          <button
                            onClick={() => handlePdfAction(report.pdfController, 'Download')}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            <span className="text-xs">DL</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs">Missing</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.pdfChief ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePdfAction(report.pdfChief, 'View')}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">View</span>
                          </button>
                          <button
                            onClick={() => handlePdfAction(report.pdfChief, 'Download')}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            <span className="text-xs">DL</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs">Missing</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(report)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(report.id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Report Metadata</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lot ID</label>
                  <input
                    type="text"
                    value={editingReport.lotId}
                    onChange={(e) => setEditingReport(prev => ({...prev, lotId: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Controller</label>
                  <input
                    type="text"
                    value={editingReport.controller}
                    onChange={(e) => setEditingReport(prev => ({...prev, controller: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chief</label>
                  <input
                    type="text"
                    value={editingReport.chief}
                    onChange={(e) => setEditingReport(prev => ({...prev, chief: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingReport.status}
                    onChange={(e) => setEditingReport(prev => ({...prev, status: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Incomplete">Incomplete</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveEdit}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingReport(null)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Report</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this report? This action will permanently remove 
                the report and its associated PDFs from the system. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Report
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Archivagedescontroles;