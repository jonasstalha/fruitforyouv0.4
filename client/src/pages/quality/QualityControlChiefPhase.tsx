import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Eye, 
  FileText, 
  AlertTriangle, 
  Clock,
  User,
  Calendar,
  Package,
  Award,
  MapPin,
  Calendar as CalendarIcon,
  ExternalLink
} from 'lucide-react';
import { qualityControlService } from '../../lib/qualityControlService';
import { useAuth } from '../../hooks/use-auth';
import { useToast } from '../../hooks/use-toast';

interface QualityControlLot {
  id: string;
  lotId: string;
  productName: string;
  productType: string;
  weight: number;
  packagingType: string;
  harvestDate: Date;
  expiryDate: Date;
  temperature: number;
  humidity: number;
  visualCheck: string;
  firmness: string;
  colorCheck: string;
  defectsNotes: string;
  pestResidues: string;
  microbiological: string;
  nutritionalValue: string;
  overallQuality: string;
  batchNumber: string;
  supplierName: string;
  farmLocation: string;
  certifications: string[];
  images: string[];
  controlledBy: string;
  controlDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  chiefNotes?: string;
  chiefApprovalDate?: Date;
  chiefApprovedBy?: string;
}

const QualityControlChiefPhase: React.FC = () => {
  const [lots, setLots] = useState<QualityControlLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingLot, setProcessingLot] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<QualityControlLot | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [chiefNotes, setChiefNotes] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadPendingLots();
  }, []);

  const loadPendingLots = async () => {
    try {
      setLoading(true);
      
      // Get all quality control lots with pending status
      const pendingLots = await qualityControlService.getQualityControlLots();
      const filteredLots = pendingLots.filter(lot => lot.status === 'pending');
      
      setLots(filteredLots);
    } catch (error) {
      console.error('Error loading pending lots:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les lots en attente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (lotId: string, approved: boolean) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Utilisateur non authentifié",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingLot(lotId);

      const lot = lots.find(l => l.id === lotId);
      if (!lot) {
        throw new Error('Lot non trouvé');
      }

      // Update lot status
      const updatedLot = {
        ...lot,
        status: approved ? 'approved' : 'rejected' as const,
        chiefNotes,
        chiefApprovalDate: new Date(),
        chiefApprovedBy: user.uid
      };

      await qualityControlService.updateQualityControlLot(lotId, updatedLot);

      // Update local state
      setLots(lots.filter(l => l.id !== lotId));
      setSelectedLot(null);
      setChiefNotes('');

      toast({
        title: "Succès",
        description: `Lot ${approved ? 'approuvé' : 'rejeté'} avec succès`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement de l'approbation",
        variant: "destructive",
      });
    } finally {
      setProcessingLot(null);
    }
  };

  const openImageModal = (lot: QualityControlLot, imageIndex: number) => {
    setSelectedLot(lot);
    setSelectedImageIndex(imageIndex);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedLot(null);
    setSelectedImageIndex(0);
  };

  const getQualityBadgeColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'bon':
        return 'bg-blue-100 text-blue-800';
      case 'acceptable':
        return 'bg-yellow-100 text-yellow-800';
      case 'mauvais':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Validation Chef - Contrôle Qualité
        </h1>
        <p className="text-gray-600">
          Lots en attente de validation par le chef de qualité
        </p>
      </div>

      {lots.length === 0 ? (
        <div className="text-center py-12">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun lot en attente
          </h3>
          <p className="text-gray-500">
            Tous les lots ont été traités
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {lots.map((lot) => (
            <div key={lot.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {lot.productName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Lot: {lot.lotId} | Batch: {lot.batchNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityBadgeColor(lot.overallQuality)}`}>
                      {lot.overallQuality}
                    </span>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Contrôlé par: {lot.controlledBy}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(lot.controlDate)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {lot.farmLocation}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Poids</p>
                    <p className="text-sm font-medium">{lot.weight} kg</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Température</p>
                    <p className="text-sm font-medium">{lot.temperature}°C</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Humidité</p>
                    <p className="text-sm font-medium">{lot.humidity}%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Emballage</p>
                    <p className="text-sm font-medium">{lot.packagingType}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Contrôles effectués</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">Contrôle visuel</p>
                      <p className="text-sm text-blue-800">{lot.visualCheck}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-600 mb-1">Fermeté</p>
                      <p className="text-sm text-green-800">{lot.firmness}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-purple-600 mb-1">Couleur</p>
                      <p className="text-sm text-purple-800">{lot.colorCheck}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-xs text-yellow-600 mb-1">Résidus pesticides</p>
                      <p className="text-sm text-yellow-800">{lot.pestResidues}</p>
                    </div>
                  </div>
                </div>

                {lot.defectsNotes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Notes sur les défauts</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {lot.defectsNotes}
                    </p>
                  </div>
                )}

                {lot.images && lot.images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Images</h4>
                    <div className="flex space-x-2">
                      {lot.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Contrôle ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageModal(lot, index)}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                            <Eye className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes du chef
                  </label>
                  <textarea
                    value={chiefNotes}
                    onChange={(e) => setChiefNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Ajouter des notes sur cette validation..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleApproval(lot.id, false)}
                    disabled={processingLot === lot.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4" />
                    <span>Rejeter</span>
                  </button>
                  <button
                    onClick={() => handleApproval(lot.id, true)}
                    disabled={processingLot === lot.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approuver</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedLot && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Image {selectedImageIndex + 1} - {selectedLot.productName}
              </h3>
              <button
                onClick={closeImageModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedLot.images[selectedImageIndex]}
                alt={`Contrôle ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
            <div className="flex justify-between items-center p-4 border-t">
              <button
                onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                disabled={selectedImageIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Précédent</span>
              </button>
              <span className="text-sm text-gray-600">
                {selectedImageIndex + 1} / {selectedLot.images.length}
              </span>
              <button
                onClick={() => setSelectedImageIndex(Math.min(selectedLot.images.length - 1, selectedImageIndex + 1))}
                disabled={selectedImageIndex === selectedLot.images.length - 1}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Suivant</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityControlChiefPhase;
