"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Brain,
  Square,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

const DocumentReader = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get("id");
  
  const [isLoading, setIsLoading] = useState(false);
  const [documentQuizzes, setDocumentQuizzes] = useState([]);
  const [documentFlashcards, setDocumentFlashcards] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://jyoti-ai.com/api/get-document/${docId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const data = await response.json();
      const url = data.pdfUrl;
      setDocumentUrl(url);
      setDocumentQuizzes(data.quizzes || []);
      setDocumentFlashcards(data.flashcards || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching document:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) {
      fetchDocument();
    }
  }, [docId]);

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://jyoti-ai.com/api/get-mcq/${docId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startPage: currentPage,
          endPage: currentPage + 1,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate quiz");
      }

      const data = await response.json();
      router.push(`/McqTest?docId=${docId}&quizId=${data.quizId}`);
    } catch (error) {
      console.error("Error generating quiz:", error);
      alert(error.message || "Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (direction) => {
    if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePageInput = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className={`${isHistoryOpen ? "w-64" : "w-0"} transition-all duration-300 bg-white shadow-lg overflow-hidden`}>
          {isHistoryOpen && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Document Resources</h2>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quizzes Section */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <h3 className="ml-2 font-medium text-gray-900">Quizzes</h3>
                </div>
                <div className="space-y-2">
                  {documentQuizzes.length > 0 ? (
                    documentQuizzes.map((quiz) => (
                      <div
                        key={quiz.quizId}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                      >
                        <span className="text-sm text-gray-700 truncate">
                          {quiz.quizId}
                        </span>
                        <button
                          onClick={() => router.push(`/McqTest?docId=${docId}&quizId=${quiz.quizId}`)}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                        >
                          Open
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">No quizzes generated yet</p>
                  )}
                </div>
              </div>

              {/* Flashcards Section */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Square className="h-5 w-5 text-green-600" />
                  <h3 className="ml-2 font-medium text-gray-900">Flashcards</h3>
                </div>
                <div className="space-y-2">
                  {documentFlashcards.length > 0 ? (
                    documentFlashcards.map((flashcard) => (
                      <div
                        key={flashcard.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                      >
                        <span className="text-sm text-gray-700 truncate">
                          Flashcard Set #{flashcard.id}
                        </span>
                        <button
                          onClick={() => router.push(`/Flashcard?docId=${docId}&setId=${flashcard.id}`)}
                          className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                        >
                          Open
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">No flashcards created yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {!isHistoryOpen && (
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="mb-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* PDF Controls */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handlePageChange('prev')}
                    className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="px-4 flex items-center">
                    <input
                      type="number"
                      value={currentPage}
                      onChange={handlePageInput}
                      className="w-16 text-center bg-white border rounded px-2 py-1"
                    />
                    <span className="mx-2 text-gray-600">of {totalPages || '?'}</span>
                  </div>
                  <button
                    onClick={() => handlePageChange('next')}
                    className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 h-[800px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : documentUrl ? (
              <iframe
                src={`${documentUrl}#page=${currentPage}`}
                className="w-full h-full border-0 rounded-lg"
                title="PDF Viewer"
              />
            ) : (
              <div className="text-center text-gray-500">
                No document available
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <button className="bg-gray-50 hover:bg-gray-100 p-3 rounded-lg flex items-center justify-center transition-colors">
                <BookOpen className="h-5 w-5 mr-2" />
                SUMMARY
              </button>
              <button
                onClick={handleGenerateQuiz}
                disabled={isLoading}
                className="bg-gray-50 hover:bg-gray-100 p-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Brain className="h-5 w-5 mr-2" />
                {isLoading ? "GENERATING..." : "GENERATE QUIZ"}
              </button>
              <button className="bg-gray-50 hover:bg-gray-100 p-3 rounded-lg flex items-center justify-center transition-colors">
                <Square className="h-5 w-5 mr-2" />
                GENERATE FLASHCARD
              </button>
              <button className="bg-green-50 text-green-600 hover:bg-green-100 p-3 rounded-lg flex items-center justify-center transition-colors">
                <Brain className="h-5 w-5 mr-2" />
                AI TEACHER
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReader;