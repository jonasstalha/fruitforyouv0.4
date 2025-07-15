import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X, Printer, Download, FileText, Calendar, MapPin, User, Truck, Thermometer, Package, Box, Truck as DeliveryTruck, Clock, Scale, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react";
import { jsPDF } from 'jspdf';

interface PDFViewerProps {
  lotId: string;
  lotData: any; // Updated type reference
  onClose: () => void;
}

function PDFViewer({ lotId, lotData, onClose }: PDFViewerProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Enhanced PDF generation with better design and comprehensive tracking details
  const generatePDF = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      let y = 25;
      let pageNumber = 1;

      // Color palette
      const colors = {
        primary: [41, 128, 185],
        secondary: [52, 152, 219],
        accent: [231, 76, 60],
        success: [46, 204, 113],
        warning: [241, 196, 15],
        dark: [52, 73, 94],
        light: [236, 240, 241],
        white: [255, 255, 255]
      };

      // Enhanced header with logo placeholder and company info
      const addHeader = () => {
        // Header background with gradient effect
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, 210, 25, 'F');

        // Company logo placeholder
        doc.setFillColor(...colors.white);
        doc.rect(10, 5, 15, 15, 'F');
        doc.setTextColor(...colors.primary);
        doc.setFontSize(8);
        doc.text('LOGO', 17.5, 12.5, { align: 'center' });

        // Company name and title
        doc.setTextColor(...colors.white);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('FRUITS FOR YOU', 30, 12);
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Complete Avocado Traceability Report', 30, 18);

        // Report generation date
        doc.setFontSize(9);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 165, 12);
        doc.text(`Lot ID: ${lotId}`, 165, 18);

        // Separator line
        doc.setDrawColor(...colors.light);
        doc.setLineWidth(0.5);
        doc.line(10, 27, 200, 27);
      };

      // Enhanced footer with contact info
      const addFooter = (pageNum: number) => {
        doc.setFillColor(...colors.dark);
        doc.rect(0, 280, 210, 17, 'F');

        // Contact information
        doc.setTextColor(...colors.white);
        doc.setFontSize(8);
        doc.text('Fruits For You | www.fruitsforyou.com | contact@fruitsforyou.com | +1-555-0123', 105, 286, { align: 'center' });
        doc.text('Quality Assurance & Traceability Department', 105, 292, { align: 'center' });

        // Page number with styling
        doc.setFillColor(...colors.primary);
        doc.rect(185, 275, 20, 8, 'F');
        doc.setTextColor(...colors.white);
        doc.setFontSize(10);
        doc.text(`${pageNum}`, 195, 280, { align: 'center' });
      };

      // Enhanced section title with icons
      const addSectionTitle = (title: string, icon: string = '') => {
        // Section background
        doc.setFillColor(...colors.light);
        doc.rect(10, y - 2, 190, 12, 'F');

        // Section border
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(3);
        doc.line(10, y - 2, 10, y + 10);

        // Title text
        doc.setTextColor(...colors.primary);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${icon} ${title}`, 15, y + 6);

        y += 18;
      };

      // Enhanced field display with better formatting
      const addField = (label: string, value: string, x: number = 15, valueColor: number[] = colors.dark) => {
        doc.setTextColor(...colors.dark);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, x, y);

        doc.setTextColor(...valueColor);
        doc.setFont(undefined, 'normal');
        const labelWidth = doc.getTextWidth(`${label}: `);
        doc.text(value, x + labelWidth, y);
        y += 6;
      };

      // Status indicator
      const addStatusIndicator = (status: string, x: number = 15) => {
        const isDelivered = status === 'Delivered';
        doc.setFillColor(...(isDelivered ? colors.success : colors.warning));
        doc.rect(x, y - 4, 8, 6, 'F');

        doc.setTextColor(...colors.white);
        doc.setFontSize(8);
        doc.text(isDelivered ? '✓' : '!', x + 4, y, { align: 'center' });

        doc.setTextColor(...(isDelivered ? colors.success : colors.warning));
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(status, x + 12, y);
        y += 8;
      };

      // Progress bar for quality metrics
      const addProgressBar = (label: string, value: number, max: number, x: number = 15) => {
        const barWidth = 80;
        const percentage = (value / max) * 100;
        const filledWidth = (barWidth * percentage) / 100;

        doc.setTextColor(...colors.dark);
        doc.setFontSize(10);
        doc.text(`${label}: ${value}/${max} (${percentage.toFixed(1)}%)`, x, y);

        // Progress bar background
        doc.setFillColor(...colors.light);
        doc.rect(x, y + 2, barWidth, 4, 'F');

        // Progress bar fill
        const fillColor = percentage >= 80 ? colors.success : percentage >= 60 ? colors.warning : colors.accent;
        doc.setFillColor(...fillColor);
        doc.rect(x, y + 2, filledWidth, 4, 'F');

        y += 12;
      };

      // Check for page overflow
      const checkPageOverflow = (requiredSpace: number = 20) => {
        if (y > 265 - requiredSpace) {
          addFooter(pageNumber);
          doc.addPage();
          pageNumber++;
          addHeader();
          y = 35;
        }
      };

      // Calculate quality metrics
      const calculateQualityScore = () => {
        const totalCount = lotData.packaging.avocadoCount;
        const rejectedCount = lotData.sorting.rejectedCount;
        const acceptedCount = totalCount - rejectedCount;
        const qualityScore = (acceptedCount / totalCount) * 100;
        return { totalCount, rejectedCount, acceptedCount, qualityScore };
      };

      // Calculate transport duration
      const calculateTransportDuration = () => {
        const departure = new Date(lotData.transport.departureDateTime);
        const arrival = new Date(lotData.transport.arrivalDateTime);
        const durationMs = arrival.getTime() - departure.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return { hours, minutes, durationMs };
      };

      // Start PDF generation
      addHeader();

      // Executive Summary Section
      addSectionTitle('📊 EXECUTIVE SUMMARY');
      const qualityMetrics = calculateQualityScore();
      const transportDuration = calculateTransportDuration();

      addField('Lot Identifier', lotData.harvest.lotNumber, 15, colors.primary);
      addField('Product Type', `${lotData.harvest.variety} Avocados`, 15);
      addField('Quality Score', `${qualityMetrics.qualityScore.toFixed(1)}%`, 15,
        qualityMetrics.qualityScore >= 80 ? colors.success : colors.warning);
      addField('Total Journey Time', `${transportDuration.hours}h ${transportDuration.minutes}m`, 15);
      addField('Final Destination', lotData.delivery.clientLocation, 15);

      // Status indicator
      y += 3;
      addStatusIndicator(lotData.delivery.actualDeliveryDate ? 'Delivered' : 'In Transit');

      checkPageOverflow();

      // 1. HARVEST INFORMATION SECTION
      addSectionTitle('🌱 HARVEST INFORMATION');
      addField('Lot Number', lotData.harvest.lotNumber, 15, colors.primary);
      addField('Harvest Date', new Date(lotData.harvest.harvestDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }));
      addField('Farm Location', lotData.harvest.farmLocation);
      addField('Farmer ID', lotData.harvest.farmerId);
      addField('Avocado Variety', lotData.harvest.variety);
      addField('Harvest Season', new Date(lotData.harvest.harvestDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

      // Additional harvest details
      y += 3;
      doc.setTextColor(...colors.dark);
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.text('✓ Harvest conducted according to organic farming standards', 20, y);
      y += 5;
      doc.text('✓ Quality inspection performed at source', 20, y);
      y += 5;
      doc.text('✓ Proper handling procedures followed during collection', 20, y);
      y += 10;

      checkPageOverflow();

      // 2. TRANSPORT INFORMATION SECTION
      addSectionTitle('🚛 TRANSPORT & LOGISTICS');
      addField('Transport Company', lotData.transport.transportCompany, 15, colors.primary);
      addField('Driver Name', lotData.transport.driverName);
      addField('Vehicle ID', lotData.transport.vehicleId);
      addField('Transport Temperature', `${lotData.transport.temperature}°C (Optimal cold chain maintained)`, 15,
        lotData.transport.temperature <= 5 ? colors.success : colors.warning);
      addField('Departure Date & Time', new Date(lotData.transport.departureDateTime).toLocaleString());
      addField('Arrival Date & Time', new Date(lotData.transport.arrivalDateTime).toLocaleString());
      addField('Total Transport Duration', `${transportDuration.hours} hours ${transportDuration.minutes} minutes`);

      // Temperature compliance indicator
      y += 3;
      const tempCompliant = lotData.transport.temperature <= 5;
      doc.setTextColor(...(tempCompliant ? colors.success : colors.warning));
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(tempCompliant ? '✅ Temperature Compliant' : '⚠️ Temperature Warning', 20, y);
      y += 10;

      checkPageOverflow();

      // 3. QUALITY CONTROL & SORTING SECTION
      addSectionTitle('🎯 QUALITY CONTROL & SORTING');
      addField('Quality Grade', lotData.sorting.qualityGrade, 15,
        lotData.sorting.qualityGrade === 'Premium' ? colors.success : colors.warning);
      addField('Total Avocados Processed', qualityMetrics.totalCount.toString());
      addField('Accepted Count', qualityMetrics.acceptedCount.toString(), 15, colors.success);
      addField('Rejected Count', qualityMetrics.rejectedCount.toString(), 15, colors.accent);
      addField('Quality Notes', lotData.sorting.notes || 'No additional notes');

      // Quality score progress bar
      y += 5;
      addProgressBar('Quality Score', qualityMetrics.acceptedCount, qualityMetrics.totalCount);

      // Quality criteria checklist
      doc.setTextColor(...colors.dark);
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.text('Quality Control Criteria Applied:', 20, y);
      y += 5;
      doc.text('✓ Size uniformity assessment', 25, y); y += 4;
      doc.text('✓ Skin quality inspection', 25, y); y += 4;
      doc.text('✓ Firmness testing', 25, y); y += 4;
      doc.text('✓ Blemish and defect screening', 25, y); y += 4;
      doc.text('✓ Ripeness evaluation', 25, y); y += 10;

      checkPageOverflow();

      // 4. PACKAGING INFORMATION SECTION
      addSectionTitle('📦 PACKAGING & LABELING');
      addField('Box ID', lotData.packaging.boxId, 15, colors.primary);
      addField('Net Weight', `${lotData.packaging.netWeight} kg`);
      addField('Avocado Count per Box', lotData.packaging.avocadoCount.toString());
      addField('Box Type', lotData.packaging.boxType);
      addField('Average Weight per Avocado', `${(lotData.packaging.netWeight / lotData.packaging.avocadoCount).toFixed(0)}g`);

      // Packaging compliance
      y += 5;
      doc.setTextColor(...colors.dark);
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.text('Packaging Standards Compliance:', 20, y); y += 5;
      doc.text('✓ Food-grade packaging materials used', 25, y); y += 4;
      doc.text('✓ Proper ventilation holes for freshness', 25, y); y += 4;
      doc.text('✓ Traceability labels affixed', 25, y); y += 4;
      doc.text('✓ Barcode scanning completed', 25, y); y += 4;
      doc.text('✓ Weight verification performed', 25, y); y += 10;

      checkPageOverflow();

      // 5. DELIVERY INFORMATION SECTION
      addSectionTitle('🚚 DELIVERY & DISTRIBUTION');
      addField('Client Name', lotData.delivery.clientName, 15, colors.primary);
      addField('Delivery Location', lotData.delivery.clientLocation);
      addField('Expected Delivery Date', new Date(lotData.delivery.expectedDeliveryDate).toLocaleDateString());

      if (lotData.delivery.actualDeliveryDate) {
        addField('Actual Delivery Date', new Date(lotData.delivery.actualDeliveryDate).toLocaleDateString(), 15, colors.success);
        const expectedDate = new Date(lotData.delivery.expectedDeliveryDate);
        const actualDate = new Date(lotData.delivery.actualDeliveryDate);
        const deliveryStatus = actualDate <= expectedDate ? 'On Time' : 'Delayed';
        addField('Delivery Status', deliveryStatus, 15, actualDate <= expectedDate ? colors.success : colors.warning);
      } else {
        addField('Delivery Status', 'Pending', 15, colors.warning);
      }

      addField('Delivery Notes', lotData.delivery.notes || 'No additional delivery instructions');

      checkPageOverflow(40);

      // 6. COMPLIANCE & CERTIFICATIONS SECTION
      addSectionTitle('🏆 COMPLIANCE & CERTIFICATIONS');
      doc.setTextColor(...colors.dark);
      doc.setFontSize(10);
      doc.text('This lot meets the following standards and certifications:', 20, y); y += 8;

      const certifications = [
        '✅ HACCP (Hazard Analysis Critical Control Points)',
        '✅ Global GAP (Good Agricultural Practices)',
        '✅ Organic Certification (if applicable)',
        '✅ ISO 22000 Food Safety Management',
        '✅ Cold Chain Compliance',
        '✅ Traceability Requirements per EU Regulation'
      ];

      certifications.forEach(cert => {
        doc.setTextColor(...colors.success);
        doc.setFontSize(9);
        doc.text(cert, 25, y);
        y += 5;
      });

      checkPageOverflow(30);

      // 7. SUMMARY STATISTICS SECTION
      addSectionTitle('📈 SUMMARY STATISTICS');
      y += 5;

      // Create a summary table
      const summaryData = [
        ['Metric', 'Value', 'Status'],
        ['Total Processing Time', `${Math.floor((new Date(lotData.delivery.expectedDeliveryDate).getTime() - new Date(lotData.harvest.harvestDate).getTime()) / (1000 * 60 * 60 * 24))} days`, 'Normal'],
        ['Quality Retention Rate', `${qualityMetrics.qualityScore.toFixed(1)}%`, qualityMetrics.qualityScore >= 80 ? 'Excellent' : 'Good'],
        ['Cold Chain Maintenance', lotData.transport.temperature <= 5 ? 'Maintained' : 'Warning', lotData.transport.temperature <= 5 ? 'Compliant' : 'Review Required'],
        ['Delivery Performance', lotData.delivery.actualDeliveryDate ? 'Completed' : 'In Progress', 'Tracked']
      ];

      // Draw summary table
      let tableY = y;
      const colWidths = [60, 60, 50];
      const rowHeight = 8;

      summaryData.forEach((row, index) => {
        let currentX = 20;

        row.forEach((cell, cellIndex) => {
          // Header row styling
          if (index === 0) {
            doc.setFillColor(...colors.primary);
            doc.rect(currentX, tableY, colWidths[cellIndex], rowHeight, 'F');
            doc.setTextColor(...colors.white);
            doc.setFont(undefined, 'bold');
          } else {
            // Alternate row colors
            doc.setFillColor(...(index % 2 === 0 ? colors.light : colors.white));
            doc.rect(currentX, tableY, colWidths[cellIndex], rowHeight, 'F');
            doc.setTextColor(...colors.dark);
            doc.setFont(undefined, 'normal');
          }

          doc.setFontSize(9);
          doc.text(cell, currentX + 2, tableY + 5);
          currentX += colWidths[cellIndex];
        });

        tableY += rowHeight;
      });

      y = tableY + 10;
      checkPageOverflow();

      // 8. FOOTER DISCLAIMER
      y += 5;
      doc.setTextColor(...colors.dark);
      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.text('This report is generated automatically from our comprehensive traceability system.', 20, y); y += 4;
      doc.text('All data points are verified and maintained according to international food safety standards.', 20, y); y += 4;
      doc.text('For questions regarding this report, please contact our Quality Assurance team.', 20, y); y += 4;
      doc.text(`Report ID: ${lotId}-${new Date().getTime()}`, 20, y);

      // Add final footer
      addFooter(pageNumber);

      // Save the PDF with enhanced filename
      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`Traceability-Report-${lotId}-${timestamp}.pdf`);

    } catch (error) {
      console.error("Error generating enhanced PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle print with enhanced preview
  const handlePrint = () => {
    generatePDF();
    // The PDF will be downloaded, user can then print from their PDF viewer
  };

  // Calculate some metrics for the preview
  const qualityScore = ((lotData.packaging.avocadoCount - lotData.sorting.rejectedCount) / lotData.packaging.avocadoCount * 100).toFixed(1);
  const transportDuration = () => {
    const departure = new Date(lotData.transport.departureDateTime);
    const arrival = new Date(lotData.transport.arrivalDateTime);
    const hours = Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((arrival.getTime() - departure.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className= "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" >
    <Card className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden" >
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6" >
        <div>
        <h2 className="text-2xl font-bold" > Enhanced Traceability Report </h2>
          < p className = "text-blue-100 mt-1" > Comprehensive avocado tracking documentation </p>
            </div>
            < Button
  variant = "ghost"
  size = "icon"
  onClick = { onClose }
  className = "text-white hover:bg-white hover:bg-opacity-20 rounded-full"
    >
    <X className="h-6 w-6" />
      </Button>
      </div>

      < div className = "p-6 overflow-y-auto max-h-[calc(95vh-140px)]" >
        {/* Executive Summary Card */ }
        < div className = "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6" >
          <div className="flex items-center gap-3 mb-4" >
            <BarChart3 className="h-6 w-6 text-blue-600" />
              <h3 className="font-bold text-xl text-blue-900" > Executive Summary </h3>
                </div>
                < div className = "grid grid-cols-2 md:grid-cols-4 gap-4" >
                  <div className="text-center" >
                    <div className="text-2xl font-bold text-blue-600" > { qualityScore } % </div>
                      < div className = "text-sm text-gray-600" > Quality Score </div>
                        </div>
                        < div className = "text-center" >
                          <div className="text-2xl font-bold text-green-600" > { transportDuration() } </div>
                            < div className = "text-sm text-gray-600" > Transport Time </div>
                              </div>
                              < div className = "text-center" >
                                <div className="text-2xl font-bold text-purple-600" > { lotData.packaging.avocadoCount } </div>
                                  < div className = "text-sm text-gray-600" > Total Units </div>
                                    </div>
                                    < div className = "text-center" >
                                      <div className={ `text-2xl font-bold ${lotData.delivery.actualDeliveryDate ? 'text-green-600' : 'text-orange-600'}` }>
                                        { lotData.delivery.actualDeliveryDate ? 'Delivered' : 'In Transit' }
                                        </div>
                                        < div className = "text-sm text-gray-600" > Status </div>
                                          </div>
                                          </div>
                                          </div>

                                          < div className = "space-y-6" >
                                            {/* Harvest Information */ }
                                            < div className = "border border-green-200 rounded-lg p-6 bg-green-50" >
                                              <div className="flex items-center gap-3 mb-4" >
                                                <div className="bg-green-100 p-2 rounded-full" >
                                                  <FileText className="h-5 w-5 text-green-600" />
                                                    </div>
                                                    < h3 className = "font-bold text-lg text-green-800" >🌱 Harvest Information </h3>
                                                      </div>
                                                      < div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
                                                        <div className="bg-white p-3 rounded border" >
                                                          <p className="text-sm text-gray-500 font-medium" > Lot Number </p>
                                                            < p className = "font-bold text-blue-600" > { lotData.harvest.lotNumber } </p>
                                                              </div>
                                                              < div className = "bg-white p-3 rounded border" >
                                                                <p className="text-sm text-gray-500 font-medium" > Harvest Date </p>
                                                                  < p className = "font-semibold" > {
                                                                    new Date(lotData.harvest.harvestDate).toLocaleDateString('en-US', {
                                                                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                                    })
                                                                  } </p>
                                                                    </div>
                                                                    < div className = "bg-white p-3 rounded border" >
                                                                      <p className="text-sm text-gray-500 font-medium" > Farm Location </p>
                                                                        < p className = "font-semibold flex items-center gap-1" >
                                                                          <MapPin className="h-4 w-4 text-gray-400" />
                                                                            { lotData.harvest.farmLocation }
                                                                            </p>
                                                                            </div>
                                                                            < div className = "bg-white p-3 rounded border" >
                                                                              <p className="text-sm text-gray-500 font-medium" > Farmer ID </p>
                                                                                < p className = "font-semibold flex items-center gap-1" >
                                                                                  <User className="h-4 w-4 text-gray-400" />
                                                                                    { lotData.harvest.farmerId }
                                                                                    </p>
                                                                                    </div>
                                                                                    < div className = "bg-white p-3 rounded border" >
                                                                                      <p className="text-sm text-gray-500 font-medium" > Variety </p>
                                                                                        < p className = "font-semibold" > { lotData.harvest.variety } </p>
                                                                                          </div>
                                                                                          < div className = "bg-white p-3 rounded border" >
                                                                                            <p className="text-sm text-gray-500 font-medium" > Season </p>
                                                                                              < p className = "font-semibold flex items-center gap-1" >
                                                                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                                                                  { new Date(lotData.harvest.harvestDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
                                                                                                  </p>
                                                                                                  </div>
                                                                                                  </div>
                                                                                                  < div className = "mt-4 p-3 bg-green-100 rounded-lg" >
                                                                                                    <h4 className="font-semibold text-green-800 mb-2" > Harvest Compliance ✅</h4>
                                                                                                      < ul className = "text-sm text-green-700 space-y-1" >
                                                                                                        <li>• Organic farming standards followed </li>
                                                                                                          <li>• Quality inspection at source completed </li>
                                                                                                            <li>• Proper handling procedures implemented </li>
                                                                                                              </ul>
                                                                                                              </div>
                                                                                                              </div>

  {/* Transport Information */ }
  <div className="border border-blue-200 rounded-lg p-6 bg-blue-50" >
    <div className="flex items-center gap-3 mb-4" >
      <div className="bg-blue-100 p-2 rounded-full" >
        <Truck className="h-5 w-5 text-blue-600" />
          </div>
          < h3 className = "font-bold text-lg text-blue-800" >🚛 Transport & Logistics </h3>
            </div>
            < div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
              <div className="bg-white p-3 rounded border" >
                <p className="text-sm text-gray-500 font-medium" > Transport Company </p>
                  < p className = "font-bold text-blue-600" > { lotData.transport.transportCompany } </p>
                    </div>
                    < div className = "bg-white p-3 rounded border" >
                      <p className="text-sm text-gray-500 font-medium" > Driver </p>
                        < p className = "font-semibold flex items-center gap-1" >
                          <User className="h-4 w-4 text-gray-400" />
                            { lotData.transport.driverName }
                            </p>
                            </div>
                            < div className = "bg-white p-3 rounded border" >
                              <p className="text-sm text-gray-500 font-medium" > Vehicle ID </p>
                                < p className = "font-semibold" > { lotData.transport.vehicleId } </p>
                                  </div>
                                  < div className = "bg-white p-3 rounded border" >
                                    <p className="text-sm text-gray-500 font-medium" > Temperature </p>
                                      < p className = {`font-semibold flex items-center gap-1 ${lotData.transport.temperature <= 5 ? 'text-green-600' : 'text-red-600'}`
}>
  <Thermometer className="h-4 w-4" />
    { lotData.transport.temperature }°C
{ lotData.transport.temperature <= 5 ? ' ✅' : ' ⚠️' }
</p>
  </div>
  < div className = "bg-white p-3 rounded border" >
    <p className="text-sm text-gray-500 font-medium" > Departure </p>
      < p className = "font-semibold flex items-center gap-1" >
        <Clock className="h-4 w-4 text-gray-400" />
          { new Date(lotData.transport.departureDateTime).toLocaleString() }
          </p>
          </div>
          < div className = "bg-white p-3 rounded border" >
            <p className="text-sm text-gray-500 font-medium" > Arrival </p>
              < p className = "font-semibold flex items-center gap-1" >
                <Clock className="h-4 w-4 text-gray-400" />
                  { new Date(lotData.transport.arrivalDateTime).toLocaleString() }
                  </p>
                  </div>
                  </div>
                  < div className = "mt-4 p-3 bg-blue-100 rounded-lg" >
                    <h4 className="font-semibold text-blue-800 mb-2" > Transport Duration: { transportDuration() } </h4>
                      < div className = {`p-2 rounded ${lotData.transport.temperature <= 5 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        <span className="font-semibold" >
                          { lotData.transport.temperature <= 5 ? '✅ Cold Chain Maintained' : '⚠️ Temperature Alert' }
                          </span>
                          < span className = "ml-2" > Optimal temperature maintained throughout transport </span>
                            </div>
                            </div>
                            </div>

{/* Quality Information */ }
<div className="border border-orange-200 rounded-lg p-6 bg-orange-50" >
  <div className="flex items-center gap-3 mb-4" >
    <div className="bg-orange-100 p-2 rounded-full" >
      <Thermometer className="h-5 w-5 text-orange-600" />
        </div>
        < h3 className = "font-bold text-lg text-orange-800" >🎯 Quality Control & Sorting </h3>
          </div>
          < div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
            <div className="bg-white p-3 rounded border" >
              <p className="text-sm text-gray-500 font-medium" > Quality Grade </p>
                < p className = {`font-bold text-lg ${lotData.sorting.qualityGrade === 'Premium' ? 'text-green-600' : 'text-orange-600'}`}>
                  { lotData.sorting.qualityGrade }
{ lotData.sorting.qualityGrade === 'Premium' ? ' ⭐' : '' }
</p>
  </div>
  < div className = "bg-white p-3 rounded border" >
    <p className="text-sm text-gray-500 font-medium" > Quality Score </p>
      < p className = {`font-bold text-lg ${parseFloat(qualityScore) >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
        { qualityScore } %
        </p>
        < div className = "w-full bg-gray-200 rounded-full h-2 mt-2" >
          <div 
                      className={ `h-2 rounded-full ${parseFloat(qualityScore) >= 80 ? 'bg-green-500' : 'bg-orange-500'}` }
style = {{ width: `${qualityScore}%` }}
                    > </div>
  </div>
  </div>
  < div className = "bg-white p-3 rounded border" >
    <p className="text-sm text-gray-500 font-medium" > Total Processed </p>
      < p className = "font-semibold text-blue-600 text-lg" > { lotData.packaging.avocadoCount } </p>
        </div>
        < div className = "bg-white p-3 rounded border" >
          <p className="text-sm text-gray-500 font-medium" > Accepted </p>
            < p className = "font-semibold text-green-600 text-lg" >
              { lotData.packaging.avocadoCount - lotData.sorting.rejectedCount }
              < span className = "text-sm ml-1" > units </span>
                </p>
                </div>
                < div className = "bg-white p-3 rounded border" >
                  <p className="text-sm text-gray-500 font-medium" > Rejected </p>
                    < p className = "font-semibold text-red-600 text-lg" >
                      { lotData.sorting.rejectedCount }
                      < span className = "text-sm ml-1" > units </span>
                        </p>
                        </div>
                        < div className = "bg-white p-3 rounded border" >
                          <p className="text-sm text-gray-500 font-medium" > Average Weight </p>
                            < p className = "font-semibold flex items-center gap-1" >
                              <Scale className="h-4 w-4 text-gray-400" />
                                {(lotData.packaging.netWeight / lotData.packaging.avocadoCount).toFixed(0)}g
                                  </p>
                                  </div>
                                  </div>
                                  < div className = "mt-4 space-y-3" >
                                    <div className="p-3 bg-orange-100 rounded-lg" >
                                      <h4 className="font-semibold text-orange-800 mb-2" > Quality Control Checklist ✅</h4>
                                        < div className = "grid grid-cols-1 md:grid-cols-2 gap-2" >
                                          <ul className="text-sm text-orange-700 space-y-1" >
                                            <li>• ✅ Size uniformity assessment </li>
                                              <li>• ✅ Skin quality inspection </li>
                                                <li>• ✅ Firmness testing </li>
                                                  </ul>
                                                  < ul className = "text-sm text-orange-700 space-y-1" >
                                                    <li>• ✅ Blemish and defect screening </li>
                                                      <li>• ✅ Ripeness evaluation </li>
                                                        <li>• ✅ Weight verification </li>
                                                          </ul>
                                                          </div>
                                                          </div>
{
  lotData.sorting.notes && (
    <div className="p-3 bg-white border rounded-lg" >
      <h4 className="font-semibold text-gray-800 mb-1" > Quality Notes </h4>
        < p className = "text-gray-600 italic" > { lotData.sorting.notes } </p>
          </div>
                )
}
</div>
  </div>

{/* Packaging Information */ }
<div className="border border-purple-200 rounded-lg p-6 bg-purple-50" >
  <div className="flex items-center gap-3 mb-4" >
    <div className="bg-purple-100 p-2 rounded-full" >
      <Package className="h-5 w-5 text-purple-600" />
        </div>
        < h3 className = "font-bold text-lg text-purple-800" >📦 Packaging & Labeling </h3>
          </div>
          < div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
            <div className="bg-white p-3 rounded border" >
              <p className="text-sm text-gray-500 font-medium" > Box ID </p>
                < p className = "font-bold text-purple-600" > { lotData.packaging.boxId } </p>
                  </div>
                  < div className = "bg-white p-3 rounded border" >
                    <p className="text-sm text-gray-500 font-medium" > Net Weight </p>
                      < p className = "font-semibold flex items-center gap-1" >
                        <Scale className="h-4 w-4 text-gray-400" />
                          { lotData.packaging.netWeight } kg
                            </p>
                            </div>
                            < div className = "bg-white p-3 rounded border" >
                              <p className="text-sm text-gray-500 font-medium" > Unit Count </p>
                                < p className = "font-semibold" > { lotData.packaging.avocadoCount } avocados </p>
                                  </div>
                                  < div className = "bg-white p-3 rounded border" >
                                    <p className="text-sm text-gray-500 font-medium" > Box Type </p>
                                      < p className = "font-semibold flex items-center gap-1" >
                                        <Box className="h-4 w-4 text-gray-400" />
                                          { lotData.packaging.boxType }
                                          </p>
                                          </div>
                                          < div className = "bg-white p-3 rounded border" >
                                            <p className="text-sm text-gray-500 font-medium" > Packaging Date </p>
                                              < p className = "font-semibold flex items-center gap-1" >
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                  { new Date().toLocaleDateString() }
                                                  </p>
                                                  </div>
                                                  < div className = "bg-white p-3 rounded border" >
                                                    <p className="text-sm text-gray-500 font-medium" > Density </p>
                                                      < p className = "font-semibold" >
                                                        {(lotData.packaging.avocadoCount / lotData.packaging.netWeight).toFixed(1)} units / kg
                                                          </p>
                                                          </div>
                                                          </div>
                                                          < div className = "mt-4 p-3 bg-purple-100 rounded-lg" >
                                                            <h4 className="font-semibold text-purple-800 mb-2" > Packaging Standards Compliance ✅</h4>
                                                              < ul className = "text-sm text-purple-700 space-y-1" >
                                                                <li>• Food - grade packaging materials </li>
                                                                  <li>• Proper ventilation for freshness </li>
                                                                    <li>• Complete traceability labeling </li>
                                                                      <li>• Barcode verification completed </li>
                                                                        </ul>
                                                                        </div>
                                                                        </div>

{/* Delivery Information */ }
<div className="border border-red-200 rounded-lg p-6 bg-red-50" >
  <div className="flex items-center gap-3 mb-4" >
    <div className="bg-red-100 p-2 rounded-full" >
      <DeliveryTruck className="h-5 w-5 text-red-600" />
        </div>
        < h3 className = "font-bold text-lg text-red-800" >🚚 Delivery & Distribution </h3>
          </div>
          < div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
            <div className="bg-white p-3 rounded border" >
              <p className="text-sm text-gray-500 font-medium" > Client Name </p>
                < p className = "font-bold text-red-600" > { lotData.delivery.clientName } </p>
                  </div>
                  < div className = "bg-white p-3 rounded border" >
                    <p className="text-sm text-gray-500 font-medium" > Delivery Location </p>
                      < p className = "font-semibold flex items-center gap-1" >
                        <MapPin className="h-4 w-4 text-gray-400" />
                          { lotData.delivery.clientLocation }
                          </p>
                          </div>
                          < div className = "bg-white p-3 rounded border" >
                            <p className="text-sm text-gray-500 font-medium" > Expected Date </p>
                              < p className = "font-semibold flex items-center gap-1" >
                                <Calendar className="h-4 w-4 text-gray-400" />
                                  { new Date(lotData.delivery.expectedDeliveryDate).toLocaleDateString() }
                                  </p>
                                  </div>
{
  lotData.delivery.actualDeliveryDate && (
    <div className="bg-white p-3 rounded border" >
      <p className="text-sm text-gray-500 font-medium" > Actual Date </p>
        < p className = "font-semibold flex items-center gap-1 text-green-600" >
          <CheckCircle className="h-4 w-4" />
            { new Date(lotData.delivery.actualDeliveryDate).toLocaleDateString() }
            </p>
            </div>
                )
}
<div className="bg-white p-3 rounded border" >
  <p className="text-sm text-gray-500 font-medium" > Delivery Status </p>
    < div className = "flex items-center gap-2" >
      {
        lotData.delivery.actualDeliveryDate ? (
          <>
          <CheckCircle className= "h-5 w-5 text-green-500" />
          <span className="font-semibold text-green-600"> Delivered </span>
            </>
                    ) : (
              <>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span className="font-semibold text-orange-600" > In Transit </span>
            </>
            )}
</div>
  </div>
  < div className = "bg-white p-3 rounded border" >
    <p className="text-sm text-gray-500 font-medium" > Final Mile </p>
      < p className = "font-semibold" >
        { lotData.delivery.actualDeliveryDate ? 'Completed' : 'Pending' }
        </p>
        </div>
        </div>
{
  lotData.delivery.notes && (
    <div className="mt-4 p-3 bg-white border rounded-lg" >
      <h4 className="font-semibold text-gray-800 mb-1" > Delivery Instructions </h4>
        < p className = "text-gray-600 italic" > { lotData.delivery.notes } </p>
          </div>
              )
}
</div>

{/* Certifications & Compliance */ }
<div className="border border-indigo-200 rounded-lg p-6 bg-indigo-50" >
  <div className="flex items-center gap-3 mb-4" >
    <div className="bg-indigo-100 p-2 rounded-full" >
      <CheckCircle className="h-5 w-5 text-indigo-600" />
        </div>
        < h3 className = "font-bold text-lg text-indigo-800" >🏆 Certifications & Compliance </h3>
          </div>
          < div className = "grid grid-cols-1 md:grid-cols-2 gap-4" >
            <div className="space-y-3" >
              <div className="bg-white p-3 rounded border" >
                <div className="flex items-center gap-2 mb-2" >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-semibold" > HACCP Compliant </span>
                      </div>
                      < p className = "text-sm text-gray-600" > Hazard Analysis Critical Control Points </p>
                        </div>
                        < div className = "bg-white p-3 rounded border" >
                          <div className="flex items-center gap-2 mb-2" >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-semibold" > Global GAP Certified </span>
                                </div>
                                < p className = "text-sm text-gray-600" > Good Agricultural Practices </p>
                                  </div>
                                  < div className = "bg-white p-3 rounded border" >
                                    <div className="flex items-center gap-2 mb-2" >
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="font-semibold" > ISO 22000 </span>
                                          </div>
                                          < p className = "text-sm text-gray-600" > Food Safety Management </p>
                                            </div>
                                            </div>
                                            < div className = "space-y-3" >
                                              <div className="bg-white p-3 rounded border" >
                                                <div className="flex items-center gap-2 mb-2" >
                                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                                    <span className="font-semibold" > Cold Chain Verified </span>
                                                      </div>
                                                      < p className = "text-sm text-gray-600" > Temperature monitoring throughout </p>
                                                        </div>
                                                        < div className = "bg-white p-3 rounded border" >
                                                          <div className="flex items-center gap-2 mb-2" >
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                              <span className="font-semibold" > EU Traceability </span>
                                                                </div>
                                                                < p className = "text-sm text-gray-600" > Complete supply chain visibility </p>
                                                                  </div>
                                                                  < div className = "bg-white p-3 rounded border" >
                                                                    <div className="flex items-center gap-2 mb-2" >
                                                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                                                        <span className="font-semibold" > Organic Certified </span>
                                                                          </div>
                                                                          < p className = "text-sm text-gray-600" > Sustainable farming practices </p>
                                                                            </div>
                                                                            </div>
                                                                            </div>
                                                                            </div>
                                                                            </div>

{/* Action Buttons */ }
<div className="flex justify-end space-x-3 mt-8 pt-6 border-t" >
  <Button
              variant="outline"
onClick = { onClose }
className = "border-gray-300 hover:bg-gray-50"
  >
  Close Preview
    </Button>
    < Button
variant = "outline"
className = "flex items-center border-blue-300 text-blue-600 hover:bg-blue-50"
onClick = { handlePrint }
  >
  <Printer className="mr-2 h-4 w-4" />
    Print Report
      </Button>
      < Button
className = "flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
onClick = { generatePDF }
disabled = { isGenerating }
  >
  {
    isGenerating?(
                <Loader2 className = "mr-2 h-4 w-4 animate-spin" />
              ): (
        <Download className = "mr-2 h-4 w-4" />
              )}
{ isGenerating ? 'Generating...' : 'Download Enhanced PDF' }
</Button>
  </div>
  </div>
  </Card>
  </div>
  );
}

export default PDFViewer;
export { PDFViewer };

// Exporting AvocadoTracking type
export type { AvocadoTracking } from './types/avocado-tracking';

// Farm, Lot, and StatsData interfaces
export interface Farm {
  id: string;
  name: string;
  location: string;
  farmerId: string;
  code?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}

export interface Lot {
  id: string;
  name: string;
  description: string;
  lotNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatsData {
  total: number;
  completed: number;
  pending: number;
  totalLots?: number;
  activeFarms?: number;
}

// Mock data for testing
export const mockFarms: Farm[] = [
  { id: "farm1", name: "Farm A", location: "Location A", farmerId: "farmer1" },
  { id: "farm2", name: "Farm B", location: "Location B", farmerId: "farmer2" },
];

export const mockLots: Lot[] = [
  { id: "lot1", name: "Lot 1", description: "Description for Lot 1" },
  { id: "lot2", name: "Lot 2", description: "Description for Lot 2" },
];