import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, getMetadata, UploadTaskSnapshot } from 'firebase/storage';
import { storage } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Helper function to check if user is authenticated
export const ensureAuthenticated = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(!!user);
    });
  });
};

// Helper function to wait for authentication if needed
export const waitForAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(true);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(!!user);
    });
  });
};

// Helper function to remove undefined values from object
const removeUndefinedValues = <T extends Record<string, any>>(obj: T): Partial<T> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
};

// Types for Quality Control
export interface QualityControlFormData {
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
  palettes: any[];
  tolerance?: any;
  // Enhanced data structure
  calculatedResults?: {
    minCharacteristics: number;
    totalDefects: number;
    missingBrokenGrains: number;
    weightConformity: number;
    isConform: boolean;
  };
  averages?: {
    [key: string]: string;
  };
  submissionMetadata?: {
    submittedBy: string;
    submittedAt: string;
    paletteCount: number;
    activeTab: number;
    browserInfo: string;
    version: string;
  };
}

export interface QualityControlLot {
  id: string;
  lotNumber: string;
  formData: QualityControlFormData;
  images: string[]; // URLs of uploaded images
  imageFiles?: File[]; // Temporary files before upload
  status: 'draft' | 'completed' | 'submitted' | 'chief_approved' | 'chief_rejected';
  phase: 'controller' | 'chief'; // Added phase tracking
  createdAt: string;
  updatedAt: string;
  controller?: string;
  chief?: string;
  chiefComments?: string;
  chiefApprovalDate?: string;
}

export interface QualityControlReport {
  id: string;
  lotId: string;
  date: string;
  controller: string;
  chief: string;
  calibres: (string | number)[];
  images: Record<string, string[]>; // URLs organized by calibre
  testResults: Record<string, any>;
  pdfController?: string;
  pdfChief?: string;
  status: string;
  submittedAt: string;
  phase: 'controller' | 'chief';
  chiefComments?: string;
  chiefApprovalDate?: string;
}

export interface QualityRapport {
  id: string;
  lotNumber: string;
  date: string;
  controller: string;
  palletNumber: string;
  calibres: (string | number)[];
  images: Record<string | number, string[]>; // URLs organized by calibre
  testResults: Record<string | number, any>;
  status: 'draft' | 'completed' | 'submitted' | 'chief_approved' | 'chief_rejected';
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  pdfUrl?: string;
  archivedAt?: string;
  chiefComments?: string;
  chiefApprovalDate?: string;
}

// Collections
const QUALITY_CONTROL_COLLECTION = 'quality_control_lots';
const QUALITY_REPORTS_COLLECTION = 'quality_reports';

// Helper function to convert Firestore timestamp to ISO string
const timestampToISOString = (timestamp: any) => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Comprehensive Firebase test function
export const testFirebaseComprehensive = async (): Promise<void> => {
  try {
    console.log('🧪 COMPREHENSIVE FIREBASE TEST STARTED');
    console.log('=====================================');
    
    // 1. Authentication check
    console.log('🔐 1. Checking authentication...');
    await checkUserPermissions();
    
    // 2. Storage connection test
    console.log('🔗 2. Testing Firebase Storage connection...');
    try {
      const testRef = ref(storage, '.test-connection');
      console.log('✅ Storage connection successful');
    } catch (error) {
      console.error('❌ Storage connection failed:', error);
      throw error;
    }
    
    // 3. Create test file
    console.log('📁 3. Creating test file...');
    const testContent = 'test file content';
    const testBlob = new Blob([testContent], { type: 'image/jpeg' });
    const testFile = new File([testBlob], 'test-image.jpg', { type: 'image/jpeg' });
    
    // 4. Test simple upload
    console.log('⬆️ 4. Testing simple upload...');
    const simpleUrl = await testSimpleUpload(testFile);
    console.log('✅ Simple upload successful:', simpleUrl);
    
    // 5. Test QC path with numeric calibre
    console.log('🎯 5. Testing QC path with numeric calibre...');
    const qcUrlNumeric = await testQualityControlPathUpload(testFile, 'test-lot-123', '12');
    console.log('✅ QC numeric calibre upload successful:', qcUrlNumeric);
    
    // 6. Test QC path with N/A calibre (should be cleaned to NA)
    console.log('🎯 6. Testing QC path with N/A calibre...');
    const qcUrlNA = await testQualityControlPathUpload(testFile, 'test-lot-456', 'N/A');
    console.log('✅ QC N/A calibre upload successful:', qcUrlNA);
    
    console.log('🎉 ALL TESTS PASSED! Firebase uploads are working correctly.');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ COMPREHENSIVE TEST FAILED:', error);
    throw error;
  }
};

// Helper function to check user permissions and custom claims
export const checkUserPermissions = async (): Promise<void> => {
  try {
    console.log('🔍 Checking user permissions...');
    
    if (!auth.currentUser) {
      throw new Error('No user authenticated');
    }
    
    const user = auth.currentUser;
    console.log('User info:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName
    });
    
    // Get the ID token to check custom claims
    const idTokenResult = await user.getIdTokenResult();
    console.log('Custom claims:', idTokenResult.claims);
    
    // Check if user has quality control permissions
    const hasRole = idTokenResult.claims.role;
    const isEmailVerified = idTokenResult.claims.email_verified || user.emailVerified;
    
    console.log('Permission analysis:', {
      hasCustomRole: !!hasRole,
      role: hasRole || 'none',
      emailVerified: isEmailVerified,
      tokenExpiration: idTokenResult.expirationTime
    });
    
    if (!hasRole) {
      console.warn('⚠️ User has no custom role assigned. This may cause permission issues.');
    }
    
    if (!isEmailVerified) {
      console.warn('⚠️ User email is not verified. This may cause permission issues.');
    }
    
    console.log('✅ User permission check completed');
    
  } catch (error) {
    console.error('❌ Error checking user permissions:', error);
    throw error;
  }
};

// Simple upload test function using uploadBytes instead of uploadBytesResumable
export const testSimpleUpload = async (file: File): Promise<string> => {
  try {
    console.log('🧪 Testing simple upload approach...');
    
    // Check auth
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    
    console.log('✅ Auth check passed');
    
    // Create a simple test path that should definitely be allowed
    const testPath = `test-uploads/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, testPath);
    
    console.log('📁 Upload path:', testPath);
    console.log('📊 File info:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)}KB`,
      type: file.type
    });
    
    // Try simple uploadBytes (not resumable)
    console.log('⬆️ Starting simple upload...');
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Upload completed successfully!');
    
    // Get download URL
    console.log('🔗 Getting download URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Download URL obtained:', downloadURL);
    
    return downloadURL;
    
  } catch (error) {
    console.error('❌ Simple upload failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    throw error;
  }
};

// Test quality control path upload
export const testQualityControlPathUpload = async (file: File, lotId: string, calibre: string): Promise<string> => {
  try {
    console.log('🎯 Testing quality control path upload...');
    
    // Check auth
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    
    console.log('✅ Auth check passed');
    
    // Use the exact same path structure as the main upload function
    const timestamp = Date.now();
    const fileName = `${file.name}_${timestamp}`;
    
    // Clean calibre value for file path (replace N/A with NA to avoid path issues)
    const cleanCalibre = calibre ? calibre.replace(/[^a-zA-Z0-9]/g, '') : 'unknown';
    const storagePath = `quality_control/calibres/${lotId}/${cleanCalibre}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    console.log('📁 QC Upload path:', storagePath);
    console.log('📊 File info:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)}KB`,
      type: file.type
    });
    
    // Try simple uploadBytes (not resumable)
    console.log('⬆️ Starting QC path upload...');
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ QC Upload completed successfully!');
    
    // Get download URL
    console.log('🔗 Getting download URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Download URL obtained:', downloadURL);
    
    return downloadURL;
    
  } catch (error) {
    console.error('❌ QC path upload failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    throw error;
  }
};

// Upload image to Firebase Storage
export const uploadQualityControlImage = async (
  file: File, 
  lotId: string, 
  imageType: 'lot' | 'calibre' | 'test',
  calibre?: string
): Promise<string> => {
  try {
    console.log(`Starting upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Ensure user is authenticated
    const isAuthenticated = await waitForAuth();
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to upload images');
    }
    console.log('Authentication verified');

    // Test Firebase Storage connection
    try {
      console.log('Testing Firebase Storage connection...');
      const testRef = ref(storage, '.test-connection');
      console.log('Storage reference test successful');
    } catch (storageError) {
      console.error('Firebase Storage connection failed:', storageError);
      throw new Error(`Storage connection failed: ${(storageError as Error).message}`);
    }

    const timestamp = Date.now();
    const fileName = `${file.name}_${timestamp}`;
    
    // Clean calibre value for file path (replace N/A with NA to avoid path issues)
    const cleanCalibre = calibre ? calibre.replace(/[^a-zA-Z0-9]/g, '') : 'unknown';
    
    let storagePath = '';
    if (imageType === 'lot') {
      storagePath = `quality_control/lots/${lotId}/images/${fileName}`;
    } else if (imageType === 'calibre' && calibre) {
      // Updated path to match storage rules with clean calibre name
      storagePath = `quality_control/calibres/${lotId}/${cleanCalibre}/${fileName}`;
    } else if (imageType === 'test' && calibre) {
      storagePath = `quality_control/tests/${lotId}/${cleanCalibre}/${fileName}`;
    }
    
    console.log(`Upload path: ${storagePath}`);
    
    const storageRef = ref(storage, storagePath);
    console.log('Storage reference created, starting upload...');
    
    try {
      console.log('Starting direct upload using uploadBytes...');
      console.log('File details:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      });
      console.log('Storage path:', storagePath);
      console.log('User auth info:', {
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified
      });
      
      // Use uploadBytes instead of uploadBytesResumable to avoid hanging issues
      const snapshot = await uploadBytes(storageRef, file);
      console.log('✅ Upload completed successfully!');
      console.log('Upload snapshot metadata:', {
        bucket: snapshot.metadata.bucket,
        fullPath: snapshot.metadata.fullPath,
        size: snapshot.metadata.size,
        contentType: snapshot.metadata.contentType,
        timeCreated: snapshot.metadata.timeCreated
      });
      
      console.log('Getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Download URL obtained successfully:', downloadURL);
      
      // Verify the file exists by trying to get its metadata
      console.log('Verifying file exists in Firebase Storage...');
      try {
        const { getMetadata } = await import('firebase/storage');
        const metadata = await getMetadata(snapshot.ref);
        console.log('✅ File verified in storage:', {
          name: metadata.name,
          bucket: metadata.bucket,
          fullPath: metadata.fullPath,
          size: metadata.size,
          updated: metadata.updated
        });
      } catch (metadataError) {
        console.warn('Could not verify file metadata:', metadataError);
        // Not critical, continue anyway
      }
      
      return downloadURL;
    } catch (uploadError) {
      console.error('❌ Upload failed with error:', uploadError);
      
      // Enhanced error analysis
      if (uploadError instanceof Error) {
        console.error('Error details:', {
          name: uploadError.name,
          message: uploadError.message,
          stack: uploadError.stack
        });
        
        // Check for specific Firebase errors
        if (uploadError.message.includes('storage/unauthorized')) {
          console.error('🚫 AUTHORIZATION ERROR: User does not have permission to upload to this path');
          console.error('Check Firebase Storage rules and user permissions');
        } else if (uploadError.message.includes('storage/canceled')) {
          console.error('🚫 UPLOAD CANCELED: Upload was canceled');
        } else if (uploadError.message.includes('storage/unknown')) {
          console.error('🚫 UNKNOWN ERROR: Unknown Firebase Storage error');
        } else if (uploadError.message.includes('storage/invalid-format')) {
          console.error('🚫 INVALID FORMAT: File format not allowed');
        } else if (uploadError.message.includes('storage/object-not-found')) {
          console.error('🚫 PATH ERROR: Upload path not found or invalid');
        } else if (uploadError.message.includes('network')) {
          console.error('🚫 NETWORK ERROR: Network connection issue');
        }
      }
      
      throw new Error(`Upload failed: ${(uploadError as Error).message}`);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lotId,
      imageType,
      calibre
    });
    throw error;
  }
};

// Upload multiple images for a calibre
export const uploadCalibreImages = async (
  files: File[], 
  lotId: string, 
  calibre: string
): Promise<string[]> => {
  try {
    console.log(`Starting upload of ${files.length} images for calibre ${calibre} in lot ${lotId}`);
    
    const uploadPromises = files.map((file, index) => {
      console.log(`Creating upload promise for image ${index + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return uploadQualityControlImage(file, lotId, 'calibre', calibre);
    });
    
    console.log('Waiting for all uploads to complete...');
    const urls = await Promise.all(uploadPromises);
    console.log(`Successfully uploaded ${urls.length} images. URLs:`, urls);
    return urls;
  } catch (error) {
    console.error('Error uploading calibre images:', error);
    throw error;
  }
};

// Save Quality Control Lot to Firestore
export const saveQualityControlLot = async (lot: QualityControlLot): Promise<string> => {
  try {
    // Ensure user is authenticated
    const isAuthenticated = await waitForAuth();
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to save quality control lot');
    }

    // Validate required fields
    if (!lot.lotNumber || !lot.formData) {
      throw new Error('Lot number and form data are required');
    }

    // Validate form data structure
    const requiredFields = ['date', 'product', 'variety', 'campaign'];
    for (const field of requiredFields) {
      if (!lot.formData[field as keyof QualityControlFormData]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }

    // Clean up data to remove undefined values
    const cleanData = removeUndefinedValues(lot);

    // Prepare comprehensive lot data for Firebase
    const lotData = {
      ...cleanData,
      // Ensure all required fields are present
      lotNumber: lot.lotNumber,
      formData: {
        ...lot.formData,
        // Ensure palettes array exists
        palettes: lot.formData.palettes || [],
        // Add metadata if not present
        submissionMetadata: lot.formData.submissionMetadata || {
          submittedAt: new Date().toISOString(),
          version: "2.0"
        }
      },
      images: lot.images || [],
      status: lot.status || 'draft',
      phase: lot.phase || 'controller',
      updatedAt: serverTimestamp(),
      createdAt: lot.createdAt ? Timestamp.fromDate(new Date(lot.createdAt)) : serverTimestamp(),
      // Add Firebase-specific metadata
      firebaseMetadata: {
        lastSyncAt: serverTimestamp(),
        syncVersion: "2.0",
        dataSize: JSON.stringify(lot.formData).length,
        imageCount: (lot.images || []).length
      }
    };
    
    // Check if the ID looks like a temporary ID (starts with 'lot-' followed by timestamp)
    const isTemporaryId = lot.id.startsWith('lot-') && /^lot-\d+$/.test(lot.id);
    
    if (lot.id && !isTemporaryId) {
      // Check if document exists before updating
      const docRef = doc(db, QUALITY_CONTROL_COLLECTION, lot.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Update existing lot
        console.log('Updating existing lot:', lot.id);
        await updateDoc(docRef, lotData);
        return lot.id;
      } else {
        // Document doesn't exist, create new one
        console.log('Creating new lot (document not found):', lot.id);
        const newDocRef = await addDoc(collection(db, QUALITY_CONTROL_COLLECTION), lotData);
        return newDocRef.id;
      }
    } else {
      // Create new lot (for temporary IDs or no ID)
      console.log('Creating new lot (temporary ID):', lot.id);
      const docRef = await addDoc(collection(db, QUALITY_CONTROL_COLLECTION), lotData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving quality control lot:', error);
    
    // Enhanced error messages
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        throw new Error('Accès refusé. Vérifiez vos permissions Firebase.');
      } else if (error.message.includes('unavailable')) {
        throw new Error('Service Firebase temporairement indisponible. Réessayez plus tard.');
      } else if (error.message.includes('network')) {
        throw new Error('Erreur de connexion réseau. Vérifiez votre connexion internet.');
      }
    }
    
    throw error;
  }
};

// Get Quality Control Lot by ID
export const getQualityControlLot = async (lotId: string): Promise<QualityControlLot | null> => {
  try {
    const docRef = doc(db, QUALITY_CONTROL_COLLECTION, lotId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        lotNumber: data.lotNumber,
        formData: data.formData,
        images: data.images || [],
        status: data.status,
        phase: data.phase || 'controller',
        createdAt: timestampToISOString(data.createdAt),
        updatedAt: timestampToISOString(data.updatedAt),
        controller: data.controller,
        chief: data.chief,
        chiefComments: data.chiefComments,
        chiefApprovalDate: data.chiefApprovalDate
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting quality control lot:', error);
    throw error;
  }
};

// Get all Quality Control Lots
export const getQualityControlLots = async (phase?: 'controller' | 'chief'): Promise<QualityControlLot[]> => {
  try {
    let q;
    
    if (phase) {
      // Use separate queries to avoid composite index requirement
      q = query(
        collection(db, QUALITY_CONTROL_COLLECTION),
        where('phase', '==', phase),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, QUALITY_CONTROL_COLLECTION),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const lots: QualityControlLot[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      lots.push({
        id: doc.id,
        lotNumber: data.lotNumber,
        formData: data.formData,
        images: data.images || [],
        status: data.status,
        phase: data.phase || 'controller',
        createdAt: timestampToISOString(data.createdAt),
        updatedAt: timestampToISOString(data.updatedAt),
        controller: data.controller,
        chief: data.chief,
        chiefComments: data.chiefComments,
        chiefApprovalDate: data.chiefApprovalDate
      });
    });
    
    return lots;
  } catch (error) {
    console.error('Error getting quality control lots:', error);
    // If there's an index error, fall back to a simple query
    if (error instanceof Error && error.message.includes('index')) {
      console.warn('Using fallback query due to index issue');
      try {
        const q = query(
          collection(db, QUALITY_CONTROL_COLLECTION),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const lots: QualityControlLot[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Filter by phase on the client side if needed
          if (!phase || data.phase === phase) {
            lots.push({
              id: doc.id,
              lotNumber: data.lotNumber,
              formData: data.formData,
              images: data.images || [],
              status: data.status,
              phase: data.phase || 'controller',
              createdAt: timestampToISOString(data.createdAt),
              updatedAt: timestampToISOString(data.updatedAt),
              controller: data.controller,
              chief: data.chief,
              chiefComments: data.chiefComments,
              chiefApprovalDate: data.chiefApprovalDate
            });
          }
        });
        
        return lots;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
};

// Get lots pending chief approval
export const getLotsForChiefApproval = async (): Promise<QualityControlLot[]> => {
  try {
    // Try the original query first
    const q = query(
      collection(db, QUALITY_CONTROL_COLLECTION),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const lots: QualityControlLot[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter for controller phase on client side to avoid composite index
      if (data.phase === 'controller' || !data.phase) {
        lots.push({
          id: doc.id,
          lotNumber: data.lotNumber,
          formData: data.formData,
          images: data.images || [],
          status: data.status,
          phase: data.phase || 'controller',
          createdAt: timestampToISOString(data.createdAt),
          updatedAt: timestampToISOString(data.updatedAt),
          controller: data.controller,
          chief: data.chief,
          chiefComments: data.chiefComments,
          chiefApprovalDate: data.chiefApprovalDate
        });
      }
    });
    
    return lots;
  } catch (error) {
    console.error('Error getting lots for chief approval:', error);
    
    // Fallback: get all lots and filter client-side
    try {
      console.log('Using fallback query for chief approval lots...');
      const fallbackQ = query(
        collection(db, QUALITY_CONTROL_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(fallbackQ);
      const lots: QualityControlLot[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter for completed status and controller phase
        if (data.status === 'completed' && (data.phase === 'controller' || !data.phase)) {
          lots.push({
            id: doc.id,
            lotNumber: data.lotNumber,
            formData: data.formData,
            images: data.images || [],
            status: data.status,
            phase: data.phase || 'controller',
            createdAt: timestampToISOString(data.createdAt),
            updatedAt: timestampToISOString(data.updatedAt),
            controller: data.controller,
            chief: data.chief,
            chiefComments: data.chiefComments,
            chiefApprovalDate: data.chiefApprovalDate
          });
        }
      });
      
      return lots;
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      throw fallbackError;
    }
  }
};

// Chief approve/reject lot
export const chiefApproveLot = async (
  lotId: string,
  approved: boolean,
  chiefName: string,
  comments?: string
): Promise<void> => {
  try {
    const status = approved ? 'chief_approved' : 'chief_rejected';
    
    await updateDoc(doc(db, QUALITY_CONTROL_COLLECTION, lotId), {
      status,
      phase: 'chief',
      chief: chiefName,
      chiefComments: comments || '',
      chiefApprovalDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating lot approval:', error);
    throw error;
  }
};

// Save Quality Control Report to Firestore
export const saveQualityControlReport = async (report: QualityControlReport): Promise<string> => {
  try {
    // Clean up data to remove undefined values
    const cleanData = removeUndefinedValues(report);
    
    const reportData = {
      ...cleanData,
      submittedAt: report.submittedAt ? Timestamp.fromDate(new Date(report.submittedAt)) : serverTimestamp(),
      chiefApprovalDate: report.chiefApprovalDate ? Timestamp.fromDate(new Date(report.chiefApprovalDate)) : null
    };
    
    if (report.id && report.id !== `report-${Date.now()}`) {
      // Update existing report
      await updateDoc(doc(db, QUALITY_REPORTS_COLLECTION, report.id), reportData);
      return report.id;
    } else {
      // Create new report
      const docRef = await addDoc(collection(db, QUALITY_REPORTS_COLLECTION), reportData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving quality control report:', error);
    throw error;
  }
};

// Get Quality Control Reports
export const getQualityControlReports = async (phase?: 'controller' | 'chief'): Promise<QualityControlReport[]> => {
  try {
    let q = query(
      collection(db, QUALITY_REPORTS_COLLECTION),
      orderBy('submittedAt', 'desc')
    );
    
    if (phase) {
      q = query(
        collection(db, QUALITY_REPORTS_COLLECTION),
        where('phase', '==', phase),
        orderBy('submittedAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const reports: QualityControlReport[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        lotId: data.lotId,
        date: data.date,
        controller: data.controller,
        chief: data.chief,
        calibres: data.calibres,
        images: data.images || {},
        testResults: data.testResults || {},
        pdfController: data.pdfController,
        pdfChief: data.pdfChief,
        status: data.status,
        submittedAt: timestampToISOString(data.submittedAt),
        phase: data.phase || 'controller',
        chiefComments: data.chiefComments,
        chiefApprovalDate: data.chiefApprovalDate ? timestampToISOString(data.chiefApprovalDate) : undefined
      });
    });
    
    return reports;
  } catch (error) {
    console.error('Error getting quality control reports:', error);
    throw error;
  }
};

// Delete Quality Control Lot
export const deleteQualityControlLot = async (lotId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, QUALITY_CONTROL_COLLECTION, lotId));
  } catch (error) {
    console.error('Error deleting quality control lot:', error);
    throw error;
  }
};

// Delete image from Firebase Storage
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    throw error;
  }
};

// ===== RAPPORT MANAGEMENT FUNCTIONS =====

const RAPPORT_COLLECTION = 'qualityRapports';

// Save Quality Rapport to Firestore
export const saveQualityRapport = async (rapport: Omit<QualityRapport, 'id'>): Promise<string> => {
  try {
    const isAuth = await waitForAuth();
    if (!isAuth) {
      throw new Error('User not authenticated');
    }

    const cleanedRapport = removeUndefinedValues({
      ...rapport,
      createdAt: Timestamp.fromDate(new Date(rapport.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(rapport.updatedAt)),
      submittedAt: rapport.submittedAt ? Timestamp.fromDate(new Date(rapport.submittedAt)) : null,
      archivedAt: rapport.archivedAt ? Timestamp.fromDate(new Date(rapport.archivedAt)) : null
    });

    const docRef = await addDoc(collection(db, RAPPORT_COLLECTION), cleanedRapport);
    return docRef.id;
  } catch (error) {
    console.error('Error saving quality rapport:', error);
    throw error;
  }
};

// Update Quality Rapport
export const updateQualityRapport = async (rapportId: string, updates: Partial<QualityRapport>): Promise<void> => {
  try {
    const isAuth = await waitForAuth();
    if (!isAuth) {
      throw new Error('User not authenticated');
    }

    // Check if document exists before updating
    const docRef = doc(db, RAPPORT_COLLECTION, rapportId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Quality rapport with ID ${rapportId} not found`);
    }

    const cleanedUpdates = removeUndefinedValues({
      ...updates,
      updatedAt: serverTimestamp(),
      submittedAt: updates.submittedAt ? Timestamp.fromDate(new Date(updates.submittedAt)) : undefined,
      archivedAt: updates.archivedAt ? Timestamp.fromDate(new Date(updates.archivedAt)) : undefined
    });

    await updateDoc(docRef, cleanedUpdates);
  } catch (error) {
    console.error('Error updating quality rapport:', error);
    throw error;
  }
};

// Get Quality Rapports
export const getQualityRapports = async (): Promise<QualityRapport[]> => {
  try {
    const isAuth = await waitForAuth();
    if (!isAuth) {
      throw new Error('User not authenticated');
    }

    const q = query(collection(db, RAPPORT_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const rapports: QualityRapport[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      rapports.push({
        id: doc.id,
        lotNumber: data.lotNumber,
        date: data.date,
        controller: data.controller,
        palletNumber: data.palletNumber,
        calibres: data.calibres,
        images: data.images || {},
        testResults: data.testResults || {},
        status: data.status,
        createdAt: timestampToISOString(data.createdAt),
        updatedAt: timestampToISOString(data.updatedAt),
        submittedAt: data.submittedAt ? timestampToISOString(data.submittedAt) : undefined,
        pdfUrl: data.pdfUrl,
        archivedAt: data.archivedAt ? timestampToISOString(data.archivedAt) : undefined
      });
    });

    return rapports;
  } catch (error) {
    console.error('Error getting quality rapports:', error);
    throw error;
  }
};

// Bulk save multiple lots to Firebase
export const bulkSaveQualityControlLots = async (lots: QualityControlLot[]): Promise<string[]> => {
  try {
    const isAuthenticated = await waitForAuth();
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to bulk save lots');
    }

    const savePromises = lots.map(lot => saveQualityControlLot(lot));
    const savedIds = await Promise.all(savePromises);
    
    console.log(`Successfully bulk saved ${savedIds.length} lots to Firebase`);
    return savedIds;
  } catch (error) {
    console.error('Error bulk saving lots:', error);
    throw error;
  }
};

// Get lot by lot number (for duplicate checking)
export const getQualityControlLotByNumber = async (lotNumber: string): Promise<QualityControlLot | null> => {
  try {
    const q = query(
      collection(db, QUALITY_CONTROL_COLLECTION),
      where('lotNumber', '==', lotNumber)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        lotNumber: data.lotNumber,
        formData: data.formData,
        images: data.images || [],
        status: data.status,
        phase: data.phase || 'controller',
        createdAt: timestampToISOString(data.createdAt),
        updatedAt: timestampToISOString(data.updatedAt),
        controller: data.controller,
        chief: data.chief,
        chiefComments: data.chiefComments,
        chiefApprovalDate: data.chiefApprovalDate
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting lot by number:', error);
    throw error;
  }
};

// Sync local data to Firebase (for offline/online sync)
export const syncLocalDataToFirebase = async (localLots: QualityControlLot[]): Promise<{
  synced: string[];
  failed: Array<{id: string; error: string}>;
}> => {
  try {
    const isAuthenticated = await waitForAuth();
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to sync data');
    }

    const results = {
      synced: [] as string[],
      failed: [] as Array<{id: string; error: string}>
    };

    // Process lots one by one to handle individual failures
    for (const lot of localLots) {
      try {
        const savedId = await saveQualityControlLot(lot);
        results.synced.push(savedId);
        console.log(`Successfully synced lot ${lot.lotNumber} with ID ${savedId}`);
      } catch (error) {
        results.failed.push({
          id: lot.id,
          error: (error as Error).message
        });
        console.error(`Failed to sync lot ${lot.lotNumber}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error syncing local data to Firebase:', error);
    throw error;
  }
};

// Get comprehensive lot statistics
export const getQualityControlStatistics = async (): Promise<{
  totalLots: number;
  completedLots: number;
  draftLots: number;
  submittedLots: number;
  lotsByStatus: Record<string, number>;
  recentActivity: QualityControlLot[];
}> => {
  try {
    const lots = await getQualityControlLots();
    
    const stats = {
      totalLots: lots.length,
      completedLots: lots.filter(l => l.status === 'completed').length,
      draftLots: lots.filter(l => l.status === 'draft').length,
      submittedLots: lots.filter(l => l.status === 'submitted').length,
      lotsByStatus: {} as Record<string, number>,
      recentActivity: lots.slice(0, 10) // Last 10 lots
    };

    // Count by status
    lots.forEach(lot => {
      stats.lotsByStatus[lot.status] = (stats.lotsByStatus[lot.status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
};

// Get Quality Control Lots formatted for Rapport page
export const getQualityControlLotsForRapport = async (): Promise<QualityRapportLot[]> => {
  try {
    // Get all lots and filter on client side to avoid composite index requirement
    const q = query(
      collection(db, QUALITY_CONTROL_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const rapportLots: QualityRapportLot[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filter for completed and submitted lots on client side
      if (!data.status || (data.status !== 'completed' && data.status !== 'submitted')) {
        return; // Skip this lot
      }
      
      // Extract calibres from palettes data
      const calibres: (string | number)[] = [];
      if (data.formData && data.formData.palettes) {
        data.formData.palettes.forEach((palette: any) => {
          if (palette.size && palette.size !== '0' && palette.size !== '') {
            // Only add unique calibres
            if (!calibres.includes(palette.size)) {
              calibres.push(palette.size);
            }
          }
        });
      }
      
      // Sort calibres numerically if they are numbers
      calibres.sort((a, b) => {
        const numA = parseInt(String(a));
        const numB = parseInt(String(b));
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return String(a).localeCompare(String(b));
      });
      
      rapportLots.push({
        id: doc.id,
        lotNumber: data.lotNumber || doc.id,
        date: data.formData?.date || timestampToISOString(data.createdAt).split('T')[0],
        controller: data.controller || 'Unknown Controller',
        palletNumber: data.formData?.shipmentNumber || data.formData?.clientLot || 'N/A',
        calibres: calibres.length > 0 ? calibres : ['N/A'],
        status: data.status,
        formData: data.formData,
        images: data.images || [],
        submittedAt: data.submittedAt || timestampToISOString(data.updatedAt)
      });
    });
    
    console.log(`Found ${rapportLots.length} lots ready for rapport processing`);
    return rapportLots;
  } catch (error) {
    console.error('Error getting quality control lots for rapport:', error);
    
    // Fallback: try to get just completed lots
    try {
      console.log('Trying fallback query for completed lots only...');
      const fallbackQ = query(
        collection(db, QUALITY_CONTROL_COLLECTION),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(fallbackQ);
      const rapportLots: QualityRapportLot[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Extract calibres from palettes data
        const calibres: (string | number)[] = [];
        if (data.formData && data.formData.palettes) {
          data.formData.palettes.forEach((palette: any) => {
            if (palette.size && palette.size !== '0' && palette.size !== '') {
              if (!calibres.includes(palette.size)) {
                calibres.push(palette.size);
              }
            }
          });
        }
        
        calibres.sort((a, b) => {
          const numA = parseInt(String(a));
          const numB = parseInt(String(b));
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return String(a).localeCompare(String(b));
        });
        
        rapportLots.push({
          id: doc.id,
          lotNumber: data.lotNumber || doc.id,
          date: data.formData?.date || timestampToISOString(data.createdAt).split('T')[0],
          controller: data.controller || 'Unknown Controller',
          palletNumber: data.formData?.shipmentNumber || data.formData?.clientLot || 'N/A',
          calibres: calibres.length > 0 ? calibres : ['N/A'],
          status: data.status,
          formData: data.formData,
          images: data.images || [],
          submittedAt: data.submittedAt || timestampToISOString(data.updatedAt)
        });
      });
      
      console.log(`Fallback query found ${rapportLots.length} completed lots`);
      return rapportLots;
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      
      // Final fallback: get all lots without any filtering
      try {
        console.log('Trying final fallback - get all lots...');
        const allLotsQ = query(collection(db, QUALITY_CONTROL_COLLECTION));
        const querySnapshot = await getDocs(allLotsQ);
        const rapportLots: QualityRapportLot[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Only include lots with some data
          if (!data.formData) return;
          
          const calibres: (string | number)[] = [];
          if (data.formData.palettes) {
            data.formData.palettes.forEach((palette: any) => {
              if (palette.size && palette.size !== '0' && palette.size !== '') {
                if (!calibres.includes(palette.size)) {
                  calibres.push(palette.size);
                }
              }
            });
          }
          
          calibres.sort((a, b) => {
            const numA = parseInt(String(a));
            const numB = parseInt(String(b));
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return String(a).localeCompare(String(b));
          });
          
          rapportLots.push({
            id: doc.id,
            lotNumber: data.lotNumber || doc.id,
            date: data.formData?.date || timestampToISOString(data.createdAt || new Date()).split('T')[0],
            controller: data.controller || 'Unknown Controller',
            palletNumber: data.formData?.shipmentNumber || data.formData?.clientLot || 'N/A',
            calibres: calibres.length > 0 ? calibres : ['N/A'],
            status: data.status || 'draft',
            formData: data.formData,
            images: data.images || [],
            submittedAt: data.submittedAt || timestampToISOString(data.updatedAt || new Date())
          });
        });
        
        // Sort by date manually
        rapportLots.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log(`Final fallback found ${rapportLots.length} total lots`);
        return rapportLots;
      } catch (finalError) {
        console.error('All queries failed:', finalError);
        throw new Error('Unable to load lots from Firebase. Please check your connection and try again.');
      }
    }
  }
};

// Interface for rapport lots (compatible with existing code)
export interface QualityRapportLot {
  id: string;
  lotNumber: string;
  date: string;
  controller: string;
  palletNumber: string;
  calibres: (string | number)[];
  status: string;
  formData?: any;
  images?: string[] | File[];
  submittedAt?: string;
}

// Get Quality Rapport by ID
export const getQualityRapportById = async (rapportId: string): Promise<QualityRapport | null> => {
  try {
    const isAuth = await waitForAuth();
    if (!isAuth) {
      throw new Error('User not authenticated');
    }

    const docRef = doc(db, RAPPORT_COLLECTION, rapportId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        lotNumber: data.lotNumber,
        date: data.date,
        controller: data.controller,
        palletNumber: data.palletNumber,
        calibres: data.calibres,
        images: data.images || {},
        testResults: data.testResults || {},
        status: data.status,
        createdAt: timestampToISOString(data.createdAt),
        updatedAt: timestampToISOString(data.updatedAt),
        submittedAt: data.submittedAt ? timestampToISOString(data.submittedAt) : undefined,
        pdfUrl: data.pdfUrl,
        archivedAt: data.archivedAt ? timestampToISOString(data.archivedAt) : undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting quality rapport by ID:', error);
    throw error;
  }
};

// Export the service object
export const qualityControlService = {
  // Authentication Functions
  ensureAuthenticated,
  waitForAuth,
  
  // Quality Control Functions
  getQualityControlLots,
  getQualityControlLot,
  saveQualityControlLot,
  deleteQualityControlLot,
  getLotsForChiefApproval,
  chiefApproveLot,
  
  // Report Functions
  saveQualityControlReport,
  getQualityControlReports,
  
  // Image Functions
  uploadQualityControlImage,
  uploadCalibreImages,
  deleteImageFromStorage,
  
  // Rapport Management Functions
  saveQualityRapport,
  updateQualityRapport,
  getQualityRapports,
  getQualityRapportById
};
