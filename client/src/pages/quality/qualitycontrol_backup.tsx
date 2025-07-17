import React, { useState, useEffect } from 'react';
import { Save, FileText, AlertTriangle, Check, X, Plus, Trash2, Copy, SplitSquareHorizontal } from 'lucide-react';
import { jsPDF } from "jspdf"; // Import jsPDF for PDF generation
// Extend PaletteData to support dynamic keys for columns
import logo from '../../../assets/icon.png';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface PaletteData {
  [key: string]: string | undefined;
  firmness: string;
  rotting: string;
  foreignMatter: string;
  withered: string;
  hardenedEndoderm: string;
  parasitePresence: string;
  parasiteAttack: string;
  temperature: string;
  odorOrTaste: string;
  packageWeight: string;
  shapeDefect: string;
  colorDefect: string;
  epidermisDefect: string;
  homogeneity: string;
  missingBrokenGrains: string;
  size: string;
  packageCount: string;
  packagingState: string;
  labelingPresence: string;
  corners: string;
  horizontalStraps: string;
  paletteSheet: string;
  woodenPaletteState: string;
  grossWeight: string;
  netWeight: string;
  internalLotNumber: string;
  paletteConformity: string;
  requiredNetWeight: string;
}

interface FormData {
  date: string;
  product: string;
  variety: string;
  campaign: string;
  clientLot: string;
  shipmentNumber: string;
  packagingType: string;
  category: string;
  exporterNumber: string;
  frequency: string;
  palettes: PaletteData[];
  tolerance?: {
    minCharacteristic?: string;
    category1Defects?: string;
    category2Defects?: string;
    category3Defects?: string;
    category4Defects?: string;
    minCharacteristicConform?: boolean;
    category1DefectsConform?: boolean;
    category2DefectsConform?: boolean;
    category3DefectsConform?: boolean;
  };
}

interface QualityControlLot {
  id: string;
  lotNumber: string;
  formData: FormData;
  images: File[];
  status: 'draft' | 'completed' | 'submitted';
  createdAt: string;
  updatedAt: string;
}

const emptyPaletteData = (): PaletteData => ({
  firmness: '',
  rotting: '',
  foreignMatter: '',
  withered: '',
  hardenedEndoderm: '',
  parasitePresence: '',
  parasiteAttack: '',
  temperature: '',
  odorOrTaste: '',
  packageWeight: '',
  shapeDefect: '',
  colorDefect: '',
  epidermisDefect: '',
  homogeneity: '',
  missingBrokenGrains: '',
  size: '',
  packageCount: '',
  packagingState: '',
  labelingPresence: '',
  corners: '',
  horizontalStraps: '',
  paletteSheet: '',
  woodenPaletteState: '',
  grossWeight: '',
  netWeight: '',
  internalLotNumber: '',
  paletteConformity: '',
  requiredNetWeight: ''
});

const initializeFormData = (): FormData => ({
  date: new Date().toISOString().split('T')[0],
  product: '',
  variety: '',
  campaign: '2024-2025',
  clientLot: '',
  shipmentNumber: '',
  packagingType: '',
  category: 'I',
  exporterNumber: '106040',
  frequency: '1 Carton/palette',
  palettes: Array(5).fill(null).map(() => emptyPaletteData())
});

export default function EnhancedPDFGenerator() {
  const [lots, setLots] = useState<QualityControlLot[]>([]);
  const [activeLotId, setActiveLotId] = useState<string | null>(null);
  const [paletteCount, setPaletteCount] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [results, setResults] = useState({
    minCharacteristics: 0,
    totalDefects: 0,
    missingBrokenGrains: 0,
    weightConformity: 0,
    isConform: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [filteredRapports, setFilteredRapports] = useState<FormData[]>([]);
  const [validation, setValidation] = useState<{[key:string]: string}>({});
  const [lotImages, setLotImages] = useState<{[lotId: string]: File[]}>({});

  // Get current lot data
  const getCurrentLot = (): QualityControlLot | null => {
    return lots.find(lot => lot.id === activeLotId) || null;
  };

  // Get current form data
  const getCurrentFormData = (): FormData => {
    const currentLot = getCurrentLot();
    return currentLot?.formData || initializeFormData();
  };

  // Create a new lot
  const createNewLot = () => {
    const newLot: QualityControlLot = {
      id: `lot-${Date.now()}`,
      lotNumber: `LOT-${String(lots.length + 1).padStart(3, '0')}`,
      formData: initializeFormData(),
      images: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setLots(prev => [...prev, newLot]);
    setActiveLotId(newLot.id);
    setLotImages(prev => ({ ...prev, [newLot.id]: [] }));
  };

  // Initialize with first lot
  useEffect(() => {
    if (lots.length === 0) {
      createNewLot();
    }
  }, []);

  // Duplicate a lot
  const duplicateLot = (lotId: string) => {
    const sourceLot = lots.find(lot => lot.id === lotId);
    if (!sourceLot) return;

    const newLot: QualityControlLot = {
      id: `lot-${Date.now()}`,
      lotNumber: `LOT-${String(lots.length + 1).padStart(3, '0')}`,
      formData: { ...sourceLot.formData },
      images: [...sourceLot.images],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLots(prev => [...prev, newLot]);
    setActiveLotId(newLot.id);
    setLotImages(prev => ({ ...prev, [newLot.id]: [...(lotImages[lotId] || [])] }));
  };

  // Delete a lot
  const deleteLot = (lotId: string) => {
    if (lots.length <= 1) {
      alert('Vous devez avoir au moins un lot.');
      return;
    }

    setLots(prev => prev.filter(lot => lot.id !== lotId));
    setLotImages(prev => {
      const newImages = { ...prev };
      delete newImages[lotId];
      return newImages;
    });

    if (activeLotId === lotId) {
      const remainingLots = lots.filter(lot => lot.id !== lotId);
      setActiveLotId(remainingLots[0]?.id || null);
    }
  };

  // Update lot data
  const updateLotData = (lotId: string, updates: Partial<QualityControlLot>) => {
    setLots(prev => prev.map(lot => 
      lot.id === lotId 
        ? { ...lot, ...updates, updatedAt: new Date().toISOString() }
        : lot
    ));
  };

  const tabTitles = [
    "Basic Info",
    "Controle poids",
    "Controle des Caracteristiques minimales",
    "Controle des parametres categorie I",
    "Controle produit fini",
    "Tolerance",
  ];

  // Update current lot's form data
  const updateCurrentLotFormData = (updates: Partial<FormData>) => {
    if (!activeLotId) return;
    
    const currentLot = getCurrentLot();
    if (!currentLot) return;

    const updatedFormData = { ...currentLot.formData, ...updates };
    updateLotData(activeLotId, { formData: updatedFormData });
  };

  useEffect(() => {
    const currentLot = getCurrentLot();
    if (!currentLot) return;

    const currentFormData = currentLot.formData;
    if (paletteCount > currentFormData.palettes.length) {
      const newPalettes = [...currentFormData.palettes];
      for (let i = currentFormData.palettes.length; i < paletteCount; i++) {
        newPalettes.push(emptyPaletteData());
      }
      updateCurrentLotFormData({ palettes: newPalettes });
    } else if (paletteCount < currentFormData.palettes.length) {
      updateCurrentLotFormData({ 
        palettes: currentFormData.palettes.slice(0, paletteCount) 
      });
    }
  }, [paletteCount, activeLotId]);

  useEffect(() => {
    calculateResults();
  }, [lots, activeLotId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    const currentFormData = getCurrentFormData();
    const keys = field.split('.');
    
    if (keys.length === 2) {
      updateCurrentLotFormData({
        tolerance: {
          ...currentFormData.tolerance,
          [keys[1]]: value
        }
      });
    } else {
      updateCurrentLotFormData({ [field]: value });
    }
  };

  const handlePaletteChange = (rowIndex: number, field: string, value: string) => {
    const currentFormData = getCurrentFormData();
    const updatedPalettes = [...currentFormData.palettes];
    if (!updatedPalettes[rowIndex]) {
      updatedPalettes[rowIndex] = {} as PaletteData;
    }
    updatedPalettes[rowIndex][field] = value;
    updateCurrentLotFormData({ palettes: updatedPalettes });
  };

  const calculateResults = () => {
    const currentFormData = getCurrentFormData();
    let totalMinCharacteristics = 0;
    let totalCategoryDefects = 0;
    let totalMissingGrains = 0;
    let totalWeightConformity = 0;
    let validPalettes = 0;

    currentFormData.palettes.forEach(palette => {
      if (palette.rotting || palette.foreignMatter || palette.parasitePresence) {
        validPalettes++;
        
        const minCharacteristics = sum([
          parseFloat(palette.rotting || '0'),
          parseFloat(palette.foreignMatter || '0'),
          parseFloat(palette.withered || '0'),
          parseFloat(palette.hardenedEndoderm || '0'),
          parseFloat(palette.parasitePresence || '0'),
          parseFloat(palette.parasiteAttack || '0')
        ]);
        totalMinCharacteristics += minCharacteristics;
        
        const categoryDefects = sum([
          parseFloat(palette.shapeDefect || '0'),
          parseFloat(palette.colorDefect || '0'),
          parseFloat(palette.epidermisDefect || '0')
        ]);
        totalCategoryDefects += categoryDefects;
        
        totalMissingGrains += parseFloat(palette.missingBrokenGrains || '0');
        
        if (palette.packageWeight && palette.requiredNetWeight) {
          const requiredWeight = parseFloat(palette.requiredNetWeight);
          const actualWeight = parseFloat(palette.packageWeight);
          const weightConformity = (actualWeight - requiredWeight) / requiredWeight * 100;
          totalWeightConformity += weightConformity;
        }
      }
    });
    
    if (validPalettes > 0) {
      const avgMinCharacteristics = totalMinCharacteristics / validPalettes;
      const avgCategoryDefects = totalCategoryDefects / validPalettes;
      const avgTotalDefects = avgMinCharacteristics + avgCategoryDefects;
      const avgMissingGrains = totalMissingGrains / validPalettes;
      const avgWeightConformity = totalWeightConformity / validPalettes;
      
      const isConform = 
        avgMinCharacteristics <= 10 && 
        avgTotalDefects <= 10 && 
        avgMissingGrains <= 10 && 
        avgWeightConformity >= 1;
      
      setResults({
        minCharacteristics: avgMinCharacteristics,
        totalDefects: avgTotalDefects,
        missingBrokenGrains: avgMissingGrains,
        weightConformity: avgWeightConformity,
        isConform
      });
    }
  };

  const sum = (values: number[]): number => {
    return values.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
  };

  const calculateAverages = (field: string): string => {
    const currentFormData = getCurrentFormData();
    const validValues = currentFormData.palettes
      .map((palette: PaletteData) => parseFloat(palette[field] as string))
      .filter((val: number) => !isNaN(val) && val !== 0);
    
    if (validValues.length === 0) return '';
    
    const average = validValues.reduce((sum: number, val: number) => sum + val, 0) / validValues.length;
    return average.toFixed(2);
  };

  // Enhanced text wrapping function
  const wrapText = (doc: jsPDF, text: string, maxWidth: number, fontSize: number = 7): string[] => {
    doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = doc.getTextWidth(testLine);
      
      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Enhanced table drawing function
  const drawEnhancedTable = (
    doc: jsPDF,
    startY: number,
    headers: string[],
    data: (string | number)[][],
    hasAverageColumn: boolean = true,
    solidGreen: boolean = false,
    customTableWidth: number | null = null
  ) => {
    let currentY = startY;
    const rowHeight = 8; // Increased for better text fit
    const pageWidth = doc.internal.pageSize.getWidth();
    const tableWidth = customTableWidth ?? (pageWidth - 20);
    // Color scheme
    const headerBg: [number, number, number] = [230, 230, 230];
    const lightCol: [number, number, number] = [245, 245, 245];
    const alternateRow: [number, number, number] = [248, 248, 248];
    const borderColor: [number, number, number] = [64, 64, 64];
    const moyenneGreen: [number, number, number] = [144, 238, 144]; // light green
    // Calculate responsive column widths
    let columnWidths;
    if (hasAverageColumn) {
      const firstColWidth = 60;
      const avgColWidth = 25;
      const remainingWidth = tableWidth - firstColWidth - avgColWidth;
      const dataColWidth = remainingWidth / (headers.length - 2);
      columnWidths = [firstColWidth, ...Array(headers.length - 2).fill(dataColWidth), avgColWidth];
    } else {
      const equalWidth = tableWidth / headers.length;
      columnWidths = Array(headers.length).fill(equalWidth);
    }
    // Draw header
    doc.setFillColor(...headerBg);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(10, currentY, tableWidth, rowHeight, 'FD');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let currentX = 10;
    headers.forEach((header, index) => {
      if (index === headers.length - 1 && hasAverageColumn) {
        doc.setFillColor(...moyenneGreen); // Always green for Moyenne column
        doc.rect(currentX, currentY, columnWidths[index], rowHeight, 'F');
        doc.setTextColor(0, 0, 0);
        const textWidth = doc.getTextWidth(header);
        doc.text(header, currentX + (columnWidths[index] / 2) - (textWidth / 2), currentY + 5.5);
        doc.setTextColor(0, 0, 0);
      } else {
        const textWidth = doc.getTextWidth(header);
        doc.text(header, currentX + (columnWidths[index] / 2) - (textWidth / 2), currentY + 5.5);
      }
      if (index > 0) {
        doc.line(currentX, currentY, currentX, currentY + rowHeight);
      }
      currentX += columnWidths[index];
    });
    doc.line(currentX, currentY, currentX, currentY + rowHeight);
    currentY += rowHeight;
    // Draw data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    data.forEach((row: (string | number)[], rowIndex: number) => {
      // Highlight 'Moyenne' row green
      const isMoyenne = typeof row[0] === 'string' && row[0].toLowerCase().includes('moyenne');
      const shouldFill = isMoyenne ? true : rowIndex % 2 === 1;
      if (shouldFill) {
        doc.setFillColor(...(isMoyenne ? moyenneGreen : alternateRow));
        doc.rect(10, currentY, tableWidth, rowHeight, 'F');
      }
      let currentX = 10;
      row.forEach((cell: string | number, cellIndex: number) => {
        doc.setTextColor(0, 0, 0);
        // Always fill Moyenne column green
        if (cellIndex === row.length - 1 && hasAverageColumn) {
          doc.setFillColor(...moyenneGreen);
          doc.rect(currentX, currentY, columnWidths[cellIndex], rowHeight, 'F');
          doc.setFont('helvetica', isMoyenne ? 'bold' : 'normal');
        } else {
          doc.setFont('helvetica', isMoyenne ? 'bold' : 'normal');
        }
        let cellText = '';
        if (typeof cell === 'string' || typeof cell === 'number') {
          cellText = String(cell);
        }
        cellText = sanitizeText(safeText(cellText));
        if (cellIndex === 0) {
          const wrappedText = wrapText(doc, cellText, columnWidths[cellIndex] - 4);
          if (Array.isArray(wrappedText) && wrappedText.length > 0) {
            wrappedText.forEach((line, i) => {
              doc.text(line, currentX + 2, currentY + 5.5 + i * 3.5);
            });
          } else if (typeof cellText === 'string' && cellText.trim() !== '') {
            doc.text(cellText, currentX + 2, currentY + 5.5);
          }
        } else {
          if (typeof cellText === 'string' && cellText.trim() !== '') {
            doc.text(cellText, currentX + (columnWidths[cellIndex] / 2) - (doc.getTextWidth(cellText) / 2), currentY + 5.5);
          }
        }
        if (cellIndex > 0) {
          doc.setDrawColor(...borderColor);
          const x1 = safeNumber(currentX);
          const y1 = safeNumber(currentY);
          const x2 = safeNumber(currentX);
          const y2 = safeNumber(currentY + rowHeight);
          doc.line(x1, y1, x2, y2);
        }
        currentX += columnWidths[cellIndex];
      });
      // Draw borders
      const x1 = safeNumber(currentX);
      const y1 = safeNumber(currentY);
      const x2 = safeNumber(currentX);
      const y2 = safeNumber(currentY + rowHeight);
      doc.line(x1, y1, x2, y2);
      const bx1 = safeNumber(10);
      const by1 = safeNumber(currentY + rowHeight);
      const bx2 = safeNumber(10 + tableWidth);
      const by2 = safeNumber(currentY + rowHeight);
      doc.line(bx1, by1, bx2, by2);
      currentY += rowHeight;
    });
    return currentY + 5;
  };

  // Patch drawEnhancedTable to allow custom tableWidth (50% for this table)
  const drawEnhancedTable50 = (
    doc: jsPDF,
    startY: number,
    headers: string[],
    data: (string | number)[][],
    hasAverageColumn: boolean = true,
    solidGreen: boolean = false
  ) => {
    let currentY = startY;
    const rowHeight = 8;
    const pageWidth = doc.internal.pageSize.getWidth();
    const tableWidth = (pageWidth - 20) * 0.5; // 50% width
    const headerBg: [number, number, number] = [230, 230, 230];
    const lightCol: [number, number, number] = [245, 245, 245];
    const alternateRow: [number, number, number] = [248, 248, 248];
    const borderColor: [number, number, number] = [64, 64, 64];
    const moyenneGreen: [number, number, number] = [144, 238, 144];
    let columnWidths;
    if (hasAverageColumn) {
      const firstColWidth = 60 * 0.5;
      const avgColWidth = 25 * 0.5;
      const remainingWidth = tableWidth - firstColWidth - avgColWidth;
      const dataColWidth = remainingWidth / (headers.length - 2);
      columnWidths = [firstColWidth, ...Array(headers.length - 2).fill(dataColWidth), avgColWidth];
    } else {
      const equalWidth = tableWidth / headers.length;
      columnWidths = Array(headers.length).fill(equalWidth);
    }
    // Draw header
    doc.setFillColor(...headerBg);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(10, currentY, tableWidth, rowHeight, 'FD');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let currentX = 10;
    headers.forEach((header, index) => {
      if (index === headers.length - 1 && hasAverageColumn) {
        doc.setFillColor(...moyenneGreen); // Always green for Moyenne column
        doc.rect(currentX, currentY, columnWidths[index], rowHeight, 'F');
        doc.setTextColor(0, 0, 0);
        const textWidth = doc.getTextWidth(header);
        doc.text(header, currentX + (columnWidths[index] / 2) - (textWidth / 2), currentY + 5.5);
        doc.setTextColor(0, 0, 0);
      } else {
        const textWidth = doc.getTextWidth(header);
        doc.text(header, currentX + (columnWidths[index] / 2) - (textWidth / 2), currentY + 5.5);
      }
      if (index > 0) {
        doc.line(currentX, currentY, currentX, currentY + rowHeight);
      }
      currentX += columnWidths[index];
    });
    doc.line(currentX, currentY, currentX, currentY + rowHeight);
    currentY += rowHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    data.forEach((row: (string | number)[], rowIndex: number) => {
      const isMoyenne = typeof row[0] === 'string' && row[0].toLowerCase().includes('moyenne');
      const shouldFill = isMoyenne ? true : rowIndex % 2 === 1;
      if (shouldFill) {
        doc.setFillColor(...(isMoyenne ? moyenneGreen : alternateRow));
        doc.rect(10, currentY, tableWidth, rowHeight, 'F');
      }
      let currentX = 10;
      row.forEach((cell: string | number, cellIndex: number) => {
        doc.setTextColor(0, 0, 0);
        // Always fill Moyenne column green
        if (cellIndex === row.length - 1 && hasAverageColumn) {
          doc.setFillColor(...moyenneGreen);
          doc.rect(currentX, currentY, columnWidths[cellIndex], rowHeight, 'F');
          doc.setFont('helvetica', isMoyenne ? 'bold' : 'normal');
        } else {
          doc.setFont('helvetica', isMoyenne ? 'bold' : 'normal');
        }
        let cellText = '';
        if (typeof cell === 'string' || typeof cell === 'number') {
          cellText = String(cell);
        }
        cellText = sanitizeText(safeText(cellText));
        if (cellIndex === 0) {
          const wrappedText = wrapText(doc, cellText, columnWidths[cellIndex] - 4);
          if (Array.isArray(wrappedText) && wrappedText.length > 0) {
            wrappedText.forEach((line, i) => {
              doc.text(line, currentX + 2, currentY + 5.5 + i * 3.5);
            });
          } else if (typeof cellText === 'string' && cellText.trim() !== '') {
            doc.text(cellText, currentX + 2, currentY + 5.5);
          }
        } else {
          if (typeof cellText === 'string' && cellText.trim() !== '') {
            doc.text(cellText, currentX + (columnWidths[cellIndex] / 2) - (doc.getTextWidth(cellText) / 2), currentY + 5.5);
          }
        }
        if (cellIndex > 0) {
          doc.setDrawColor(...borderColor);
          const x1 = safeNumber(currentX);
          const y1 = safeNumber(currentY);
          const x2 = safeNumber(currentX);
          const y2 = safeNumber(currentY + rowHeight);
          doc.line(x1, y1, x2, y2);
        }
        currentX += columnWidths[cellIndex];
      });
      // Draw borders
      const x1 = safeNumber(currentX);
      const y1 = safeNumber(currentY);
      const x2 = safeNumber(currentX);
      const y2 = safeNumber(currentY + rowHeight);
      doc.line(x1, y1, x2, y2);
      const bx1 = safeNumber(10);
      const by1 = safeNumber(currentY + rowHeight);
      const bx2 = safeNumber(10 + tableWidth);
      const by2 = safeNumber(currentY + rowHeight);
      doc.line(bx1, by1, bx2, by2);
      currentY += rowHeight;
    });
    return currentY + 5;
  };

  // Tolerance table: green for moyenne column
  const drawToleranceTable = (
    doc: jsPDF,
    startY: number,
    headers: string[],
    data: (string | number)[][],
    customTableWidth: number | null = null
  ) => {
    let currentY = startY;
    const rowHeight = 8;
    const pageWidth = doc.internal.pageSize.getWidth();
    const tableWidth = customTableWidth ?? (pageWidth - 20) * 0.5;
    const headerBg: [number, number, number] = [230, 230, 230];
    const alternateRow: [number, number, number] = [248, 248, 248];
    const borderColor: [number, number, number] = [64, 64, 64];
    const moyenneGreen: [number, number, number] = [144, 238, 144];
    const equalWidth = tableWidth / headers.length;
    const columnWidths = Array(headers.length).fill(equalWidth);
    doc.setFillColor(...headerBg);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(10, currentY, tableWidth, rowHeight, 'FD');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let currentX = 10;
    headers.forEach((header, index) => {
      if (index === 1) {
        doc.setFillColor(...moyenneGreen); // Always green for Moyenne column
        doc.rect(currentX, currentY, columnWidths[index], rowHeight, 'F');
      }
      const textWidth = doc.getTextWidth(header);
      doc.text(header, currentX + (columnWidths[index] / 2) - (textWidth / 2), currentY + 5.5);
      if (index > 0) {
        doc.line(currentX, currentY, currentX, currentY + rowHeight);
      }
      currentX += columnWidths[index];
    });
    doc.line(currentX, currentY, currentX, currentY + rowHeight);
    currentY += rowHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    data.forEach((row: (string | number)[], rowIndex: number) => {
      const shouldFill = rowIndex % 2 === 1;
      if (shouldFill) {
        doc.setFillColor(...alternateRow);
        doc.rect(10, currentY, tableWidth, rowHeight, 'F');
      }
      let currentX = 10;
      row.forEach((cell: string | number, cellIndex: number) => {
        doc.setTextColor(0, 0, 0);
        // Always fill Moyenne column green (index 1)
        if (cellIndex === 1) {
          doc.setFillColor(...moyenneGreen);
          doc.rect(currentX, currentY, columnWidths[cellIndex], rowHeight, 'F');
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        let cellText = '';
        if (typeof cell === 'string' || typeof cell === 'number') {
          cellText = String(cell);
        }
        cellText = sanitizeText(safeText(cellText));
        if (cellIndex === 0) {
          const wrappedText = wrapText(doc, cellText, columnWidths[cellIndex] - 4);
          if (Array.isArray(wrappedText) && wrappedText.length > 0) {
            wrappedText.forEach((line, i) => {
              doc.text(line, currentX + 2, currentY + 5.5 + i * 3.5);
            });
          } else if (typeof cellText === 'string' && cellText.trim() !== '') {
            doc.text(cellText, currentX + 2, currentY + 5.5);
          }
        } else {
          if (typeof cellText === 'string' && cellText.trim() !== '') {
            const textWidth = doc.getTextWidth(cellText);
            doc.text(cellText, currentX + (columnWidths[cellIndex] / 2) - (textWidth / 2), currentY + 5.5);
          }
        }
        if (cellIndex > 0) {
          doc.setDrawColor(...borderColor);
          const x1 = safeNumber(currentX);
          const y1 = safeNumber(currentY);
          const x2 = safeNumber(currentX);
          const y2 = safeNumber(currentY + rowHeight);
          doc.line(x1, y1, x2, y2);
        }
        currentX += columnWidths[cellIndex];
      });
      // Draw borders
      const x1 = safeNumber(currentX);
      const y1 = safeNumber(currentY);
      const x2 = safeNumber(currentX);
      const y2 = safeNumber(currentY + rowHeight);
      doc.line(x1, y1, x2, y2);
      const bx1 = safeNumber(10);
      const by1 = safeNumber(currentY + rowHeight);
      const bx2 = safeNumber(10 + tableWidth);
      const by2 = safeNumber(currentY + rowHeight);
      doc.line(bx1, by1, bx2, by2);
      currentY += rowHeight;
    });
    return currentY + 5;
  };

  const handleGenerateReport = async () => {
    if (!validateForm()) {
      alert('Veuillez remplir tous les champs obligatoires avant de générer le PDF.');
      return;
    }
    setIsGenerating(true);
    
    try {
      const currentFormData = getCurrentFormData();
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Enhanced header with text-based branding block (no image)
      doc.setFillColor(34, 139, 34);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.rect(10, 10, pageWidth - 20, 20, 'FD');

      try {
        doc.addImage(logo, 'PNG', 14, 13, 14, 14);
      } catch (e) {
        /* If logo fails, skip image */
      }

      // Main title (enhanced)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RAPPORT QUALITÉ', (pageWidth / 2) - 35, 18);
      doc.setFontSize(12);
      doc.text('CONTRÔLE DU PRODUIT', (pageWidth / 2) - 38, 25);
      
      // Document info
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Version 2.0', pageWidth - 60, 16);
      doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - 60, 20);
      doc.text('Page 1/2', pageWidth - 60, 28);
      
      // Product information with enhanced layout
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const infoY = 38;
      const infoFields = [
        ['Date:', currentFormData.date],
        ['Produit:', currentFormData.product],
        ['Variété:', currentFormData.variety],
        ['Campagne:', currentFormData.campaign]
      ];
      
      infoFields.forEach(([label, value], index) => {
        const x = 10 + (index * 65);
        doc.text(label, x, infoY);
        doc.setFont('helvetica', 'bold');
        doc.text(value || '', x + 20, infoY);
        doc.setFont('helvetica', 'normal');
      });
      
      // Second row of info
      const infoY2 = infoY + 8;
      const infoFields2 = [
        ['N° Expédition:', currentFormData.shipmentNumber],
        ['Type emballage:', currentFormData.packagingType],
        ['Catégorie:', currentFormData.category],
        ['N° Exportateur:', currentFormData.exporterNumber]
      ];
      
      infoFields2.forEach(([label, value], index) => {
        const x = 10 + (index * 65);
        doc.text(label, x, infoY2);
        doc.setFont('helvetica', 'bold');
        doc.text(value || '', x + 25, infoY2);
        doc.setFont('helvetica', 'normal');
      });
      
      // Generate palette headers (ensuring 27 columns total - 26 palettes + average)
      const maxPalettes = 26;
      const paletteHeaders = ['', ...Array.from({length: maxPalettes}, (_, i) => (i + 1).toString()), 'Moyenne'];
      let currentY = 55;

      // --- Move all data array definitions here ---
      // I) Contrôle Poids with REAL data
      const generateWeightRow = (field: string, label: string) => {
        const row = [label];
        for (let i = 0; i < maxPalettes; i++) {
          if (i < currentFormData.palettes.length && currentFormData.palettes[i][field]) {
            row.push(currentFormData.palettes[i][field] || '');
          } else {
            row.push('');
          }
        }
        const average = calculateAverages(field);
        row.push(average);
        return row;
      };
      const weightData = [
        generateWeightRow('packageWeight', 'Poids du colis (kg)'),
        generateWeightRow('requiredNetWeight', 'Poids net requis (kg)'),
        (() => {
          const row = ['Poids net (%)'];
          for (let i = 0; i < maxPalettes; i++) {
            if (i < currentFormData.palettes.length) {
              const palette = getCurrentFormData().palettes[i];
              if (palette.packageWeight && palette.requiredNetWeight) {
                const weight = parseFloat(palette.packageWeight);
                const required = parseFloat(palette.requiredNetWeight);
                const percentage = ((weight - required) / required * 100).toFixed(2);
                row.push(percentage);
              } else {
                row.push('');
              }
            } else {
              row.push('');
            }
          }
          const validPercentages = currentFormData.palettes
            .filter((p: PaletteData) => p.packageWeight && p.requiredNetWeight)
            .map((p: PaletteData) => {
              const weight = parseFloat(p.packageWeight);
              const required = parseFloat(p.requiredNetWeight);
              return (weight - required) / required * 100;
            });
          const avgPercentage = validPercentages.length > 0 
            ? (validPercentages.reduce((a: number, b: number) => a + b, 0) / validPercentages.length).toFixed(2)
            : '';
          row.push(avgPercentage);
          return row;
        })()
      ];
      // II) Contrôle des caractéristiques minimales
      const generateDataRow = (field: string, label: string) => {
        const row = [label];
        for (let i = 0; i < maxPalettes; i++) {            if (i < currentFormData.palettes.length) {
            row.push(getCurrentFormData().palettes[i][field] || '');
          } else {
            row.push('');
          }
        }
        row.push(calculateAverages(field));
        return row;
      };
      const minCharData = [
        generateDataRow('firmness', 'Fermeté (kgf) [13-14]'),
        generateDataRow('rotting', 'Pourriture (anthracnose) (%)'),
        generateDataRow('foreignMatter', 'Matière étrangère visible (%)'),
        generateDataRow('withered', 'Flétri (C/NC)'),
        generateDataRow('hardenedEndoderm', 'Endoderme durci (%)'),
        generateDataRow('parasitePresence', 'Présence de parasite (%)'),
        generateDataRow('parasiteAttack', 'Attaque de parasite (%)'),
        generateDataRow('temperature', 'Température (C/NC)'),
        generateDataRow('odorOrTaste', 'Odeur ou saveur étrangère (C/NC)')
      ];
      // III) Contrôle des caractéristiques spécifiques
      const specCharData = [
        generateDataRow('shapeDefect', 'Défaut de\nforme (%)'),
        generateDataRow('colorDefect', 'Défaut de\ncoloration (%)'),
        generateDataRow('epidermisDefect', 'Défaut dépiderme(%)'),
        generateDataRow('homogeneity', 'Homogénéité'),
        generateDataRow('missingBrokenGrains', 'Extrémité des grains (%)'),
        generateDataRow('size', 'Calibre')
      ];
      // IV) Contrôle du produit fini
      // Use only half the page width for this table
      const finalProductData = [
        generateDataRow('size', 'Calibre'),
        generateDataRow('packageCount', 'Nombre colis/palette'),
        generateDataRow('packagingState', 'État d\'emballage (C/NC)'),
        generateDataRow('labelingPresence', 'Présence d\'étiquetage (C/NC)'),
        generateDataRow('paletteSheet', 'Fiche palette (C/NC)'),
        generateDataRow('internalLotNumber', 'N° Lot Interne'),
        generateDataRow('paletteConformity', 'Conformité palette (C/NC)')
      ];

      // Patch drawEnhancedTable to allow custom tableWidth (50% for this table)
      const drawEnhancedTable50 = (
        doc: jsPDF,
        startY: number,
        headers: string[],
        data: (string | number)[][],
        hasAverageColumn: boolean = true,
        solidGreen: boolean = false
      ) => {
        let currentY = startY;
        const rowHeight = 8;
        const pageWidth = doc.internal.pageSize.getWidth();
        const tableWidth = (pageWidth - 20) * 0.5; // 50% width
        const headerBg: [number, number, number] = [230, 230, 230];
        const lightCol: [number, number, number] = [245, 245, 245];
        const alternateRow: [number, number, number] = [248, 248, 248];
        const borderColor: [number, number, number] = [64, 64, 64];
        const moyenneGreen: [number, number, number] = [144, 238, 144];
        let columnWidths;
        if (hasAverageColumn) {
          const firstColWidth = 60 * 0.5;
          const avgColWidth = 25 * 0.5;
          const remainingWidth = tableWidth - firstColWidth - avgColWidth;
          const dataColWidth = remainingWidth / (headers.length - 2);
          columnWidths = [firstColWidth, ...Array(headers.length - 2).fill(dataColWidth), avgColWidth];
        } else {
          const equalWidth = tableWidth / headers.length;
          columnWidths = Array(headers.length).fill(equalWidth);
        }
        // Draw header
        doc.setFillColor(...headerBg);
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.5);
        doc.rect(10, currentY, tableWidth, rowHeight, 'FD');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let currentX = 10;
        headers.forEach((header, index) => {
          if (index === headers.length - 1 && hasAverageColumn) {
            doc.setFillColor(...moyenneGreen); // Always green for Moyenne column
            doc.rect(currentX, currentY, columnWidths[index], rowHeight, 'F');
            doc.setTextColor(0, 0, 0);
            const textWidth = doc.getTextWidth(header);
            doc.text(header, currentX + (columnWidths[index] / 2) - (textWidth / 2), currentY + 5.5);
            doc.setTextColor(0, 0, 0);
          } else {
            const textWidth = doc.getTextWidth(header);
            doc.text(header, currentX + (columnWidths[index] / 2) - (textWidth / 2), currentY + 5.5);
          }
          if (index > 0) {
            doc.line(currentX, currentY, currentX, currentY + rowHeight);
          }
          currentX += columnWidths[index];
        });
        doc.line(currentX, currentY, currentX, currentY + rowHeight);
        currentY += rowHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        data.forEach((row: (string | number)[], rowIndex: number) => {
          const isMoyenne = typeof row[0] === 'string' && row[0].toLowerCase().includes('moyenne');
          const shouldFill = isMoyenne ? true : rowIndex % 2 === 1;
          if (shouldFill) {
            doc.setFillColor(...(isMoyenne ? moyenneGreen : alternateRow));
            doc.rect(10, currentY, tableWidth, rowHeight, 'F');
          }
          let currentX = 10;
          row.forEach((cell: string | number, cellIndex: number) => {
            doc.setTextColor(0, 0, 0);
            // Always fill Moyenne column green
            if (cellIndex === row.length - 1 && hasAverageColumn) {
              doc.setFillColor(...moyenneGreen);
              doc.rect(currentX, currentY, columnWidths[cellIndex], rowHeight, 'F');
              doc.setFont('helvetica', isMoyenne ? 'bold' : 'normal');
            } else {
              doc.setFont('helvetica', isMoyenne ? 'bold' : 'normal');
            }
            let cellText = '';
            if (typeof cell === 'string' || typeof cell === 'number') {
              cellText = String(cell);
            }
            cellText = sanitizeText(safeText(cellText));
            if (cellIndex === 0) {
              const wrappedText = wrapText(doc, cellText, columnWidths[cellIndex] - 4);
              if (Array.isArray(wrappedText) && wrappedText.length > 0) {
                wrappedText.forEach((line, i) => {
                  doc.text(line, currentX + 2, currentY + 5.5 + i * 3.5);
                });
              } else if (typeof cellText === 'string' && cellText.trim() !== '') {
                doc.text(cellText, currentX + 2, currentY + 5.5);
              }
            } else {
              if (typeof cellText === 'string' && cellText.trim() !== '') {
                doc.text(cellText, currentX + (columnWidths[cellIndex] / 2) - (doc.getTextWidth(cellText) / 2), currentY + 5.5);
              }
            }
            if (cellIndex > 0) {
              doc.setDrawColor(...borderColor);
              const x1 = safeNumber(currentX);
              const y1 = safeNumber(currentY);
              const x2 = safeNumber(currentX);
              const y2 = safeNumber(currentY + rowHeight);
              doc.line(x1, y1, x2, y2);
            }
            currentX += columnWidths[cellIndex];
          });
          // Draw borders
          const x1 = safeNumber(currentX);
          const y1 = safeNumber(currentY);
          const x2 = safeNumber(currentX);
          const y2 = safeNumber(currentY + rowHeight);
          doc.line(x1, y1, x2, y2);
          const bx1 = safeNumber(10);
          const by1 = safeNumber(currentY + rowHeight);
          const bx2 = safeNumber(10 + tableWidth);
          const by2 = safeNumber(currentY + rowHeight);
          doc.line(bx1, by1, bx2, by2);
          currentY += rowHeight;
        });
        return currentY + 5;
      };

      // V) Tolérance
      // Move these to the top of the function to avoid redeclaration
      const halfTableWidth = doc.internal.pageSize.getWidth() * 0.5;
      const drawToleranceTable = (
        doc: jsPDF,
        startY: number,
        headers: string[],
        data: (string | number)[][],
        customTableWidth: number | null = null
      ) => {
        let currentY = startY;
        const rowHeight = 8;
        const pageWidth = doc.internal.pageSize.getWidth();
        const tableWidth = customTableWidth ?? (pageWidth - 20) * 0.5;
        const headerBg: [number, number, number] = [230, 230, 230];
        const alternateRow: [number, number, number] = [248, 248, 248];
        const borderColor: [number, number, number] = [64, 64, 64];
        const moyenneGreen: [number, number, number] = [144, 238, 144];
        const equalWidth = tableWidth / headers.length;
        const columnWidths = Array(headers.length).fill(equalWidth);
        // Draw header
        doc.setFillColor(...headerBg);
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.5);
        doc.rect(10, currentY, tableWidth, rowHeight, 'FD');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let currentX = 10;
        headers.forEach((header, index) => {
          const textWidth = doc.getTextWidth(header);
          doc.text(header, currentX + (columnWidths[index] / 2) - (textWidth / 2), currentY + 5.5);
          if (index > 0) {
            doc.line(currentX, currentY, currentX, currentY + rowHeight);
          }
          currentX += columnWidths[index];
        });
        doc.line(currentX, currentY, currentX, currentY + rowHeight);
        currentY += rowHeight;
        // Draw data rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        data.forEach((row: (string | number)[], rowIndex: number) => {
          // Always make the 'Résultat moyen' cell green
          let currentX = 10;
          row.forEach((cell: string | number, cellIndex: number) => {
            if (cellIndex === 1) {
              doc.setFillColor(...moyenneGreen);
              doc.rect(currentX, currentY, columnWidths[cellIndex], rowHeight, 'F');
              doc.setFont('helvetica', 'bold');
            } else if (rowIndex % 2 === 1) {
              doc.setFillColor(...alternateRow);
              doc.rect(currentX, currentY, columnWidths[cellIndex], rowHeight, 'F');
              doc.setFont('helvetica', 'normal');
            } else {
              doc.setFont('helvetica', 'normal');
            }
            doc.setTextColor(0, 0, 0);
            let cellText = '';
            if (typeof cell === 'string' || typeof cell === 'number') {
              cellText = String(cell);
            }
            cellText = sanitizeText(safeText(cellText));
            if (cellIndex === 0) {
              const wrappedText = wrapText(doc, cellText, columnWidths[cellIndex] - 4);
              if (Array.isArray(wrappedText) && wrappedText.length > 0) {
                wrappedText.forEach((line, i) => {
                  doc.text(line, currentX + 2, currentY + 5.5 + i * 3.5);
                });
              } else if (typeof cellText === 'string' && cellText.trim() !== '') {
                doc.text(cellText, currentX + 2, currentY + 5.5);
              }
            } else {
              if (typeof cellText === 'string' && cellText.trim() !== '') {
                const textWidth = doc.getTextWidth(cellText);
                doc.text(cellText, currentX + (columnWidths[cellIndex] / 2) - (textWidth / 2), currentY + 5.5);
              }
            }
            if (cellIndex > 0) {
              doc.setDrawColor(...borderColor);
              const x1 = safeNumber(currentX);
              const y1 = safeNumber(currentY);
              const x2 = safeNumber(currentX);
              const y2 = safeNumber(currentY + rowHeight);
              doc.line(x1, y1, x2, y2);
            }
            currentX += columnWidths[cellIndex];
          });
          // Draw borders
          const x1 = safeNumber(currentX);
          const y1 = safeNumber(currentY);
          const x2 = safeNumber(currentX);
          const y2 = safeNumber(currentY + rowHeight);
          doc.line(x1, y1, x2, y2);
          const bx1 = safeNumber(10);
          const by1 = safeNumber(currentY + rowHeight);
          const bx2 = safeNumber(10 + tableWidth);
          const by2 = safeNumber(currentY + rowHeight);
          doc.line(bx1, by1, bx2, by2);
          currentY += rowHeight;
        });
        return currentY + 5;
      };
      // --- Draw PDF tables for each section using the same data as the UI ---
      // I) Contrôle Poids (Page 1)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('I) Contrôle du poids du colis', 10, currentY);
      currentY += 8;
      currentY = drawEnhancedTable(doc, currentY, paletteHeaders, weightData);

      // II) Contrôle des caractéristiques minimales (Page 1)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('II) Contrôle des caractéristiques minimales', 10, currentY);
      currentY += 8;
      currentY = drawEnhancedTable(doc, currentY, paletteHeaders, minCharData);

      // --- New Page for the rest ---
      doc.addPage('landscape');
      let page2Y = 20;

      // Move tolerance headers/data here for use on page 2
      const toleranceHeaders = ['Tolérance', 'Résultat moyen', 'Conforme', 'Non conforme'];
      // Calculate results as in the UI
      const minCharAvg = (() => {
        let sum = 0, count = 0;
        getCurrentFormData().palettes.forEach((p: PaletteData) => {
          const val =
            (parseFloat(p.rotting || '0') || 0) +
            (parseFloat(p.foreignMatter || '0') || 0) +
            (parseFloat(p.withered || '0') || 0) +
            (parseFloat(p.hardenedEndoderm || '0') || 0) +
            (parseFloat(p.parasitePresence || '0') || 0) +
            (parseFloat(p.parasiteAttack || '0') || 0);
          sum += val;
          count++;
        });
        return count ? (sum / count).toFixed(2) : '';
      })();
      const totalDefectsAvg = (() => {
        let sum = 0, count = 0;
        getCurrentFormData().palettes.forEach((p: PaletteData) => {
          const minChar =
            (parseFloat(p.rotting || '0') || 0) +
            (parseFloat(p.foreignMatter || '0') || 0) +
            (parseFloat(p.withered || '0') || 0) +
            (parseFloat(p.hardenedEndoderm || '0') || 0) +
            (parseFloat(p.parasitePresence || '0') || 0) +
            (parseFloat(p.parasiteAttack || '0') || 0);
          const catIDef =
            (parseFloat(p.shapeDefect || '0') || 0) +
            (parseFloat(p.colorDefect || '0') || 0) +
            (parseFloat(p.epidermisDefect || '0') || 0);
          sum += minChar + catIDef;
          count++;
        });
        return count ? (sum / count).toFixed(2) : '';
      })();
      const missingBrokenAvg = (() => {
        let sum = 0, count = 0;
        getCurrentFormData().palettes.forEach((p: PaletteData) => {
          sum += parseFloat(p.missingBrokenGrains || '0') || 0;
          count++;
        });
        return count ? (sum / count).toFixed(2) : '';
      })();
      const weightAvg = (() => {
        let sum = 0, count = 0;
        getCurrentFormData().palettes.forEach((p: PaletteData) => {
          const pw = Number(p.packageWeight || 0);
          const rw = Number(p.requiredNetWeight || 0);
          if (pw && rw) {
            sum += ((pw - rw) * 100) / pw;
            count++;
          }
        });
        return count ? (sum / count).toFixed(2) : '';
      })();
      const toleranceData = [
        ['Caractéristiques minimales (≤ 10%)', minCharAvg, '', ''],
        ['Total des défauts : catégorie I + caractéristiques minimales (≤ 10%)', totalDefectsAvg, '', ''],
        ['Extrémité des grains manques et cassées (≤ 10%)', missingBrokenAvg, '', ''],
        ['Poids selon le type d’emballage (poids net +1%)', weightAvg, '', '']
      ];

      // III) Contrôle des caractéristiques spécifiques (Page 2)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('III) Contrôle des caractéristiques spécifiques', 10, page2Y);
      page2Y += 8;
      page2Y = drawEnhancedTable(doc, page2Y, paletteHeaders, specCharData);

      // IV) Contrôle du produit fini (Page 2)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('IV) Contrôle du produit fini', 10, page2Y);
      page2Y += 8;
      // Use full page width for the table
      page2Y = drawEnhancedTable(doc, page2Y, [
        '',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
        '22',
        '23',
        '24',
        '25',
        '26',
      "Moyenne"
      ], finalProductData, true);

      // V) Tolérance (Page 2)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('V) Tolérance et Conformité', 10, page2Y);
      page2Y += 8;
      page2Y = drawToleranceTable(doc, page2Y, toleranceHeaders, toleranceData, halfTableWidth);

      // Enhanced signature section (Page 2)
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const sigX = 15 + halfTableWidth + 20; // 20mm padding after table
      const sigY = page2Y - (toleranceData.length * 8 + 8); // align with table top
      doc.text('Contrôleur:', sigX, sigY + 2);
      doc.text('Signature:', sigX, sigY + 20);
     
      
      // Save with enhanced filename
      const fileName = `Rapport_Qualite_${currentFormData.product || 'Produit'}_${currentFormData.date || new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsGenerating(false);
    }
  };

  // UI/UX: Helper for required fields
  const requiredFields = [
    'date', 'product', 'variety', 'campaign', 'clientLot',
    'shipmentNumber', 'packagingType', 'category', 'exporterNumber'
  ];

  // UI/UX: Validate required fields
  const validateForm = () => {
    const currentFormData = getCurrentFormData();
    const errors: {[key:string]: string} = {};
    
    requiredFields.forEach(field => {
      if (!currentFormData[field as keyof FormData]) {
        errors[field] = 'Ce champ est requis';
      }
    });
    
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  // Save lot data and send to rapport section
  const handleSave = async () => {
    const currentLot = getCurrentLot();
    if (!currentLot) return;

    // Validate form data
    if (!validateForm()) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Update lot status
    updateLotData(activeLotId!, { status: 'completed' });

    // Save to localStorage for rapport section
    const rapportData = {
      ...currentLot,
      images: lotImages[activeLotId!] || [],
      submittedAt: new Date().toISOString()
    };

    const existingRapports = JSON.parse(localStorage.getItem('quality_rapports') || '[]');
    existingRapports.push(rapportData);
    localStorage.setItem('quality_rapports', JSON.stringify(existingRapports));

    // Show success message
    alert('Lot sauvegardé avec succès et envoyé vers la section rapport!');

    // Update filtered rapports to show current lot
    setFilteredRapports([currentLot.formData]);
  };

  // Submit all lots to archive
  const handleSubmitAllLots = () => {
    const completedLots = lots.filter((lot: QualityControlLot) => lot.status === 'completed');
    
    if (completedLots.length === 0) {
      alert('Aucun lot complété à soumettre.');
      return;
    }

    // Prepare data for archive
    const archiveData = completedLots.map((lot: QualityControlLot) => ({
      id: lot.id,
      lotId: lot.lotNumber,
      date: lot.formData.date,
      controller: 'Quality Controller', // You might want to get this from user context
      chief: 'Quality Chief',
      calibres: lot.formData.palettes.map((p: PaletteData) => p.size || 'N/A'),
      images: lotImages[lot.id] || [],
      testResults: lot.formData,
      pdfController: null,
      pdfChief: null,
      status: 'completed',
      submittedAt: new Date().toISOString()
    }));

    // Save to archive
    const existingArchives = JSON.parse(localStorage.getItem('archived_reports') || '[]');
    existingArchives.push(...archiveData);
    localStorage.setItem('archived_reports', JSON.stringify(existingArchives));

    // Update lot status to submitted
    completedLots.forEach((lot: QualityControlLot) => {
      updateLotData(lot.id, { status: 'submitted' });
    });

    alert(`${completedLots.length} lot(s) soumis avec succès vers l'archive!`);
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && activeLotId) {
      const newImages = Array.from(files);
      setLotImages(prev => ({
        ...prev,
        [activeLotId]: [...(prev[activeLotId] || []), ...newImages]
      }));
    }
  };

  // Remove image
  const removeImage = (imageIndex: number) => {
    if (!activeLotId) return;
    setLotImages(prev => ({
      ...prev,
      [activeLotId]: (prev[activeLotId] || []).filter((_, index) => index !== imageIndex)
    }));
  };

  // Show conformity summary bar
  const conformityColor = results.isConform ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-800';
  const conformityText = results.isConform ? 'Conforme' : 'Non conforme';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Lot Management Header */}
      <div className="bg-white border-b p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            CONTROLE DE LA QUALITE - GESTION DES LOTS
            <Tooltip title="Système de gestion des lots pour le contrôle qualité">
              <InfoOutlinedIcon className="text-blue-400" fontSize="small" />
            </Tooltip>
          </h1>
          <div className="flex gap-3">
            <button
              onClick={createNewLot}
              className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau Lot
            </button>
            <button
              onClick={handleSubmitAllLots}
              className="px-4 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Soumettre tous les lots
            </button>
          </div>
        </div>

        {/* Lot Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {lots.map((lot) => (
            <div
              key={lot.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${
                activeLotId === lot.id
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span 
                className="font-medium whitespace-nowrap"
                onClick={() => setActiveLotId(lot.id)}
              >
                {lot.lotNumber}
              </span>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${
                  lot.status === 'completed' ? 'bg-green-500' :
                  lot.status === 'submitted' ? 'bg-purple-500' :
                  'bg-yellow-500'
                }`}></span>
                <button
                  onClick={() => duplicateLot(lot.id)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Dupliquer"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteLot(lot.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Supprimer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Lot Status */}
      <div className={`w-full py-3 px-6 border-b-2 ${conformityColor} flex items-center justify-between transition-all duration-300`}> 
        <span className="font-semibold text-lg">
          Lot {getCurrentLot()?.lotNumber || ''} - Statut : {conformityText}
        </span>
        <span className="text-sm">
          Min. Caractéristiques: <b>{results.minCharacteristics.toFixed(2)}</b> | 
          Défauts totaux: <b>{results.totalDefects.toFixed(2)}</b> | 
          Grains manquants: <b>{results.missingBrokenGrains.toFixed(2)}</b> | 
          Poids: <b>{results.weightConformity.toFixed(2)}%</b>
        </span>
      </div>
      {/* Main content area */}
      <div className="flex-1 p-6 overflow-auto transition-all duration-300">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            CONTROLE DE LA QUALITE DU PRODUIT FINAL
            <Tooltip title="Ce formulaire permet de contrôler la qualité des produits avant expédition.">
              <InfoOutlinedIcon className="text-blue-400" fontSize="small" />
            </Tooltip>
          </h1>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={handleGenerateReport}
              className="px-5 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 font-semibold transition"
              disabled={isGenerating}
            >
              {isGenerating ? 'Génération en cours...' : 'Télécharger le rapport PDF'}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 focus:ring-2 focus:ring-green-400 font-semibold transition flex items-center"
            >
              <Save className="inline-block mr-2 w-4 h-4" />
              Sauvegarder
            </button>
          </div>

          {/* Display exact rapports for the current lot after save */}
          {filteredRapports.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-green-700 border-b pb-2">Rapports pour le lot : {getCurrentFormData().clientLot}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredRapports.map((rapport, idx) => (
                  <div key={idx} className="mb-4 p-4 border rounded-lg bg-gray-50 shadow-sm">
                    <div className="font-medium mb-2">Date: {rapport.date} | Produit: {rapport.product} | Variété: {rapport.variety}</div>
                    <div className="mb-2">Calibres dans ce rapport :</div>
                    <div className="flex flex-wrap gap-2">
                      {rapport.palettes.map((p, i) => (
                        <span key={i} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {p.size || 'N/A'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab navigation */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex flex-wrap -mb-px">
              {tabTitles.map((title, index) => (
                <button
                  key={index}
                  className={`inline-block py-2 px-4 font-medium text-sm rounded-t-lg transition-all duration-200 ${
                    activeTab === index 
                      ? 'text-blue-600 border-b-2 border-blue-600 active bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(index)}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
          {/* Tab content */}
          <div className="py-4 transition-all duration-300">
            {/* Basic Information Tab */}
            {activeTab === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Date
                      <Tooltip title="Date du contrôle."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <input
                      type="date"
                      value={getCurrentFormData().date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${validation.date ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {validation.date && <span className="text-xs text-red-500">{validation.date}</span>}
                  </div>
                  {/* Product */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Produit
                      <Tooltip title="Nom du produit contrôlé."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <input
                      type="text"
                      value={getCurrentFormData().product}
                      onChange={(e) => handleInputChange('product', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${validation.product ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {validation.product && <span className="text-xs text-red-500">{validation.product}</span>}
                  </div>
                  {/* Variety */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Variété
                      <Tooltip title="Variété du produit."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <input
                      type="text"
                      value={getCurrentFormData().variety}
                      onChange={(e) => handleInputChange('variety', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${validation.variety ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {validation.variety && <span className="text-xs text-red-500">{validation.variety}</span>}
                  </div>
                  {/* Campaign */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Campagne
                      <Tooltip title="Campagne de production."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <input
                      type="text"
                      value={getCurrentFormData().campaign}
                      onChange={(e) => handleInputChange('campaign', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${validation.campaign ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {validation.campaign && <span className="text-xs text-red-500">{validation.campaign}</span>}
                  </div>
                  {/* Client Lot */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Lot client
                      <Tooltip title="Identifiant du lot client."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <input
                      type="text"
                      value={getCurrentFormData().clientLot}
                      onChange={(e) => handleInputChange('clientLot', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${validation.clientLot ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {validation.clientLot && <span className="text-xs text-red-500">{validation.clientLot}</span>}
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Shipment Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      N° Expédition
                      <Tooltip title="Numéro d'expédition."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <input
                      type="text"
                      value={getCurrentFormData().shipmentNumber}
                      onChange={(e) => handleInputChange('shipmentNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${validation.shipmentNumber ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {validation.shipmentNumber && <span className="text-xs text-red-500">{validation.shipmentNumber}</span>}
                  </div>
                  {/* Packaging Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Type emballage
                      <Tooltip title="Type d'emballage utilisé."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <input
                      type="text"
                      value={getCurrentFormData().packagingType}
                      onChange={(e) => handleInputChange('packagingType', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${validation.packagingType ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {validation.packagingType && <span className="text-xs text-red-500">{validation.packagingType}</span>}
                  </div>
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Catégorie
                      <Tooltip title="Catégorie du produit."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <input
                      type="text"
                      value={getCurrentFormData().category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${validation.category ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {validation.category && <span className="text-xs text-red-500">{validation.category}</span>}
                  </div>
                  {/* Exporter Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      N° Exportateur
                      <Tooltip title="Numéro d'exportateur."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <input
                      type="text"
                      value={getCurrentFormData().exporterNumber}
                      onChange={(e) => handleInputChange('exporterNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${validation.exporterNumber ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {validation.exporterNumber && <span className="text-xs text-red-500">{validation.exporterNumber}</span>}
                  </div>
                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Fréquence
                      <Tooltip title="Fréquence de contrôle."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <input
                      type="text"
                      value={getCurrentFormData().frequency}
                      onChange={(e) => handleInputChange('frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Nombre de palettes
                      <Tooltip title="Nombre de palettes à contrôler (max 26)."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        min="1"
                        max="26"
                        value={paletteCount}
                        onChange={(e) => setPaletteCount(parseInt(e.target.value) || 1)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <span className="text-sm text-gray-500">(Max: 26)</span>
                    </div>
                  </div>
                </div>
                
  
              </div>
            )}
            
            {/* Controle poids Tab */}
            {activeTab === 1 && (
              <div className="overflow-x-auto mb-10">
                <h2 className="text-xl font-bold text-green-700 mb-4 border-b pb-2 flex items-center gap-2">
                  I) Contrôle du poids du colis
                  <Tooltip title="Vérification du poids de chaque palette."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                </h2>
                <table className="min-w-full bg-white border-collapse rounded-lg shadow-md">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-green-100">
                      <th className="py-2 px-3 border sticky left-0 bg-green-100 z-10">Paramètre</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border bg-white text-center">{i+1}</th>
                      ))}
                      <th className="py-2 px-3 border bg-green-200">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Poids du colis (kg) */}
                    <tr className="even:bg-gray-50 transition-all">
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Poids du colis (kg)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.packageWeight || ''}
                            onChange={(e) => handlePaletteChange(i, 'packageWeight', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                            placeholder="0.0"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium bg-green-50 text-center">{calculateAverages('packageWeight')}</td>
                    </tr>
                    {/* Poids net requis (kg) */}
                    <tr className="even:bg-gray-50 transition-all">
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Poids net requis (kg)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.requiredNetWeight || ''}
                            onChange={(e) => handlePaletteChange(i, 'requiredNetWeight', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                            placeholder="0.0"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium bg-green-50 text-center">{calculateAverages('requiredNetWeight')}</td>
                    </tr>
                    {/* Poids net (%) - Calculated field */}
                    <tr className="even:bg-gray-50 transition-all">
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Poids net (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-2 px-3 border text-center bg-gray-100">
                          {(() => {
                            const weight = parseFloat(getCurrentFormData().palettes[i]?.packageWeight || '0');
                            const required = parseFloat(getCurrentFormData().palettes[i]?.requiredNetWeight || '0');
                            if (weight && required) {
                              return ((weight - required) / required * 100).toFixed(2);
                            }
                            return '';
                          })()}
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium bg-green-50 text-center">
                        {(() => {
                          const valid = getCurrentFormData().palettes.filter((p: PaletteData) => p.packageWeight && p.requiredNetWeight);
                          if (valid.length === 0) return '';
                          const avg = valid.reduce((acc: number, p: PaletteData) => {
                            const weight = parseFloat(p.packageWeight || '0');
                            const required = parseFloat(p.requiredNetWeight || '0');
                            return acc + ((weight - required) / required * 100);
                          }, 0) / valid.length;
                          return avg.toFixed(2);
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Controle des Caracteristiques minimales Tab */}
            {activeTab === 2 && (
              <div className="overflow-x-auto mb-10">
                <h2 className="text-xl font-bold text-green-700 mb-4 border-b pb-2 flex items-center gap-2">
                  II) Contrôle des caractéristiques minimales
                  <Tooltip title="Vérification des caractéristiques minimales de chaque palette."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                </h2>
                <table className="min-w-full bg-white border-collapse rounded-lg shadow-md">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-green-100">
                      <th className="py-2 px-3 border sticky left-0 bg-green-100 z-10">Paramètre</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border bg-white text-center">{i+1}</th>
                      ))}
                      <th className="py-2 px-3 border bg-green-200">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Firmness (kgf) [13-14] (string input with Moyenne) */}
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Firmness (kgf) [13-14]</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={getCurrentFormData().palettes[i]?.firmness || ''}
                            onChange={(e) => handlePaletteChange(i, 'firmness', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">
                        {(() => {
                          const nums = getCurrentFormData().palettes
                            .map((p: PaletteData) => parseFloat(p.firmness || ''))
                            .filter((v: number) => !isNaN(v));
                          return nums.length ? (nums.reduce((a: number, b: number) => a + b, 0) / nums.length).toFixed(2) : '';
                        })()}
                      </td>
                    </tr>
                    {/* Pourriture (anthracnose) (%) */}
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Pourriture (anthracnose) (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.rotting || ''}
                            onChange={(e) => handlePaletteChange(i, 'rotting', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">
                        {(() => {
                          const nums = getCurrentFormData().palettes
                            .map((p: PaletteData) => parseFloat(p.rotting || ''))
                            .filter((v: number) => !isNaN(v));
                          return nums.length ? (nums.reduce((a: number, b: number) => a + b, 0) / nums.length).toFixed(2) : '';
                        })()}
                      </td>
                    </tr>
                    {/* Matière étrangère visible (sable, les cheveux, ...) (%) */}
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Matière étrangère visible (sable, les cheveux, ...) (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.foreignMatter || ''}
                            onChange={(e) => handlePaletteChange(i, 'foreignMatter', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">
                        {(() => {
                          const nums = getCurrentFormData().palettes
                            .map((p: PaletteData) => parseFloat(p.foreignMatter || ''))
                            .filter((v: number) => !isNaN(v));
                          return nums.length ? (nums.reduce((a: number, b: number) => a + b, 0) / nums.length).toFixed(2) : '';
                        })()}
                      </td>
                    </tr>
                    {/* Flétri (C/NC) */}
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Flétri</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <select
                            value={getCurrentFormData().palettes[i]?.withered || ''}
                            onChange={(e) => handlePaletteChange(i, 'withered', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          >
                            <option value="">--</option>
                            <option value="C">Conforme</option>
                            <option value="NC">Non Conforme</option>
                          </select>
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium"></td>
                    </tr>
                    {/* Endoderme durci (%) */}
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Endoderme durci (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.hardenedEndoderm || ''}
                            onChange={(e) => handlePaletteChange(i, 'hardenedEndoderm', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">
                        {(() => {
                          const nums = getCurrentFormData().palettes
                            .map((p: PaletteData) => parseFloat(p.hardenedEndoderm || ''))
                            .filter((v: number) => !isNaN(v));
                          return nums.length ? (nums.reduce((a: number, b: number) => a + b, 0) / nums.length).toFixed(2) : '';
                        })()}
                      </td>
                    </tr>
                    {/* Présence de parasite (%) */}
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Présence de parasite (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.parasitePresence || ''}
                            onChange={(e) => handlePaletteChange(i, 'parasitePresence', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">
                        {(() => {
                          const nums = getCurrentFormData().palettes
                            .map((p: PaletteData) => parseFloat(p.parasitePresence || ''))
                            .filter((v: number) => !isNaN(v));
                          return nums.length ? (nums.reduce((a: number, b: number) => a + b, 0) / nums.length).toFixed(2) : '';
                        })()}
                      </td>
                    </tr>
                    {/* Présence d’attaque de parasite (%) */}
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Présence d’attaque de parasite (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.parasiteAttack || ''}
                            onChange={(e) => handlePaletteChange(i, 'parasiteAttack', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">
                        {(() => {
                          const nums = getCurrentFormData().palettes
                            .map((p: PaletteData) => parseFloat(p.parasiteAttack || ''))
                            .filter((v: number) => !isNaN(v));
                          return nums.length ? (nums.reduce((a: number, b: number) => a + b, 0) / nums.length).toFixed(2) : '';
                        })()}
                      </td>
                    </tr>
                    {/* Température (C/NC) */}
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Température</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <select
                            value={getCurrentFormData().palettes[i]?.temperature || ''}
                            onChange={(e) => handlePaletteChange(i, 'temperature', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          >
                            <option value="">--</option>
                            <option value="C">Conforme</option>
                            <option value="NC">Non Conforme</option>
                          </select>
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium"></td>
                    </tr>
                    {/* Odeur ou saveur d’étranger (C/NC) */}
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Odeur ou saveur d’étranger</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <select
                            value={getCurrentFormData().palettes[i]?.odorOrTaste || ''}
                            onChange={(e) => handlePaletteChange(i, 'odorOrTaste', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          >
                            <option value="">--</option>
                            <option value="C">Conforme</option>
                            <option value="NC">Non Conforme</option>
                          </select>
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Controle des Parametres Categorie I Tab */}
            {activeTab === 3 && (
              <div className="overflow-x-auto mb-10">
                <h2 className="text-xl font-bold text-green-700 mb-4 border-b pb-2 flex items-center gap-2">
                  III) Contrôle des caractéristiques spécifiques
                  <Tooltip title="Vérification des caractéristiques spécifiques de chaque palette."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                </h2>
                <table className="min-w-full bg-white border-collapse rounded-lg shadow-md">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-green-100">
                      <th className="py-2 px-3 border">Paramètre</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border">Palette {i + 1}</th>
                      ))}
                      <th className="py-2 px-3 border bg-green-200">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Défaut de forme (Moyenne) */}
                    <tr>
                      <td className="py-2 px-3 border">Défaut de forme</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.shapeDefect || ''}
                            onChange={(e) => handlePaletteChange(i, 'shapeDefect', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('shapeDefect')}</td>
                    </tr>
                    {/* Défaut de coloration (Moyenne) */}
                    <tr>
                      <td className="py-2 px-3 border">Défaut de coloration</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.colorDefect || ''}
                            onChange={(e) => handlePaletteChange(i, 'colorDefect', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('colorDefect')}</td>
                    </tr>
                    {/* Défaut d'épiderme (Moyenne) */}
                    <tr>
                      <td className="py-2 px-3 border">Défaut d'épiderme</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.epidermisDefect || ''}
                            onChange={(e) => handlePaletteChange(i, 'epidermisDefect', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('epidermisDefect')}</td>
                    </tr>
                    {/* Homogénéité (C/NC) */}
                    <tr>
                      <td className="py-2 px-3 border">Homogénéité (C/NC)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={getCurrentFormData().palettes[i]?.homogeneity || ''}
                            onChange={(e) => handlePaletteChange(i, 'homogeneity', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium"></td>
                    </tr>
                    {/* Extrémité des grains (Moyenne) */}
                    <tr>
                      <td className="py-2 px-3 border">Extrémité des grains</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.corners || ''}
                            onChange={(e) => handlePaletteChange(i, 'corners', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('corners')}</td>
                    </tr>
                    {/* Manque et cassés */}
                    <tr>
                      <td className="py-2 px-3 border">Manque et cassés</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.missingBrokenGrains || ''}
                            onChange={(e) => handlePaletteChange(i, 'missingBrokenGrains', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('missingBrokenGrains')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Calibre</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.size || ''}
                            onChange={(e) => handlePaletteChange(i, 'size', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Controle Produit Fini Tab */}
            {activeTab === 4 && (
              <div className="overflow-x-auto mb-10">
                <h2 className="text-xl font-bold text-green-700 mb-4 border-b pb-2 flex items-center gap-2">
                  IV) Contrôle du produit fini
                  <Tooltip title="Vérification des informations du produit fini."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                </h2>
                <table className="min-w-full bg-white border-collapse rounded-lg shadow-md">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-green-100">
                      <th className="py-2 px-3 border">Paramètre</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border">Palette {i + 1}</th>
                      ))}
                      <th className="py-2 px-3 border bg-green-200">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 border">Calibre</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.size || ''}
                            onChange={(e) => handlePaletteChange(i, 'size', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium"></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Nombre de colis/palette</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.packageCount || ''}
                            onChange={(e) => handlePaletteChange(i, 'packageCount', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium"></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">État d'emballage</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={getCurrentFormData().palettes[i]?.packagingState || ''}
                            onChange={(e) => handlePaletteChange(i, 'packagingState', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium"></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Présence d'étiquetage</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={getCurrentFormData().palettes[i]?.labelingPresence || ''}
                            onChange={(e) => handlePaletteChange(i, 'labelingPresence', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium"></td>
                    </tr>
                    {/* Fiche palette (Moyenne) */}
                    <tr>
                      <td className="py-2 px-3 border">Fiche palette</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={getCurrentFormData().palettes[i]?.paletteSheet || ''}
                            onChange={(e) => handlePaletteChange(i, 'paletteSheet', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('paletteSheet')}</td>
                    </tr>
                    {/* N° Lot interne (Moyenne) */}
                    <tr>
                      <td className="py-2 px-3 border">N° Lot interne</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={getCurrentFormData().palettes[i]?.internalLotNumber || ''}
                            onChange={(e) => handlePaletteChange(i, 'internalLotNumber', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('internalLotNumber')}</td>
                    </tr>
                    {/* Conformité de la palette */}
                    <tr>
                      <td className="py-2 px-3 border">Conformité de la palette</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={getCurrentFormData().palettes[i]?.paletteConformity || ''}
                            onChange={(e) => handlePaletteChange(i, 'paletteConformity', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium"></td>
                    </tr>
                    {/* Poids brut (Moyenne) */}
                    <tr>
                      <td className="py-2 px-3 border">Poids brut</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.grossWeight || ''}
                            onChange={(e) => handlePaletteChange(i, 'grossWeight', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('grossWeight')}</td>
                    </tr>
                    {/* Poids net (Moyenne) */}
                    <tr>
                      <td className="py-2 px-3 border">Poids net</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            min="0"
                            value={getCurrentFormData().palettes[i]?.netWeight || ''}
                            onChange={(e) => handlePaletteChange(i, 'netWeight', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('netWeight')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Tolérance Tab */}
            {activeTab === 5 && (
              <div className="overflow-x-auto mb-10">
                <h2 className="text-xl font-bold text-green-700 mb-4 border-b pb-2 flex items-center gap-2">
                  V) Tolérance
                  <Tooltip title="Vérification des tolérances appliquées."><InfoOutlinedIcon fontSize="inherit" /></Tooltip>
                </h2>
                <table className="min-w-full bg-white border-collapse rounded-lg shadow-md">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="py-2 px-3 border">Tolérance</th>
                      <th className="py-2 px-3 border">Résultat moyen</th>
                      <th className="py-2 px-3 border">Conforme</th>
                      <th className="py-2 px-3 border">Non conforme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Caractéristiques minimales (≤ 10%) */}
                    <tr>
                      <td className="py-2 px-3 border">Caractéristiques minimales (≤ 10%)</td>
                      <td className="py-1 px-2 border text-center">
                        {(() => {
                          // Sum of relevant fields for each palette, then average
                          let sum = 0, count = 0;
                          getCurrentFormData().palettes.forEach((p: PaletteData) => {
                            const val =
                              (parseFloat(p.rotting || '0') || 0) +
                              (parseFloat(p.foreignMatter || '0') || 0) +
                              (parseFloat(p.withered || '0') || 0) +
                              (parseFloat(p.hardenedEndoderm || '0') || 0) +
                              (parseFloat(p.parasitePresence || '0') || 0) +
                              (parseFloat(p.parasiteAttack || '0') || 0);
                            sum += val;
                            count++;
                          });
                          return count ? (sum / count).toFixed(2) : '';
                        })()}
                      </td>
                      <td className="py-1 px-2 border"><input type="checkbox" className="mx-auto" /></td>
                      <td className="py-1 px-2 border"><input type="checkbox" className="mx-auto" /></td>
                    </tr>
                    {/* Total des défauts : catégorie I + caractéristiques minimales (≤ 10%) */}
                    <tr>
                      <td className="py-2 px-3 border">Total des défauts : catégorie I + caractéristiques minimales (≤ 10%)</td>
                      <td className="py-1 px-2 border text-center">
                        {(() => {
                          let sum = 0, count = 0;
                          getCurrentFormData().palettes.forEach((p: PaletteData) => {
                            const minChar =
                              (parseFloat(p.rotting || '0') || 0) +
                              (parseFloat(p.foreignMatter || '0') || 0) +
                              (parseFloat(p.withered || '0') || 0) +
                              (parseFloat(p.hardenedEndoderm || '0') || 0) +
                              (parseFloat(p.parasitePresence || '0') || 0) +
                              (parseFloat(p.parasiteAttack || '0') || 0);
                            const catIDef =
                              (parseFloat(p.shapeDefect || '0') || 0) +
                              (parseFloat(p.colorDefect || '0') || 0) +
                              (parseFloat(p.epidermisDefect || '0') || 0);
                            sum += minChar + catIDef;
                            count++;
                          });
                          return count ? (sum / count).toFixed(2) : '';
                        })()}
                      </td>
                      <td className="py-1 px-2 border"><input type="checkbox" className="mx-auto" /></td>
                      <td className="py-1 px-2 border"><input type="checkbox" className="mx-auto" /></td>
                    </tr>
                    {/* Extrémité des grains manques et cassées (≤ 10%) */}
                    <tr>
                      <td className="py-2 px-3 border">Extrémité des grains manques et cassées (≤ 10%)</td>
                      <td className="py-1 px-2 border text-center">
                        {(() => {
                          let sum = 0, count = 0;
                          getCurrentFormData().palettes.forEach((p: PaletteData) => {
                            sum += parseFloat(p.missingBrokenGrains || '0') || 0;
                            count++;
                          });
                          return count ? (sum / count).toFixed(2) : '';
                        })()}
                      </td>
                      <td className="py-1 px-2 border"><input type="checkbox" className="mx-auto" /></td>
                      <td className="py-1 px-2 border"><input type="checkbox" className="mx-auto" /></td>
                    </tr>
                    {/* Poids selon le type d’emballage (poids net +1%) */}
                    <tr>
                      <td className="py-2 px-3 border">Poids selon le type d’emballage (poids net +1%)</td>
                      <td className="py-1 px-2 border text-center">
                        {(() => {
                          let sum = 0, count = 0;
                          getCurrentFormData().palettes.forEach((p: PaletteData) => {
                            const pw = Number(p.packageWeight || 0);
                            const rw = Number(p.requiredNetWeight || 0);
                            if (pw && rw) {
                              sum += ((pw - rw) * 100) / pw;
                              count++;
                            }
                          });
                          return count ? (sum / count).toFixed(2) : '';
                        })()}
                      </td>
                      <td className="py-1 px-2 border"><input type="checkbox" className="mx-auto" /></td>
                      <td className="py-1 px-2 border"><input type="checkbox" className="mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
   )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PDF value and coordinate sanitization helpers ---
const safeText = (value: any) => (typeof value === 'string' ? value : '');
const safeNumber = (value: any) => (typeof value === 'number' && !isNaN(value) ? value : 0);
const sanitizeText = (text: string) =>
  text
    .replace(/✓/g, 'v')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/✗/g, 'x')
    .replace(/[^ -\x7F]/g, ''); // Remove all non-ASCII
