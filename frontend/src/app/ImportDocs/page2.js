"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Upload,
  Book,
  UserCircle,
  LogOut,
  Image,
  File,
  X,
  Camera,
} from "lucide-react";
import { useRecoilState } from 'recoil';
import { logoutState } from '../../store/atom';
import JSZip from 'jszip';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";

const parseXMLAsync = promisify(parseString);

// Helper function to check file types
function getFileType(file) {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  } else if (file.type === 'application/epub+zip' || file.name.toLowerCase().endsWith('.epub')) {
    return 'epub';
  }
  return 'other';
}

// Convert EPUB to PDF
async function convertEpubToPdf(epubFile) {
  try {
    const arrayBuffer = await epubFile.arrayBuffer();
    const zip = new JSZip();
    const epub = await zip.loadAsync(arrayBuffer);
    
    // Read container.xml to find content location
    const containerXml = await epub.file('META-INF/container.xml').async('string');
    const containerData = await parseXMLAsync(containerXml);
    const opfPath = containerData.container.rootfiles[0].rootfile[0].$['full-path'];
    
    // Process EPUB content
    const opfContent = await epub.file(opfPath).async('string');
    const opfData = await parseXMLAsync(opfContent);
    
    // Here you would implement the actual conversion logic
    // For now, we'll throw an error as this requires additional implementation
    throw new Error('EPUB conversion not implemented');
    
  } catch (error) {
    console.error('Error converting EPUB to PDF:', error);
    throw error;
  }
}

const DocumentDashboard = () => {
  const [isLoggedOut, setIsLoggedOut] = useRecoilState(logoutState);
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [documentName, setDocumentName] = useState("");
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  // Webcam states
  const [showWebcam, setShowWebcam] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImages, setCapturedImages] = useState([]);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
      fetchUserDocuments();
    }
  }, []);

  useEffect(() => {
    if (showWebcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          return navigator.mediaDevices.enumerateDevices();
        })
        .then((deviceInfos) => {
          const videoDevices = deviceInfos.filter(
            (device) => device.kind === "videoinput"
          );
          setDevices(videoDevices);
          if (videoDevices.length > 0) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        })
        .catch((error) => console.error("Error accessing camera:", error));
    }
  }, [showWebcam]);

  useEffect(() => {
    if (selectedDeviceId && showWebcam) {
      navigator.mediaDevices
        .getUserMedia({
          video: { deviceId: selectedDeviceId },
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => console.error("Error accessing camera:", error));
    }
  }, [selectedDeviceId, showWebcam]);

  // Auth check effect
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggedOut) {
        try {
          const response = await fetch("https://jyoti-ai.com/api/me", {
            credentials: "include",
          });
          if (response.ok) {
            setIsLoggedOut(false);
          }
        } catch (error) {
          console.error(error);
          router.push("/");
        }
      }
    };

    checkAuth();
  }, [isLoggedOut, setIsLoggedOut, router]);

  const fetchUserDocuments = async () => {
    try {
      const response = await fetch("https://jyoti-ai.com/api/user-documents", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const docs = await response.json();
        setDocuments(docs);
      } else {
        console.error("Failed to fetch documents");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const promptForDocumentName = () => {
    return new Promise((resolve) => {
      const name = window.prompt("Enter a name for your document:", "Untitled Document");
      resolve(name || "Untitled Document");
    });
  };

  const handleDocumentSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = await promptForDocumentName();
    if (!name) return;

    setIsUploading(true);
    const formData = new FormData();

    try {
      let fileToUpload = file;
      const fileType = getFileType(file);

      if (fileType === 'epub') {
        const pdfBlob = await convertEpubToPdf(file);
        fileToUpload = new File([pdfBlob], file.name.replace('.epub', '.pdf'), {
          type: 'application/pdf'
        });
      } else if (fileType === 'pdf') {
        // Use the file as is - no conversion needed
        fileToUpload = file;
      } else {
        throw new Error('Unsupported file type');
      }

      formData.append("files", fileToUpload);
      formData.append("documentName", name);

      const response = await fetch("https://jyoti-ai.com/api/save-pdf", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      if (result.success && result.docId) {
        router.push(`/ReadDocs?id=${result.docId}`);
      } else {
        throw new Error("Missing document ID in response");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenDocument = (docId) => {
    router.push(`/ReadDocs?id=${docId}`);
  };

  // Image handling functions remain the same as in your original code
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      preview: URL.createObjectURL(file),
    }));
    setSelectedImages((prev) => [...prev, ...newImages]);
  };

  const handleRemoveImage = (id) => {
    setSelectedImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const handleRemoveCapturedImage = (id) => {
    setCapturedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageDataURL = canvas.toDataURL("image/png");
      const newImage = {
        id: Math.random().toString(36).substr(2, 9),
        dataURL: imageDataURL,
      };

      setCapturedImages((prev) => [...prev, newImage]);
    }
  };

  const handleImageUploadComplete = async () => {
    if (selectedImages.length === 0 && capturedImages.length === 0) {
      alert("Please select or capture at least one image");
      return;
    }

    const name = await promptForDocumentName();
    if (!name) return;

    setIsUploading(true);
    const formData = new FormData();

    // Add selected images from file input
    selectedImages.forEach((img) => {
      formData.append("files", img.file);
    });

    // Add captured images from webcam
    for (let img of capturedImages) {
      const response = await fetch(img.dataURL);
      const blob = await response.blob();
      formData.append("files", blob, `capture-${img.id}.png`);
    }

    formData.append("documentName", name);

    try {
      const response = await fetch("https://jyoti-ai.com/api/save-pdf", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      if (result.success && result.docId) {
        router.push(`/ReadDocs?id=${result.docId}`);
      } else {
        throw new Error("Missing document ID in response");
      }

      // Cleanup
      selectedImages.forEach((img) => URL.revokeObjectURL(img.preview));
      setSelectedImages([]);
      setCapturedImages([]);
      setShowWebcam(false);

      await fetchUserDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow rounded-lg p-6 h-full">
            <div className="flex items-center mb-6">
              <Book className="h-6 w-6 text-blue-600" />
              <h2 className="ml-2 text-lg font-semibold text-gray-900">
                HISTORY
              </h2>
            </div>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                >
                  <span className="text-gray-700 truncate w-4/5 overflow-hidden">
                    {doc.documentName || doc.id}
                  </span>
                  <button
                    onClick={() => handleOpenDocument(doc.id)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium flex-shrink-0"
                  >
                    OPEN
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 ml-8">
            <div className="bg-white shadow rounded-lg p-6">
              {/* Upload Options */}
              <div className="space-y-6">
                {/* Document Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleDocumentSelect}
                    accept=".pdf,.doc,.docx,.epub"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={isUploading}
                  >
                    <File className="h-5 w-5 mr-2" />
                    {isUploading ? "UPLOADING DOCUMENT..." : "IMPORT DOCUMENT"}
                  </button>
                </div>


                {/* Image Upload and Webcam Sections */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex justify-center space-x-4 mb-4">
                    <button
                      onClick={() => setShowWebcam(false)}
                      className={`px-4 py-2 rounded-lg ${
                        !showWebcam ? "bg-blue-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      Upload Images
                    </button>
                    <button
                      onClick={() => setShowWebcam(true)}
                      className={`px-4 py-2 rounded-lg ${
                        showWebcam ? "bg-blue-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      Use Webcam
                    </button>
                  </div>

                  {showWebcam ? (
                    // Webcam Section
                    <div className="space-y-4">
                      <select
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        value={selectedDeviceId}
                        className="w-full p-2 border-2 border-gray-300 rounded-lg"
                      >
                        {devices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId}`}
                          </option>
                        ))}
                      </select>

                      <div className="relative aspect-video">
                        <video
                          ref={videoRef}
                          autoPlay
                          className="w-full h-full rounded-lg"
                        />
                      </div>

                      <canvas ref={canvasRef} className="hidden" />

                      <button
                        onClick={captureImage}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Camera className="h-5 w-5 mr-2 inline" />
                        Capture Image
                      </button>
                    </div>
                  ) : (
                    // Image Upload Section
                    <>
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center justify-center w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-4"
                        disabled={isUploading}
                      >
                        <Image className="h-5 w-5 mr-2" />
                        SELECT IMAGES
                      </button>
                    </>
                  )}

                  {/* Combined Preview Section */}
                  {(selectedImages.length > 0 || capturedImages.length > 0) && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {/* Show uploaded images */}
                        {selectedImages.map((img) => (
                          <div key={img.id} className="relative">
                            <img
                              src={img.preview}
                              alt="preview"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleRemoveImage(img.id)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {/* Show captured images */}
                        {capturedImages.map((img) => (
                          <div key={img.id} className="relative">
                            <img
                              src={img.dataURL}
                              alt="captured"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleRemoveCapturedImage(img.id)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleImageUploadComplete}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          "UPLOADING..."
                        ) : (
                          <div className="flex items-center justify-center">
                            <Upload className="h-5 w-5 mr-2" />
                            DONE - CREATE DOCUMENT
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDashboard;
