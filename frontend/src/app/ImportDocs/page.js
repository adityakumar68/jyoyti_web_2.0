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
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";

// Helper function to check file type
function getFileType(file) {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }
  return 'other';
}

const DocumentDashboard = () => {
  const [isLoggedOut, setIsLoggedOut] = useRecoilState(logoutState);
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [tempFileData, setTempFileData] = useState(null);
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
      
    }
    fetchUserDocuments();
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

  const handleDocumentSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = getFileType(file);
    if (fileType !== 'pdf') {
      alert('Please select a PDF file');
      return;
    }

    setTempFileData({ type: 'document', file });
    setShowNameDialog(true);
  };

  const handleDocumentUpload = async () => {
    if (!tempFileData?.file || !documentName.trim()) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("files", tempFileData.file);
    formData.append("documentName", documentName.trim());

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
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
      setShowNameDialog(false);
      setDocumentName("");
      setTempFileData(null);
    }
  };

  const handleOpenDocument = (docId, docName) => {
    router.push(`/ReadDocs?id=${docId}&name=${encodeURIComponent(docName)}`);
  };

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

  const handleImageUploadComplete = () => {
    if (selectedImages.length === 0 && capturedImages.length === 0) {
      alert("Please select or capture at least one image");
      return;
    }

    setTempFileData({ type: 'images', selectedImages, capturedImages });
    setShowNameDialog(true);
  };

  const handleImagesUpload = async () => {
    if (!tempFileData || !documentName.trim()) return;

    setIsUploading(true);
    const formData = new FormData();

    // Add selected images from file input
    tempFileData.selectedImages.forEach((img) => {
      formData.append("files", img.file);
    });

    // Add captured images from webcam
    for (let img of tempFileData.capturedImages) {
      const response = await fetch(img.dataURL);
      const blob = await response.blob();
      formData.append("files", blob, `capture-${img.id}.png`);
    }

    formData.append("documentName", documentName.trim());

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
      tempFileData.selectedImages.forEach((img) => URL.revokeObjectURL(img.preview));
      setSelectedImages([]);
      setCapturedImages([]);
      setShowWebcam(false);

      await fetchUserDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
      setShowNameDialog(false);
      setDocumentName("");
      setTempFileData(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Change flex to flex-col on mobile, row on larger screens */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Sidebar - Full width on mobile, fixed width on desktop */}
        <div className="w-full lg:w-64 bg-white shadow rounded-lg p-4 lg:p-6">
          <div className="flex items-center mb-4 lg:mb-6">
            <Book className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            <h2 className="ml-2 text-base lg:text-lg font-semibold text-gray-900">
              HISTORY
            </h2>
          </div>
          {/* Make the document list scrollable on mobile */}
          <div className="space-y-3 max-h-48 lg:max-h-none overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex justify-between items-center p-2 lg:p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                onClick={() => handleOpenDocument(doc.id, doc.documentName)}
              >
                <span className="text-sm lg:text-base text-gray-700 truncate w-4/5">
                  {doc.documentName || "Untitled Document"}
                </span>
                <button className="px-2 py-1 lg:px-3 text-xs lg:text-sm text-blue-600 hover:text-blue-700 font-medium">
                  OPEN
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area - Full width on mobile */}
        <div className="flex-1">
          <div className="bg-white shadow rounded-lg p-4 lg:p-6">
            <div className="space-y-4 lg:space-y-6">
              {/* Document Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 lg:p-6 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleDocumentSelect}
                  accept=".pdf"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center w-full px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isUploading}
                >
                  <File className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                  {isUploading ? "UPLOADING..." : "IMPORT DOCUMENT"}
                </button>
              </div>

              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 lg:p-6">
                {/* Toggle Buttons */}
                <div className="flex justify-center space-x-2 lg:space-x-4 mb-4">
                  <button
                    onClick={() => setShowWebcam(false)}
                    className={`px-3 py-1.5 lg:px-4 lg:py-2 text-sm lg:text-base rounded-lg transition-colors ${
                      !showWebcam ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Upload Images
                  </button>
                  <button
                    onClick={() => setShowWebcam(true)}
                    className={`px-3 py-1.5 lg:px-4 lg:py-2 text-sm lg:text-base rounded-lg transition-colors ${
                      showWebcam ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Use Webcam
                  </button>
                </div>

                {showWebcam ? (
                  <div className="space-y-3 lg:space-y-4">
                    <select
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      value={selectedDeviceId}
                      className="w-full p-2 text-sm lg:text-base border-2 border-gray-300 rounded-lg"
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
                      className="w-full px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Camera className="h-4 w-4 lg:h-5 lg:w-5 mr-2 inline" />
                      Capture Image
                    </button>
                  </div>
                ) : (
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
                      className="flex items-center justify-center w-full px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-4"
                      disabled={isUploading}
                    >
                      <Image className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                      SELECT IMAGES
                    </button>
                  </>
                )}

                {/* Image Preview Grid */}
                {(selectedImages.length > 0 || capturedImages.length > 0) && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:gap-4 mb-4">
                      {selectedImages.map((img) => (
                        <div key={img.id} className="relative aspect-square">
                          <img
                            src={img.preview}
                            alt="preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveImage(img.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-3 w-3 lg:h-4 lg:w-4" />
                          </button>
                        </div>
                      ))}
                      {capturedImages.map((img) => (
                        <div key={img.id} className="relative aspect-square">
                          <img
                            src={img.dataURL}
                            alt="captured"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveCapturedImage(img.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-3 w-3 lg:h-4 lg:w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleImageUploadComplete}
                      className="w-full px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        "UPLOADING..."
                      ) : (
                        <div className="flex items-center justify-center">
                          <Upload className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
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

      {/* Modal - Keep existing modal code but adjust padding and text sizes */}
      {showNameDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowNameDialog(false);
                setDocumentName("");
                setTempFileData(null);
              }}
            ></div>

            <div className="inline-block w-full max-w-md p-4 lg:p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <h3 className="text-base lg:text-lg font-medium leading-6 text-gray-900 mb-3 lg:mb-4">
                Name Your Document
              </h3>
              <p className="text-xs lg:text-sm text-gray-500 mb-3 lg:mb-4">
                Please provide a name for your document to help you identify it later.
              </p>
              
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name..."
                className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              <div className="mt-4 lg:mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNameDialog(false);
                    setDocumentName("");
                    setTempFileData(null);
                  }}
                  className="px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tempFileData?.type === 'document') {
                      handleDocumentUpload();
                    } else if (tempFileData?.type === 'images') {
                      handleImagesUpload();
                    }
                  }}
                  disabled={!documentName.trim()}
                  className={`px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    documentName.trim()
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-400 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default DocumentDashboard;