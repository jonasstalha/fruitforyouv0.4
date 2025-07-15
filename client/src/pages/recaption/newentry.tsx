import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Calendar } from "../../components/ui/calendar";
import { Card } from "../../components/ui/card";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../../components/ui/tooltip";
import { FileUpload } from "../../components/ui/file-upload";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage, firestore } from "../../lib/firebase"; // Adjust the import path as needed

interface ReceptionEntryData {
  lotNumber: string;
  receptionDateTime: string;
  farm: string;
  farmCode: string;
  variety: string;
  quantity: string;
  qualityGrade: string;
  transportCompany: string;
  driverName: string;
  vehicleId: string;
  departureDateTime: string;
  arrivalDateTime: string;
  transportTemperature: string;
  defects: string[];
  inspectorName: string;
  additionalNotes: string;
  photoUrls: string[];
}

const NewReceptionEntry: React.FC = () => {
  const [formData, setFormData] = useState<ReceptionEntryData>({
    lotNumber: "",
    receptionDateTime: "",
    farm: "",
    farmCode: "",
    variety: "",
    quantity: "",
    qualityGrade: "",
    transportCompany: "",
    driverName: "",
    vehicleId: "",
    departureDateTime: "",
    arrivalDateTime: "",
    transportTemperature: "",
    defects: [],
    inspectorName: "",
    additionalNotes: "",
    photoUrls: [],
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Validate form data
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.lotNumber.trim()) errors.lotNumber = "Lot Number is required";
    if (!formData.farm) errors.farm = "Farm selection is required";
    if (!formData.variety) errors.variety = "Variety is required";
    if (!formData.quantity.trim()) errors.quantity = "Quantity is required";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle file selection
  const handleFileChange = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };

  // Upload files to Firebase Storage
  const uploadFiles = async (): Promise<string[]> => {
    const uploadPromises = files.map(async (file, index) => {
      const fileRef = ref(storage, `reception-entries/${Date.now()}_${file.name}`);
      
      try {
        // Track upload progress
        const uploadTask = uploadBytes(fileRef, file);
        
        // Get download URL after upload
        const snapshot = await uploadTask;
        return await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error(`File upload error for ${file.name}:`, error);
        return null;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls.filter(url => url !== null) as string[];
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files
      const photoUrls = await uploadFiles();

      // Prepare submission data
      const submissionData = {
        ...formData,
        photoUrls,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore
      const docRef = doc(firestore, 'reception-entries', formData.lotNumber);
      await setDoc(docRef, submissionData);

      // Reset form and state
      setFormData({
        lotNumber: "",
        receptionDateTime: "",
        farm: "",
        farmCode: "",
        variety: "",
        quantity: "",
        qualityGrade: "",
        transportCompany: "",
        driverName: "",
        vehicleId: "",
        departureDateTime: "",
        arrivalDateTime: "",
        transportTemperature: "",
        defects: [],
        inspectorName: "",
        additionalNotes: "",
        photoUrls: [],
      });
      setFiles([]);
      
      // Show success notification
      alert("Reception Entry Submitted Successfully!");
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit reception entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Render file preview
  const renderFilePreview = () => {
    return files.map((file, index) => (
      <div key={index} className="flex items-center bg-gray-100 p-2 rounded-md mb-2">
        <span className="mr-2">{file.name}</span>
        <span className="text-sm text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
      </div>
    ));
  };

  return (
    <TooltipProvider>
      <div className="p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          New Reception Entry
        </h1>
        <Card className="p-8 bg-white shadow-lg rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lot Number */}
            <div>
              <Input
                type="text"
                name="lotNumber"
                placeholder="Lot Number *"
                value={formData.lotNumber}
                onChange={handleInputChange}
                className={`w-full ${
                  validationErrors.lotNumber 
                    ? "border-red-500 focus:ring-red-200" 
                    : "border-gray-300 focus:ring-blue-200"
                }`}
              />
              {validationErrors.lotNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.lotNumber}
                </p>
              )}
            </div>

            {/* Reception Date */}
            <div>
              <Tooltip>
                <TooltipTrigger>
                  <div className="w-full">
                    <Calendar
                      mode="single"
                      selected={formData.receptionDateTime ? new Date(formData.receptionDateTime) : undefined}
                      onSelect={(date: Date | undefined) =>
                        date && setFormData(prev => ({ 
                          ...prev, 
                          receptionDateTime: date.toISOString() 
                        }))
                      }
                      className="border rounded-lg p-4 shadow-sm w-full"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Select Reception Date
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Farm Selection */}
            <div>
              <Select
                name="farm"
                value={formData.farm}
                onValueChange={(value: string) => 
                  setFormData(prev => ({ ...prev, farm: value }))
                }
                className={
                  validationErrors.farm 
                    ? "border-red-500" 
                    : "border-gray-300"
                }
              >
                <option value="">Select Farm *</option>
                <option value="Farm A">Farm A</option>
                <option value="Farm B">Farm B</option>
              </Select>
              {validationErrors.farm && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.farm}
                </p>
              )}
            </div>

            {/* Variety Selection */}
            <div>
              <Select
                name="variety"
                value={formData.variety}
                onValueChange={(value: string) => 
                  setFormData(prev => ({ ...prev, variety: value }))
                }
                className={
                  validationErrors.variety 
                    ? "border-red-500" 
                    : "border-gray-300"
                }
              >
                <option value="">Select Variety *</option>
                <option value="Hass">Hass</option>
                <option value="Fuerte">Fuerte</option>
              </Select>
              {validationErrors.variety && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.variety}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <Input
                type="text"
                name="quantity"
                placeholder="Quantity (KG or Count) *"
                value={formData.quantity}
                onChange={handleInputChange}
                className={`w-full ${
                  validationErrors.quantity 
                    ? "border-red-500 focus:ring-red-200" 
                    : "border-gray-300 focus:ring-blue-200"
                }`}
              />
              {validationErrors.quantity && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.quantity}
                </p>
              )}
            </div>

            {/* Additional Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <Select
                name="qualityGrade"
                value={formData.qualityGrade}
                onValueChange={(value: string) => 
                  setFormData(prev => ({ ...prev, qualityGrade: value }))
                }
              >
                <option value="">Quality Grade</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </Select>
              
              <Input
                type="text"
                name="transportCompany"
                placeholder="Transport Company"
                value={formData.transportCompany}
                onChange={handleInputChange}
              />
            </div>

            {/* File Upload */}
            <div>
              <FileUpload 
                multiple 
                onFileChange={handleFileChange}
                className="w-full"
              />
              {files.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
                  {renderFilePreview()}
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <Textarea
              name="additionalNotes"
              placeholder="Additional Notes"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-200"
            />

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6 py-2 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
              <Button 
                type="button" 
                className="bg-gray-500 text-white hover:bg-gray-600 rounded-lg px-6 py-2"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default NewReceptionEntry;