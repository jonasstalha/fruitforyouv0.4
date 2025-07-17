import React, { useState, useEffect } from 'react';
import { Save, FilePlus, RefreshCw, Check, Calendar, Package, User, Thermometer, Plus, Copy, X, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { firestore } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Production Lot Interface
interface ProductionLot {
  id: string;
  lotNumber: string;
  status: 'brouillon' | 'en_cours' | 'termine';
  formData: {
    headerData: {
      date: string;
      produit: string;
      numeroLotClient: string;
      typeProduction: string;
    };
    calibreData: { [key: string]: number };
    nombrePalettes: string;
    productionRows: Array<{
      numero: number;
      date: string;
      heure: string;
      calibre: string;
      poidsBrut: string;
      poidsNet: string;
      numeroLotInterne: string;
      variete: string;
      nbrCP: string;
      chambreFroide: string;
      decision: string;
    }>;
    visas: {
      controleurQualite: string;
      responsableQualite: string;
      directeurOperationnel: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const SuiviProduction = () => {
  // Multi-lot state management
  const [lots, setLots] = useState<ProductionLot[]>([]);
  const [currentLotId, setCurrentLotId] = useState<string>('');
  const [filteredRapports, setFilteredRapports] = useState<any[]>([]);

  // Legacy states for compatibility (now managed per lot)
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const varietesAvocat = [
    'Hass', 'Fuerte', 'Pinkerton', 'Reed', 'Zutano', 'Bacon', 'Gwen', 'Lamb Hass'
  ];

  const chambresFreides = [
    'CF-01', 'CF-02', 'CF-03', 'CF-04', 'CF-05', 'CF-06'
  ];

  const decisions = [
    'ACCEPTÉ', 'REFUSÉ', 'EN ATTENTE', 'CONDITIONNEL'
  ];

  // Helper functions for multi-lot management
  const getCurrentLot = (): ProductionLot | undefined => {
    return lots.find(lot => lot.id === currentLotId);
  };

  const getCurrentFormData = () => {
    const currentLot = getCurrentLot();
    return currentLot?.formData || {
      headerData: {
        date: format(new Date(), 'yyyy-MM-dd'),
        produit: 'AVOCAT',
        numeroLotClient: '',
        typeProduction: 'CONVENTIONNEL'
      },
      calibreData: {
        12: 0, 14: 0, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0
      },
      nombrePalettes: '',
      productionRows: Array.from({ length: 26 }, (_, index) => ({
        numero: index + 1,
        date: '',
        heure: '',
        calibre: '',
        poidsBrut: '',
        poidsNet: '',
        numeroLotInterne: '',
        variete: '',
        nbrCP: '',
        chambreFroide: '',
        decision: ''
      })),
      visas: {
        controleurQualite: '',
        responsableQualite: '',
        directeurOperationnel: ''
      }
    };
  };

  const updateCurrentLotData = (updates: Partial<ProductionLot['formData']>) => {
    setLots(prevLots => 
      prevLots.map(lot => 
        lot.id === currentLotId 
          ? { 
              ...lot, 
              formData: { ...lot.formData, ...updates },
              updatedAt: new Date().toISOString()
            }
          : lot
      )
    );
  };

  // Create new lot
  const createNewLot = () => {
    const newLotId = `lot_${Date.now()}`;
    const newLot: ProductionLot = {
      id: newLotId,
      lotNumber: `Lot ${lots.length + 1}`,
      status: 'brouillon',
      formData: {
        headerData: {
          date: format(new Date(), 'yyyy-MM-dd'),
          produit: 'AVOCAT',
          numeroLotClient: '',
          typeProduction: 'CONVENTIONNEL'
        },
        calibreData: {
          12: 0, 14: 0, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0
        },
        nombrePalettes: '',
        productionRows: Array.from({ length: 26 }, (_, index) => ({
          numero: index + 1,
          date: '',
          heure: '',
          calibre: '',
          poidsBrut: '',
          poidsNet: '',
          numeroLotInterne: '',
          variete: '',
          nbrCP: '',
          chambreFroide: '',
          decision: ''
        })),
        visas: {
          controleurQualite: '',
          responsableQualite: '',
          directeurOperationnel: ''
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLots(prev => [...prev, newLot]);
    setCurrentLotId(newLotId);
    
    // Save to localStorage
    const updatedLots = [...lots, newLot];
    localStorage.setItem('production_lots', JSON.stringify(updatedLots));
  };

  // Duplicate lot
  const duplicateLot = (lotId: string) => {
    const lotToDuplicate = lots.find(lot => lot.id === lotId);
    if (!lotToDuplicate) return;

    const newLotId = `lot_${Date.now()}`;
    const duplicatedLot: ProductionLot = {
      ...lotToDuplicate,
      id: newLotId,
      lotNumber: `${lotToDuplicate.lotNumber} (Copie)`,
      status: 'brouillon',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLots(prev => [...prev, duplicatedLot]);
    setCurrentLotId(newLotId);
    
    // Save to localStorage
    const updatedLots = [...lots, duplicatedLot];
    localStorage.setItem('production_lots', JSON.stringify(updatedLots));
  };

  // Delete lot
  const deleteLot = (lotId: string) => {
    if (lots.length <= 1) {
      alert('Vous ne pouvez pas supprimer le dernier lot');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
      const updatedLots = lots.filter(lot => lot.id !== lotId);
      setLots(updatedLots);
      
      // If current lot is deleted, switch to first available lot
      if (currentLotId === lotId) {
        setCurrentLotId(updatedLots[0]?.id || '');
      }
      
      // Save to localStorage
      localStorage.setItem('production_lots', JSON.stringify(updatedLots));
    }
  };

  // Update lot status
  const updateLotStatus = (lotId: string, status: ProductionLot['status']) => {
    setLots(prevLots => 
      prevLots.map(lot => 
        lot.id === lotId 
          ? { ...lot, status, updatedAt: new Date().toISOString() }
          : lot
      )
    );
    
    // Save to localStorage
    const updatedLots = lots.map(lot => 
      lot.id === lotId 
        ? { ...lot, status, updatedAt: new Date().toISOString() }
        : lot
    );
    localStorage.setItem('production_lots', JSON.stringify(updatedLots));
  };

  const handleHeaderChange = (field: string, value: string) => {
    updateCurrentLotData({
      headerData: {
        ...getCurrentFormData().headerData,
        [field]: value
      }
    });
  };

  const handleCalibreChange = (calibre: string, value: string) => {
    updateCurrentLotData({
      calibreData: {
        ...getCurrentFormData().calibreData,
        [calibre]: parseInt(value) || 0
      }
    });
  };

  const handleNombrePalettesChange = (value: string) => {
    updateCurrentLotData({
      nombrePalettes: value
    });
  };

  const handleRowChange = (rowIndex: number, field: string, value: string) => {
    const currentRows = getCurrentFormData().productionRows;
    const newRows = [...currentRows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [field]: value
    };
    
    updateCurrentLotData({
      productionRows: newRows
    });
  };

  const handleVisaChange = (field: string, value: string) => {
    updateCurrentLotData({
      visas: {
        ...getCurrentFormData().visas,
        [field]: value
      }
    });
  };

  const calculateTotals = () => {
    const currentData = getCurrentFormData();
    const totals = currentData.productionRows.reduce((acc, row) => {
      return {
        poidsBrut: acc.poidsBrut + (parseFloat(row.poidsBrut) || 0),
        poidsNet: acc.poidsNet + (parseFloat(row.poidsNet) || 0),
        nbrCP: acc.nbrCP + (parseInt(row.nbrCP) || 0)
      };
    }, { poidsBrut: 0, poidsNet: 0, nbrCP: 0 });

    return totals;
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const currentData = getCurrentFormData();
      const currentLot = getCurrentLot();
      
      // Import jsPDF dynamically
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Page dimensions and margins
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const contentWidth = pageWidth - (margin * 2);
      
      // Enhanced layout proportions with better spacing
      const headerHeight = 70;  // Enhanced header space
      const tableHeight = 150;  // Optimized table height
      const footerHeight = 60;  // Enhanced footer space
      
      // Professional color palette
      const colors = {
        primary: [46, 125, 50],      // Professional Green
        secondary: [129, 199, 132],   // Light Green
        accent: [27, 94, 32],        // Dark Green
        text: [33, 33, 33],          // Dark Gray
        lightText: [97, 97, 97],     // Medium Gray
        background: [248, 249, 250], // Light Background
        white: [255, 255, 255],      // White
        border: [224, 224, 224],     // Light Border
        headerBg: [200, 230, 201],   // Header Background
        tableBg: [232, 245, 233]     // Table Background
      };
      
      // Enhanced helper functions
      const drawRect = (x: number, y: number, w: number, h: number, fillColor?: number[], strokeColor?: number[], strokeWidth: number = 0.5) => {
        doc.setLineWidth(strokeWidth);
        if (fillColor) {
          doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        }
        if (strokeColor) {
          doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
        }
        doc.rect(x, y, w, h, fillColor ? 'FD' : 'S');
      };
      
      const drawText = (text: string, x: number, y: number, fontSize: number, color: number[] = colors.text, align: 'left' | 'center' | 'right' = 'left', fontStyle: 'normal' | 'bold' = 'normal') => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        if (fontStyle === 'bold') {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        doc.text(text, x, y, { align });
      };
      
      const drawBorder = (x: number, y: number, w: number, h: number, color: number[] = colors.border) => {
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.5);
        doc.rect(x, y, w, h, 'S');
      };
      
      // === ENHANCED HEADER SECTION ===
      let yPos = margin;
      
      // Main header with gradient effect simulation
      drawRect(margin, yPos, contentWidth, 35, colors.headerBg, colors.primary, 1);
      
      // Logo area with enhanced styling
      drawRect(margin + 5, yPos + 5, 25, 25, colors.white, colors.primary, 1);
      drawText('FRUITS', margin + 17.5, yPos + 15, 9, colors.primary, 'center', 'bold');
      drawText('FOR YOU', margin + 17.5, yPos + 22, 8, colors.primary, 'center', 'bold');
      
      // Main title with enhanced typography
      drawText('Suivi de la production', pageWidth / 2, yPos + 18, 18, colors.text, 'center', 'bold');
      drawText('AVOCAT', pageWidth / 2, yPos + 28, 16, colors.accent, 'center', 'bold');
      
      // Document info with better positioning
      const infoX = margin + contentWidth - 50;
      drawRect(infoX - 5, yPos + 3, 48, 29, colors.white, colors.border, 0.5);
      drawText('SMQ.ENR 23', infoX, yPos + 10, 9, colors.text, 'left', 'bold');
      drawText('Version : 01', infoX, yPos + 16, 8, colors.lightText);
      drawText('Date : 19/05/2023', infoX, yPos + 22, 8, colors.lightText);
      drawText(`Lot: ${currentLot?.lotNumber || 'N/A'}`, infoX, yPos + 28, 8, colors.primary, 'left', 'bold');
      
      yPos += 42;
      
      // Form information with enhanced layout
      drawRect(margin, yPos, contentWidth, 22, colors.background, colors.border, 0.5);
      
      // Three-column layout with better spacing
      const col1X = margin + 5;
      const col2X = margin + 68;
      const col3X = margin + 136;
      
      // Column 1 - Basic Info
      drawText('DATE :', col1X, yPos + 8, 10, colors.text, 'left', 'bold');
      drawText(currentData.headerData.date || 'N/A', col1X, yPos + 15, 10, colors.primary);
      
      // Column 2 - Product Info
      drawText('PRODUIT :', col2X, yPos + 8, 10, colors.text, 'left', 'bold');
      drawText(currentData.headerData.produit || 'N/A', col2X, yPos + 15, 10, colors.primary);
      
      // Column 3 - Lot Info
      drawText('N° LOT CLIENT :', col3X, yPos + 8, 10, colors.text, 'left', 'bold');
      drawText(currentData.headerData.numeroLotClient || 'N/A', col3X, yPos + 15, 10, colors.primary);
      
      // Production type with enhanced checkboxes
      const checkboxY = yPos + 8;
      drawText('☐', col1X, checkboxY + 12, 12, colors.primary);
      drawText('CONVENTIONNEL', col1X + 8, checkboxY + 12, 9, colors.text);
      drawText('☐', col2X, checkboxY + 12, 12, colors.primary);
      drawText('BIOLOGIQUE', col2X + 8, checkboxY + 12, 9, colors.text);
      
      const isConventionnel = currentData.headerData.typeProduction === 'CONVENTIONNEL';
      if (isConventionnel) {
        drawText('☑', col1X, checkboxY + 12, 12, colors.primary);
      } else {
        drawText('☑', col2X, checkboxY + 12, 12, colors.primary);
      }
      
      // === ENHANCED MAIN TABLE SECTION ===
      yPos += 30;
      
      // Table headers with enhanced styling
      const headers = ['N° P', 'La date', 'Heure', 'Calibre', 'Poids brut (Kg)', 'Poids net (Kg)', 'N° de lot Interne', 'Variété', 'Nbr De C/P', 'Chambre froide (DISTIN)', 'DÉCISION'];
      const colWidths = [14, 18, 14, 16, 20, 18, 24, 16, 16, 26, 20];
      
      // Enhanced table header
      drawRect(margin, yPos, contentWidth, 12, colors.tableBg, colors.primary, 1);
      
      let xStart = margin;
      headers.forEach((header, index) => {
        // Draw column separators
        if (index > 0) {
          doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
          doc.setLineWidth(0.5);
          doc.line(xStart, yPos, xStart, yPos + 12);
        }
        
        // Center text in column
        const textX = xStart + (colWidths[index] / 2);
        drawText(header, textX, yPos + 7, 8, colors.text, 'center', 'bold');
        xStart += colWidths[index];
      });
      
      // Right border for header
      doc.line(margin + contentWidth, yPos, margin + contentWidth, yPos + 12);
      
      yPos += 12;
      
      // Enhanced table rows (26 rows)
      const rowHeight = (tableHeight - 20) / 26; // Optimized row height
      
      for (let i = 0; i < 26; i++) {
        const rowY = yPos + (i * rowHeight);
        const row = currentData.productionRows[i];
        
        // Enhanced alternating row colors
        if (i % 2 === 0) {
          drawRect(margin, rowY, contentWidth, rowHeight, colors.background);
        } else {
          drawRect(margin, rowY, contentWidth, rowHeight, colors.white);
        }
        
        // Row data with better formatting
        xStart = margin;
        const rowData = [
          (i + 1).toString(),
          row?.date || '',
          row?.heure || '',
          row?.calibre || '',
          row?.poidsBrut || '',
          row?.poidsNet || '',
          row?.numeroLotInterne || '',
          row?.variete || '',
          row?.nbrCP || '',
          row?.chambreFroide || '',
          row?.decision || ''
        ];
        
        rowData.forEach((data, colIndex) => {
          // Draw column separators
          if (colIndex > 0) {
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.3);
            doc.line(xStart, rowY, xStart, rowY + rowHeight);
          }
          
          // Center text in column with proper spacing
          const textX = xStart + (colWidths[colIndex] / 2);
          const textY = rowY + (rowHeight / 2) + 1.5;
          
          // Special formatting for decision column
          if (colIndex === 10 && data) {
            const decisionColor = data === 'ACCEPTÉ' ? colors.primary : 
                                data === 'REFUSÉ' ? [211, 47, 47] : colors.text;
            drawText(data, textX, textY, 7, decisionColor, 'center', 'bold');
          } else {
            drawText(data, textX, textY, 7, colors.text, 'center');
          }
          
          xStart += colWidths[colIndex];
        });
        
        // Right border for row
        doc.line(margin + contentWidth, rowY, margin + contentWidth, rowY + rowHeight);
        
        // Bottom border for row
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, rowY + rowHeight, margin + contentWidth, rowY + rowHeight);
      }
      
      // Enhanced TOTAL row
      const totalY = yPos + (26 * rowHeight);
      drawRect(margin, totalY, contentWidth, rowHeight + 2, colors.tableBg, colors.primary, 1);
      
      const totals = calculateTotals();
      
      // Total labels and values with better positioning
      xStart = margin;
      const totalData = [
        'TOTAL',
        '',
        '',
        '',
        `${totals.poidsBrut.toFixed(2)}`,
        `${totals.poidsNet.toFixed(2)}`,
        '',
        '',
        `${totals.nbrCP}`,
        '',
        ''
      ];
      
      totalData.forEach((data, colIndex) => {
        if (colIndex > 0) {
          doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
          doc.setLineWidth(0.5);
          doc.line(xStart, totalY, xStart, totalY + rowHeight + 2);
        }
        
        if (data) {
          const textX = xStart + (colWidths[colIndex] / 2);
          const textY = totalY + (rowHeight / 2) + 2;
          drawText(data, textX, textY, 9, colors.text, 'center', 'bold');
        }
        
        xStart += colWidths[colIndex];
      });
      
      // Right border for total
      doc.line(margin + contentWidth, totalY, margin + contentWidth, totalY + rowHeight + 2);
      
      // === ENHANCED FOOTER SECTION ===
      yPos = headerHeight + tableHeight + 15;
      
      // Enhanced calibre table
      drawRect(margin, yPos, contentWidth, 22, colors.background, colors.border, 0.5);
      
      drawText('Calibre', margin + 5, yPos + 8, 10, colors.text, 'left', 'bold');
      drawText('Nombre des palettes', margin + 5, yPos + 16, 10, colors.text, 'left', 'bold');
      
      const calibres = ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'];
      const calibreWidth = 16;
      let calibreX = margin + 45;
      
      // Enhanced calibre grid
      calibres.forEach((calibre, index) => {
        // Calibre number cell
        drawRect(calibreX, yPos + 2, calibreWidth, 8, colors.white, colors.border, 0.5);
        drawText(calibre, calibreX + (calibreWidth / 2), yPos + 7, 8, colors.text, 'center', 'bold');
        
        // Calibre value cell
        drawRect(calibreX, yPos + 10, calibreWidth, 8, colors.white, colors.border, 0.5);
        const calibreValue = currentData.calibreData[calibre] || 0;
        drawText(calibreValue.toString(), calibreX + (calibreWidth / 2), yPos + 15, 8, colors.primary, 'center', 'bold');
        
        calibreX += calibreWidth;
      });
      
      // Enhanced signatures section
      yPos += 30;
      
      const sigWidth = 62;
      const sigHeight = 22;
      const sigSpacing = 5;
      
      // Signature boxes with enhanced styling
      const signatures = [
        { label: 'Visa contrôleur de Qualité :', value: currentData.visas.controleurQualite || '' },
        { label: 'VISA Responsable Qualité :', value: currentData.visas.responsableQualite || '' },
        { label: 'Visa Directeur opérationnel :', value: currentData.visas.directeurOperationnel || '' }
      ];
      
      signatures.forEach((sig, index) => {
        const sigX = margin + (index * (sigWidth + sigSpacing));
        
        // Signature box with shadow effect
        drawRect(sigX + 1, yPos + 1, sigWidth, sigHeight, [240, 240, 240]); // Shadow
        drawRect(sigX, yPos, sigWidth, sigHeight, colors.white, colors.border, 0.8);
        
        // Signature label
        drawText(sig.label, sigX + 2, yPos + 6, 8, colors.text, 'left', 'bold');
        
        // Signature value or line
        if (sig.value) {
          drawText(sig.value, sigX + 2, yPos + 16, 9, colors.primary, 'left', 'bold');
        } else {
          // Draw signature line
          doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
          doc.setLineWidth(0.5);
          doc.line(sigX + 2, yPos + 16, sigX + sigWidth - 2, yPos + 16);
        }
      });
      
      // Enhanced footer with generation info
      yPos += 30;
      drawRect(margin, yPos, contentWidth, 8, colors.background, colors.border, 0.3);
      const footerText = `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')} - Système de Gestion Qualité FRUITS FOR YOU`;
      drawText(footerText, pageWidth / 2, yPos + 5, 8, colors.lightText, 'center');
      
      // Save PDF with enhanced filename
      const fileName = `Suivi_Production_${currentLot?.lotNumber?.replace(/\s+/g, '_') || 'Lot'}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
      doc.save(fileName);
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const resetForm = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser ce lot? Toutes les données seront perdues.")) {
      const currentLot = getCurrentLot();
      if (!currentLot) return;

      const resetData = {
        headerData: {
          date: format(new Date(), 'yyyy-MM-dd'),
          produit: 'AVOCAT',
          numeroLotClient: '',
          typeProduction: 'CONVENTIONNEL'
        },
        calibreData: {
          12: 0, 14: 0, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0
        },
        nombrePalettes: '',
        productionRows: Array.from({ length: 26 }, (_, index) => ({
          numero: index + 1,
          date: '',
          heure: '',
          calibre: '',
          poidsBrut: '',
          poidsNet: '',
          numeroLotInterne: '',
          variete: '',
          nbrCP: '',
          chambreFroide: '',
          decision: ''
        })),
        visas: {
          controleurQualite: '',
          responsableQualite: '',
          directeurOperationnel: ''
        }
      };

      updateCurrentLotData(resetData);
    }
  };

  // Save current lot data and send to rapport section
  const handleSave = () => {
    const currentLot = getCurrentLot();
    if (!currentLot) return;

    // Update lot status to complete
    updateLotStatus(currentLot.id, 'termine');

    // Save to localStorage for rapport section
    const rapportData = {
      ...currentLot.formData,
      lotNumber: currentLot.lotNumber,
      savedAt: new Date().toISOString()
    };

    const existingRapports = JSON.parse(localStorage.getItem('production_rapports') || '[]');
    existingRapports.push(rapportData);
    localStorage.setItem('production_rapports', JSON.stringify(existingRapports));

    // Save lots to localStorage
    localStorage.setItem('production_lots', JSON.stringify(lots));

    alert('Lot sauvegardé avec succès et envoyé vers la section rapport!');
    
    // Update filtered rapports to show current lot
    setFilteredRapports([rapportData]);
  };

  // Save production data for public viewing (now to Firestore)
  const handleSavePublic = async () => {
    setIsSaving(true);
    setError('');
    try {
      const currentData = getCurrentFormData();
      const currentLot = getCurrentLot();
      
      const data = {
        lotData: currentLot,
        formData: currentData,
        savedAt: new Date().toISOString(),
      };
      // Use current lot ID as document ID
      await setDoc(doc(firestore, 'production_suivi', currentLot?.id || 'current'), data);
      alert('Production enregistrée et visible publiquement !');
    } catch (e: any) {
      setError('Erreur lors de la sauvegarde Firestore');
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved production data from localStorage and initialize first lot
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Load lots from localStorage
        const savedLots = localStorage.getItem('production_lots');
        if (savedLots) {
          const parsedLots = JSON.parse(savedLots);
          setLots(parsedLots);
          setCurrentLotId(parsedLots[0]?.id || '');
        } else {
          // Create initial lot if none exist
          const newLotId = `lot_${Date.now()}`;
          const newLot: ProductionLot = {
            id: newLotId,
            lotNumber: `Lot 1`,
            status: 'brouillon',
            formData: {
              headerData: {
                date: format(new Date(), 'yyyy-MM-dd'),
                produit: 'AVOCAT',
                numeroLotClient: '',
                typeProduction: 'CONVENTIONNEL'
              },
              calibreData: {
                12: 0, 14: 0, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0
              },
              nombrePalettes: '',
              productionRows: Array.from({ length: 26 }, (_, index) => ({
                numero: index + 1,
                date: '',
                heure: '',
                calibre: '',
                poidsBrut: '',
                poidsNet: '',
                numeroLotInterne: '',
                variete: '',
                nbrCP: '',
                chambreFroide: '',
                decision: ''
              })),
              visas: {
                controleurQualite: '',
                responsableQualite: '',
                directeurOperationnel: ''
              }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          setLots([newLot]);
          setCurrentLotId(newLotId);
          localStorage.setItem('production_lots', JSON.stringify([newLot]));
        }

        // Load rapports for display
        const savedRapports = localStorage.getItem('production_rapports');
        if (savedRapports) {
          setFilteredRapports(JSON.parse(savedRapports));
        }
      } catch (e: any) {
        console.error('LocalStorage load error:', e);
        setError('Erreur lors du chargement des données: ' + (e?.message || e));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Save lots to localStorage whenever lots change
  useEffect(() => {
    if (lots.length > 0) {
      localStorage.setItem('production_lots', JSON.stringify(lots));
    }
  }, [lots]);

  const totals = calculateTotals();
  const currentData = getCurrentFormData();
  const currentLot = getCurrentLot();

  if (loading) {
    return <div className="p-8 text-center text-lg text-gray-600">Chargement des données...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="bg-gradient-to-b from-green-50 to-white min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl p-6">
        {/* Lot Management Header */}
        <div className="bg-white border-b p-4 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Suivi de la production - Multi-lots</h1>
            <div className="flex gap-3">
              <button
                onClick={createNewLot}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
              >
                <Plus size={20} />
                Nouveau Lot
              </button>
            </div>
          </div>

          {/* Lot Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {lots.map((lot) => (
              <div key={lot.id} className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setCurrentLotId(lot.id)}
                  className={`px-4 py-2 flex items-center gap-2 transition-all ${
                    currentLotId === lot.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Package size={16} />
                  {lot.lotNumber}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    lot.status === 'termine' ? 'bg-green-200 text-green-800' :
                    lot.status === 'en_cours' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {lot.status}
                  </span>
                </button>
                
                {/* Lot Actions */}
                <div className="flex">
                  <button
                    onClick={() => duplicateLot(lot.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    title="Dupliquer"
                  >
                    <Copy size={16} />
                  </button>
                  {lots.length > 1 && (
                    <button
                      onClick={() => deleteLot(lot.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Display saved rapports for the current lot */}
        {filteredRapports.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-green-700 border-b pb-2">
              Rapports de production sauvegardés
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {filteredRapports.map((rapport, idx) => (
                <div key={idx} className="mb-4 p-4 border rounded-lg bg-gray-50 shadow-sm">
                  <div className="font-medium mb-2">
                    Date: {rapport.headerData?.date} | Produit: {rapport.headerData?.produit}
                  </div>
                  <div className="mb-2">Lot Client: {rapport.headerData?.numeroLotClient}</div>
                  <div className="text-sm text-gray-600">
                    Palettes: {rapport.nombrePalettes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-gray-200">
          <div className="space-y-4 w-full md:w-auto">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Suivi de la production</h1>
                <p className="text-lg font-semibold text-green-600">AVOCAT</p>
                <p className="text-sm text-gray-500 mt-1">
                  SMQ.ENR 23 - Version: 01 - Date: 19/05/2023
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl mt-6">
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={currentData.headerData.date}
                    onChange={(e) => handleHeaderChange('date', e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produit
                  </label>
                  <input
                    type="text"
                    value={currentData.headerData.produit}
                    onChange={(e) => handleHeaderChange('produit', e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° LOT CLIENT
                  </label>
                  <input
                    type="text"
                    value={currentData.headerData.numeroLotClient}
                    onChange={(e) => handleHeaderChange('numeroLotClient', e.target.value)}
                    placeholder="Entrer le numéro de lot client"
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre des palettes
                  </label>
                  <input
                    type="number"
                    value={currentData.nombrePalettes}
                    onChange={(e) => handleNombrePalettesChange(e.target.value)}
                    placeholder="Nombre de palettes"
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de production
                </label>
                <div className="space-y-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="CONVENTIONNEL"
                      checked={currentData.headerData.typeProduction === 'CONVENTIONNEL'}
                      onChange={(e) => handleHeaderChange('typeProduction', e.target.value)}
                      className="form-radio text-green-600 focus:ring-green-500 h-4 w-4"
                    />
                    <span className="ml-2">CONVENTIONNEL</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="BIOLOGIQUE"
                      checked={currentData.headerData.typeProduction === 'BIOLOGIQUE'}
                      onChange={(e) => handleHeaderChange('typeProduction', e.target.value)}
                      className="form-radio text-green-600 focus:ring-green-500 h-4 w-4"
                    />
                    <span className="ml-2">BIOLOGIQUE</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Calibre Section */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Calibres</h3>
              <div className="grid grid-cols-6 md:grid-cols-11 gap-3">
                {Object.keys(currentData.calibreData).map(calibre => (
                  <div key={calibre} className="text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {calibre}
                    </label>
                    <input
                      type="number"
                      value={currentData.calibreData[calibre]}
                      onChange={(e) => handleCalibreChange(calibre, e.target.value)}
                      className="w-full p-2 text-center rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-6 md:mt-0">
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none shadow-lg hover:shadow-xl"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></div>
                  Génération PDF...
                </>
              ) : (
                <>
                  <FilePlus size={20} />
                  Générer PDF
                </>
              )}
            </button>
            
            <button
              onClick={resetForm}
              className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <RefreshCw size={20} />
              Réinitialiser
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Save size={20} />
              Sauvegarder vers Rapport
            </button>
            <button
              onClick={handleSavePublic}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Save size={20} />
              Sauvegarder & Rendre Public
            </button>
          </div>
        </div>
        
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg animate-fade-in flex items-center">
            <div className="bg-green-100 rounded-full p-1 mr-3">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <span>PDF généré avec succès!</span>
          </div>
        )}
        
        {/* Production Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">N° P</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Date</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Heure</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Calibre</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Poids brut (Kg)</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Poids net (Kg)</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">N° lot Interne</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Variété</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Nbr C/P</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Chambre froide</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Décision</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.productionRows.map((row: any, rowIndex: number) => (
                  <tr key={rowIndex} 
                      className={`group hover:bg-green-50 transition-colors ${
                        rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      }`}>
                    <td className="px-3 py-2 border-r whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.numero}
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleRowChange(rowIndex, 'date', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="time"
                        value={row.heure}
                        onChange={(e) => handleRowChange(rowIndex, 'heure', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="text"
                        value={row.calibre}
                        onChange={(e) => handleRowChange(rowIndex, 'calibre', e.target.value)}
                        placeholder="ex: 14-16"
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="number"
                        value={row.poidsBrut}
                        onChange={(e) => handleRowChange(rowIndex, 'poidsBrut', e.target.value)}
                        step="0.1"
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="number"
                        value={row.poidsNet}
                        onChange={(e) => handleRowChange(rowIndex, 'poidsNet', e.target.value)}
                        step="0.1"
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="text"
                        value={row.numeroLotInterne}
                        onChange={(e) => handleRowChange(rowIndex, 'numeroLotInterne', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <select
                        value={row.variete}
                        onChange={(e) => handleRowChange(rowIndex, 'variete', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Sélectionner</option>
                        {varietesAvocat.map((variete) => (
                          <option key={variete} value={variete}>{variete}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="number"
                        value={row.nbrCP}
                        onChange={(e) => handleRowChange(rowIndex, 'nbrCP', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <select
                        value={row.chambreFroide}
                        onChange={(e) => handleRowChange(rowIndex, 'chambreFroide', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Sélectionner</option>
                        {chambresFreides.map((chambre) => (
                          <option key={chambre} value={chambre}>{chambre}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.decision}
                        onChange={(e) => handleRowChange(rowIndex, 'decision', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Sélectionner</option>
                        {decisions.map((decision) => (
                          <option key={decision} value={decision} className={
                            decision === 'ACCEPTÉ' ? 'text-green-600' : 
                            decision === 'REFUSÉ' ? 'text-red-600' : 'text-gray-600'
                          }>
                            {decision}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Totals and Visas */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Totals */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Totaux</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">TOTAL POIDS BRUT:</span>
                <span className="text-lg font-bold text-blue-600">{totals.poidsBrut.toFixed(2)} Kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">POIDS NET:</span>
                <span className="text-lg font-bold text-blue-600">{totals.poidsNet.toFixed(2)} Kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">NBR DE C/P:</span>
                <span className="text-lg font-bold text-blue-600">{totals.nbrCP}</span>
              </div>
            </div>
          </div>
          
          {/* Visas */}
          <div className="p-6 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Visas</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visa Directeur opérationnel
                </label>
                <input
                  type="text"
                  value={currentData.visas.directeurOperationnel}
                  onChange={(e) => handleVisaChange('directeurOperationnel', e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visa contrôleur de Qualité
                </label>
                <input
                  type="text"
                  value={currentData.visas.controleurQualite}
                  onChange={(e) => handleVisaChange('controleurQualite', e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VISA Responsable Qualité
                </label>
                <input
                  type="text"
                  value={currentData.visas.responsableQualite}
                  onChange={(e) => handleVisaChange('responsableQualite', e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-500">
            <Package className="h-4 w-4" />
            <span className="text-sm">Suivi de production automatique</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {currentData.productionRows.filter((r: any) => r.date || r.poidsBrut || r.poidsNet).length} entrées
            </div>
            <span className="text-sm text-gray-500">avec données</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuiviProduction;