"use client";

import React, { useState, useEffect } from "react";
// To this:
import { Square as FlashCard, GraduationCap } from "lucide-react";

import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Brain,
  Square,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { useRecoilState } from "recoil";
import axios from "axios";
import { logoutState } from "../../store/atom";
const DocumentReader = () => {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isQuizExpanded, setIsQuizExpanded] = useState(false);
  const [isFlashcardsExpanded, setIsFlashcardsExpanded] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useRecoilState(logoutState);
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get("id");
  const [documentSummaries, setDocumentSummaries] = useState([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState("");
  const [currentSummary, setCurrentSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [documentQuizzes, setDocumentQuizzes] = useState([]);
  const [documentFlashcards, setDocumentFlashcards] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [rangeError, setRangeError] = useState("");
  const [mcqCount, setMcqCount] = useState("auto"); // Default to "auto"
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [questionType, setQuestionType] = useState("mcq"); // New state for question type
  const SectionHeader = ({ title, icon, isExpanded, onToggle, iconColor }) => (
    <div 
      onClick={onToggle}
      className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-2">
        {React.cloneElement(icon, { className: `h-5 w-5 ${iconColor}` })}
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      {isExpanded ? (
        <ChevronUp className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500" />
      )}
    </div>
  );

  const ButtonSpinner = () => (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const handleGenerateFlashcards = async () => {
    setIsGenerating(true);
    setGeneratingType("quiz");
    setIsGeneratingFlashcards(true);
    try {
      const pageRange = validatePageRange(startPage, endPage);
      if (!pageRange) {
        throw new Error("Invalid page range");
      }

      const response = await fetch(
        `https://jyoti-ai.com/api/get-flashcards/${docId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startPage: pageRange.startPage,
            endPage: pageRange.endPage,
            lang: localStorage.getItem("preferredLanguage")
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate flashcards");
      }

      const data = await response.json();

      if (!data.setId) {
        throw new Error("No setId received from server");
      }

      // Update the documentFlashcards state with the new flashcard set
      setDocumentFlashcards((prev) => [
        ...prev,
        {
          id: data.setId,
          setId: data.setId,
          pages: { start: pageRange.startPage, end: pageRange.endPage },
          createdAt: new Date().toISOString(),
        },
      ]);

      // Redirect to the flashcard view page
      router.push(`/Flashcard?docId=${docId}&setId=${data.setId}`);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      setRangeError(error.message || "Failed to generate flashcards");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };
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
        throw new Error("Failed to fetch document");
      }

      const data = await response.json();
      const url = data.pdfUrl;
      setDocumentUrl(url);
      setDocumentQuizzes(data.quizzes || []);
      setDocumentFlashcards(data.flashcards || []);
      setTotalPages(data.totalPages || 1);
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
      // Fetch existing summaries
      const fetchSummaries = async () => {
        try {
          const response = await fetch(
            `https://jyoti-ai.com/api/get-summaries/${docId}`,
            {
              credentials: "include",
            }
          );
          if (response.ok) {
            const data = await response.json();
            setDocumentSummaries(data.summaries || []);
          }
        } catch (error) {
          console.error("Error fetching summaries:", error);
        }
      };
      fetchSummaries();
    }
  }, [docId]);
  useEffect(() => {
    if (docId) {
      fetchDocument();
    }
  }, [docId]);
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setGeneratingType("quiz");
    setIsGeneratingSummary(true);
    try {
      const pageRange = validatePageRange(startPage, endPage);
      if (!pageRange) {
        throw new Error("Invalid page range");
      }

      const response = await fetch("https://jyoti-ai.com/api/summary2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          docId,
          startPage: pageRange.startPage,
          endPage: pageRange.endPage,
          lang: localStorage.getItem("preferredLanguage")
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setDocumentSummaries((prev) => [
        ...prev,
        {
          id: data.summaryId,
          text: data.responseText.output.text,
          audio: data.audio,
          pages: { start: pageRange.startPage, end: pageRange.endPage },
          createdAt: new Date().toISOString(),
        },
      ]);
      setCurrentSummary(data);

      // Redirect after successful generation
      router.push(`/Summary?docId=${docId}&summaryId=${data.summaryId}`);
    } catch (error) {
      console.error("Error generating summary:", error);
      alert(error.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  const navigateToSummary = (summaryId) => {
    router.push(`/Summary?docId=${docId}&summaryId=${summaryId}`);
  };

  // In DocumentDashboard (ImportDocs) component
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggedOut) {
        try {
          const response = await axios.get("https://jyoti-ai.com/api/me", {
            withCredentials: true,
          });
          if (response.status === 200) {
            setIsLoggedOut(false);
          }
        } catch (error) {
          console.error(error);
          router.push("/SchoolPage");
        }
      }
    };

    checkAuth();
  }, [isLoggedOut, setIsLoggedOut, router]);

  const validatePageRange = (start, end) => {
    const startNum = parseInt(start);
    const endNum = parseInt(end);

    if (!start && !end) {
      // Default to first 5 pages if no range specified
      return { startPage: 1, endPage: Math.min(5, totalPages) };
    }

    if (!start || !end) {
      setRangeError("Please specify both start and end pages");
      return null;
    }

    if (isNaN(startNum) || isNaN(endNum)) {
      setRangeError("Please enter valid page numbers");
      return null;
    }

    if (startNum < 1 || endNum > totalPages || startNum > endNum) {
      setRangeError("Invalid page range");
      return null;
    }

    if (endNum - startNum + 1 > 15) {
      setRangeError("Maximum 15 pages can be selected at once");
      return null;
    }

    setRangeError("");
    return { startPage: startNum, endPage: endNum };
  };

  const handlePageRangeChange = (value, type) => {
    const numValue = parseInt(value);
    if (value === "" || (!isNaN(numValue) && numValue >= 0)) {
      if (type === "start") {
        setStartPage(value);
      } else {
        setEndPage(value);
      }
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setGeneratingType("quiz");
    setIsGeneratingQuiz("true");
    try {
      const pageRange = validatePageRange(startPage, endPage);
      if (!pageRange) {
        throw new Error("Invalid page range");
      }

      const numQuestions = mcqCount === "auto" ? null : parseInt(mcqCount);

      const response = await fetch(`https://jyoti-ai.com/api/get-mcq/${docId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startPage: pageRange.startPage,
          endPage: pageRange.endPage,
          numQuestions,
          questionType, // Add question type to request
          lang: localStorage.getItem("preferredLanguage")
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate quiz");
      }

      const data = await response.json();
      router.push(
        `/McqTest?docId=${docId}&quizId=${data.quizId}&type=${questionType}`
      );
    } catch (error) {
      console.error("Error generating quiz:", error);
      alert(error.message || "Failed to generate quiz");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Add this to the sidebar content
  const SummarySidebar = () => (
    <div className="mb-6">
      <SectionHeader
        title="Summaries"
        icon={<BookOpen />}
        isExpanded={isSummaryExpanded}
        onToggle={() => setIsSummaryExpanded(!isSummaryExpanded)}
        iconColor="text-purple-600"
      />
      {isSummaryExpanded && (
        <div className="mt-2 space-y-2">
          {documentSummaries.length > 0 ? (
            documentSummaries.map((summary) => (
              <div
                key={summary.summaryId}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    Pages {summary.pages.start}-{summary.pages.end}
                  </span>
                  <button
                    onClick={() => navigateToSummary(summary.summaryId)}
                    className="px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors duration-200"
                  >
                    View
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {summary.text}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              No summaries generated yet
            </p>
          )}
        </div>
      )}
    </div>
  );
  const QuizzesSidebar = () => (
    <div className="mb-6">
      <SectionHeader
        title="Quizzes"
        icon={<Brain />}
        isExpanded={isQuizExpanded}
        onToggle={() => setIsQuizExpanded(!isQuizExpanded)}
        iconColor="text-blue-600"
      />
      {isQuizExpanded && (
        <div className="mt-2 space-y-2">
          {documentQuizzes.length > 0 ? (
            documentQuizzes.map((quiz) => (
              <div
                key={quiz.quizId}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {quiz.quizName || `Quiz ${quiz.quizId.slice(-4)}`}
                  </span>
                  {quiz.score ? (
                    <div className="flex items-center mt-1">
                      <span className="text-sm font-medium text-blue-600">
                        Score {quiz.score.score}/{quiz.score.total}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 mt-1">Not attempted yet</span>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/McqTest?docId=${docId}&quizId=${quiz.quizId}`)}
                  className="px-4 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Open
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No quizzes generated yet
            </p>
          )}
        </div>
      )}
    </div>
  );
  const FlashcardsSidebar = () => (
    <div className="mb-6">
      <SectionHeader
        title="Flashcards"
        icon={<Square />}
        isExpanded={isFlashcardsExpanded}
        onToggle={() => setIsFlashcardsExpanded(!isFlashcardsExpanded)}
        iconColor="text-green-600"
      />
      {isFlashcardsExpanded && (
        <div className="mt-2 space-y-2">
          {documentFlashcards.length > 0 ? (
            documentFlashcards.map((flashcard) => (
              <div
                key={flashcard.id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                <span className="text-sm text-gray-700">
                  Pages {flashcard.pages.start}-{flashcard.pages.end}
                </span>
                <button
                  onClick={() => router.push(`/Flashcard?docId=${docId}&setId=${flashcard.setId}`)}
                  className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                >
                  Open
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              No flashcards created yet
            </p>
          )}
        </div>
      )}
    </div>
  );

  const LoadingOverlay = ({ type = "content", pageRange }) => {
    const getLoadingContent = () => {
      switch (type) {
        case "summary":
          return {
            emoji: "📚",
            title: "Creating Summary",
            bgGradient: "from-emerald-50 to-green-50",
            textColor: "text-emerald-600",
            messages: [
              "Analyzing the content...",
              "Extracting key points...",
              "Organizing main ideas...",
              "Crafting a concise summary..."
            ]
          };
        case "quiz":
          return {
            emoji: "🧩",
            title: "Generating Quiz",
            bgGradient: "from-blue-50 to-indigo-50",
            textColor: "text-blue-600",
            messages: [
              "Analyzing content depth...",
              "Creating thoughtful questions...",
              "Designing answer options...",
              "Adding detailed explanations..."
            ]
          };
        case "flashcards":
          return {
            emoji: "🎴",
            title: "Creating Flashcards",
            bgGradient: "from-purple-50 to-violet-50",
            textColor: "text-purple-600",
            messages: [
              "Identifying key concepts...",
              "Creating question-answer pairs...",
              "Organizing learning material...",
              "Formatting flashcards..."
            ]
          };
        default:
          return {
            emoji: "⚡",
            title: "Processing Content",
            bgGradient: "from-gray-50 to-slate-50",
            textColor: "text-gray-600",
            messages: [
              "Analyzing content...",
              "Processing information...",
              "Almost there..."
            ]
          };
      }
    };
  
    const content = getLoadingContent();
    const [messageIndex, setMessageIndex] = useState(0);
  
    useEffect(() => {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % content.messages.length);
      }, 5000);
      return () => clearInterval(interval);
    }, [content.messages.length]);
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
        <div className={`bg-gradient-to-r ${content.bgGradient} rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl`}>
          <div className="flex flex-col items-center space-y-6">
            {/* Emoji with gradient effect */}
            <div className="relative">
              <div className="text-6xl animate-bounce filter drop-shadow-lg">{content.emoji}</div>
            </div>
            
            {/* Title */}
            <div className={`text-xl font-medium ${content.textColor}`}>
              {content.title}
            </div>
  
            {/* Page range info */}
            {pageRange && (
              <div className="text-sm text-gray-600 bg-white bg-opacity-50 px-3 py-1 rounded-full">
                Pages {pageRange.start} - {pageRange.end}
              </div>
            )}
            
            {/* Rotating messages */}
            <div className="h-12 flex items-center justify-center">
              <div className="text-gray-600 text-center min-h-[1.5rem] transition-all duration-500">
                {content.messages[messageIndex]}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-white bg-opacity-50 rounded-full overflow-hidden">
              <div 
                className={`h-full ${content.bgGradient} rounded-full animate-loading`}
                style={{
                  animation: 'loading 2s ease-in-out infinite'
                }}
              />
            </div>
  
            {/* Spinner */}
            <ButtonSpinner />
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gray-50">
     <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <div className="flex min-h-screen mt-16">
        {/* Sidebar with fixed position */}
        <div
          className={`fixed left-0 h-full z-20 transition-transform duration-300 transform ${
            isHistoryOpen ? "translate-x-0" : "-translate-x-full"
          } bg-white shadow-lg overflow-y-auto`}
          style={{ width: isHistoryOpen ? "320px" : "0" }}
        >
          {isHistoryOpen && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Document Resources
                </h2>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SummarySidebar />
              <QuizzesSidebar />
              <FlashcardsSidebar />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div 
          className={`flex-1 transition-all duration-300 ${
            isHistoryOpen ? "ml-80" : "ml-0"
          }`}
        >
          <div className="p-6">
            {!isHistoryOpen && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="mb-4 p-2 text-gray-600 hover:text-gray-900"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

<div className="max-w-7xl mx-auto px-2 py-2 space-y-3">
              <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Page Range Control */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <span className="text-sm font-medium text-gray-700">Page Range:</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          placeholder="Start"
                          value={startPage}
                          onChange={(e) => setStartPage(e.target.value)}
                          className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          placeholder="End"
                          value={endPage}
                          onChange={(e) => setEndPage(e.target.value)}
                          className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Question Type Selection */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <span className="text-sm font-medium text-gray-700">Question Type:</span>
                      <select
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="scq">Single Choice</option>
                        <option value="truefalse">True/False</option>
                        <option value="fillinblanks">Fill in the Blanks</option>
                      </select>
                    </div>
                  </div>

                  {/* MCQ Count Selection */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <span className="text-sm font-medium text-gray-700">MCQs:</span>
                      <select
                        value={mcqCount}
                        onChange={(e) => setMcqCount(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="auto">Auto (Optimized for content)</option>
                        <option value="5">5 questions</option>
                        <option value="10">10 questions</option>
                        <option value="15">15 questions</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <div className="w-full max-w-4xl mx-auto" style={{ height: "500px" }}>
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                  </div>
                ) : error ? (
                  <div className="flex justify-center items-center h-full text-red-500">
                    {error}
                  </div>
                ) : documentUrl ? (
                  <object
                    data={`${documentUrl}#page=${currentPage}`}
                    type="application/pdf"
                    className="w-full h-full rounded-lg shadow-lg"
                  >
                    <iframe
                      src={`${documentUrl}#page=${currentPage}`}
                      className="w-full h-full rounded-lg shadow-lg"
                      title="PDF Viewer"
                    >
                      <p>Your browser does not support PDF viewing.</p>
                    </iframe>
                  </object>
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-500">
                    No document available
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="max-w-7xl mx-auto p-4 mt-0 lg:p-2">
              <div className="bg-white rounded-xl shadow-lg p-4 lg:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary || isGeneratingQuiz || isGeneratingFlashcards}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-70 w-full"
                  >
                    {isGeneratingSummary ? (
                      <ButtonSpinner />
                    ) : (
                      <BookOpen className="h-5 w-5" />
                    )}
                    <span className="font-medium">
                      {isGeneratingSummary ? "Generating..." : "Generate Summary"}
                    </span>
                  </button>

                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingSummary || isGeneratingQuiz || isGeneratingFlashcards}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-70 w-full"
                  >
                    {isGeneratingQuiz ? <ButtonSpinner /> : <Brain className="h-5 w-5" />}
                    <span className="font-medium">
                      {isGeneratingQuiz ? "Generating..." : "Generate Quiz"}
                    </span>
                  </button>

                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={isGeneratingSummary || isGeneratingQuiz || isGeneratingFlashcards}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-violet-50 text-purple-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-70 w-full"
                  >
                    {isGeneratingFlashcards ? (
                      <ButtonSpinner />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    <span className="font-medium">
                      {isGeneratingFlashcards ? "Generating..." : "Generate Flashcards"}
                    </span>
                  </button>

                  <button
                    onClick={() => router.push(`/AITeacher?id=${docId}`)}
                    disabled={isGeneratingSummary || isGeneratingQuiz || isGeneratingFlashcards}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 w-full"
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span className="font-medium">JyotiAI Teacher</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Loading Overlay */}
            {(isGeneratingSummary || isGeneratingQuiz || isGeneratingFlashcards) && (
              <LoadingOverlay 
                type={
                  isGeneratingSummary ? "summary" :
                  isGeneratingQuiz ? "quiz" :
                  "flashcards"
                }
                pageRange={{
                  start: parseInt(startPage) || 1,
                  end: parseInt(endPage) || 5
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReader;
