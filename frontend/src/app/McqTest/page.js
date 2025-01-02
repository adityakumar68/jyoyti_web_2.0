"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  X,
  HelpCircle,
  Brain,
  RotateCcw,
  Target,
  BookOpen,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/navbar";

const McqTest = () => {
  const searchParams = useSearchParams();
  const docId = searchParams.get("docId");
  const quizId = searchParams.get("quizId");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState(new Set());
  const [existingResponse, setExistingResponse] = useState(null);
  const [showingHistory, setShowingHistory] = useState(false);
  const [needsLargerText, setNeedsLargerText] = useState(false);


  useEffect(() => {
    const lang = localStorage.getItem('preferredLanguage') || 'English';
    setNeedsLargerText(!['Hindi', 'English'].includes(lang));
  }, []);

    const getTextSizeClass = (type) => {
    if (!needsLargerText) {
      return {
        question: 'text-xl',
        option: 'text-base',
        explanation: 'text-base',
        metadata: 'text-sm',
        heading: 'text-2xl',
        label: 'text-lg'
      }[type];
    }

    return {
      question: 'text-3xl leading-relaxed',
      option: 'text-3xl leading-relaxed',
      explanation: 'text-3xl leading-relaxed',
      metadata: 'text-2xl leading-relaxed',
      heading: 'text-xl leading-relaxed',
      label: 'text-xl leading-relaxed'
    }[type];
  };


  const handleQuizSubmit = async () => {
    await saveQuizResponse();
    setIsQuizComplete(true);
  };
  const fetchExistingResponse = async () => {
    try {
      const response = await fetch(
        `https://jyoti-ai.com/api/quiz-responses/${docId}/${quizId}`,
        {
          credentials: "include",
        }
      );
  
      const data = await response.json();
      
      if (data.responses && data.responses.length > 0) {
        // Get the most recent response (array is already sorted)
        setExistingResponse(data.responses[0]);
        setShowingHistory(true);
      }
    } catch (error) {
      console.error("Error fetching quiz responses:", error);
      // Just continue with new quiz if there's an error
      setShowingHistory(false);
      setExistingResponse(null);
    }
  };
  

  const saveQuizResponse = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
  
      const score = calculateScore();
      const responseData = {
        responses: questions.map((question, index) => ({
          questionId: index,
          question: question.question,
          userAnswer: userAnswers[index],
          correct: isAnswerCorrect(question, userAnswers[index]),
          correctAnswer: question.correct
        })),
        score,
        totalQuestions: questions.length
      };
  
      const response = await fetch(
        `https://jyoti-ai.com/api/save-quiz-response/${docId}/${quizId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(responseData)
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to save quiz response');
      }
  
      // If save is successful, show the results
      setIsQuizComplete(true);
  
    } catch (error) {
      console.error('Error saving quiz response:', error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://jyoti-ai.com/api/get-quiz-data/${docId}/${quizId}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch quiz data");
        }

        const data = await response.json();
        setQuestions(data.questions || []);
        setUserAnswers(new Array(data.questions?.length || 0).fill(null));
        setError(null);
        // Check for existing responses
        await fetchExistingResponse();

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (docId && quizId) {
      fetchQuizData();
    }
  }, [docId, quizId]);
  const LoadingOverlay = ({ message = "Generating..." }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
          <div className="flex flex-col items-center space-y-6">
            {/* Rotating brain emoji with gradient shadow */}
            <div className="relative">
              <div className="text-6xl animate-spin">🧠</div>
              <div className="absolute inset-0 blur-lg bg-gradient-to-r from-purple-500 to-blue-500 opacity-30 animate-pulse"></div>
            </div>
            
            {/* Loading text */}
            <div className="text-xl font-medium text-gray-800">{message}</div>
            
            {/* Loading bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-loading"
                style={{
                  animation: 'loading 2s ease-in-out infinite',
                }}
              ></div>
            </div>
            
            {/* Additional info text */}
            <p className="text-sm text-gray-500 text-center">
              Please wait while we prepare your content...
            </p>
          </div>
        </div>
      </div>
    );
  };
  const ExistingResponseView = () => {
    if (!existingResponse) return null;
  
    const previousScore = existingResponse.score;
    const totalQuestions = existingResponse.totalQuestions;
    const percentage = Math.round((previousScore / totalQuestions) * 100);
  
    const renderQuestionOptions = (response, question) => {
      const renderMetadata = () => (
        <div className={`mb-4 p-4 bg-gray-100 rounded-lg text-gray-800 ${getTextSizeClass('metadata')}`}>
          <div><strong>Difficulty:</strong> {question.difficulty}</div>
          <div><strong>Conceptual Area:</strong> {question.conceptualArea}</div>
        </div>
      );
  
      switch (question.type) {
        case "mcq":
          return (
            <div>
              {renderMetadata()}
              <div className="space-y-3">
                {Object.entries(question.options).map(([key, value]) => {
                  const isCorrectOption = Array.isArray(question.correct) 
                    ? question.correct.includes(key)
                    : question.correct === key;
                  const isSelectedOption = Array.isArray(response.userAnswer)
                    ? response.userAnswer.includes(key)
                    : response.userAnswer === key;
  
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border ${
                        isSelectedOption
                          ? isCorrectOption
                            ? "bg-green-50 border-green-300"
                            : "bg-red-50 border-red-300"
                          : isCorrectOption
                          ? "bg-green-50 border-green-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isSelectedOption
                                ? isCorrectOption
                                  ? "bg-green-500"
                                  : "bg-red-500"
                                : isCorrectOption
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          >
                            {isSelectedOption ? (
                              isCorrectOption ? (
                                <Check className="h-4 w-4 text-white" />
                              ) : (
                                <X className="h-4 w-4 text-white" />
                              )
                            ) : isCorrectOption ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : null}
                          </div>
                          <span className={`${isSelectedOption && !isCorrectOption ? "text-red-700" : "text-gray-700"} ${getTextSizeClass('option')}`}>
                            {value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );  
        case "scq":
          return (
            <div>
              {renderMetadata()}
              <div className="space-y-3">
                {Object.entries(question.options).map(([key, value]) => {
                  const isCorrect = question.correct === key;
                  const isSelected = response.userAnswer === key;
    
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border ${
                        isSelected
                          ? isCorrect
                            ? "bg-green-50 border-green-300"
                            : "bg-red-50 border-red-300"
                          : isCorrect
                          ? "bg-green-50 border-green-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isSelected
                                ? isCorrect
                                  ? "bg-green-500"
                                  : "bg-red-500"
                                : isCorrect
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          >
                            {isSelected ? (
                              isCorrect ? (
                                <Check className="h-4 w-4 text-white" />
                              ) : (
                                <X className="h-4 w-4 text-white" />
                              )
                            ) : isCorrect ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : null}
                          </div>
                          <span className={`${isSelected && !isCorrect ? "text-red-700" : "text-gray-700"}`}>
                            {value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
    
          case "truefalse":
            return (
              <div>
                {renderMetadata()}
                <div className="space-y-3">
                  {Object.entries(question.options || { 'true': 'True', 'false': 'False' }).map(([key, value]) => {
                    const isCorrect = question.correct === key;
                    const isSelected = response.userAnswer === key;
    
                    return (
                      <div
                        key={key}
                        className={`p-4 rounded-lg border ${
                          isSelected
                            ? isCorrect
                              ? "bg-green-50 border-green-300"
                              : "bg-red-50 border-red-300"
                            : isCorrect
                            ? "bg-green-50 border-green-300"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isSelected
                                  ? isCorrect
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                  : isCorrect
                                  ? "bg-green-500"
                                  : "bg-gray-200"
                              }`}
                            >
                              {isSelected ? (
                                isCorrect ? (
                                  <Check className="h-4 w-4 text-white" />
                                ) : (
                                  <X className="h-4 w-4 text-white" />
                                )
                              ) : isCorrect ? (
                                <Check className="h-4 w-4 text-white" />
                              ) : null}
                            </div>
                            <span className={`${isSelected && !isCorrect ? "text-red-700" : "text-gray-700"} ${getTextSizeClass('option')}`}>
                              {value}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
    
          case "fillinblanks":
            const parts = question.question.split('_____');
            return (
              <div>
                {renderMetadata()}
                <div className="space-y-4">
                  <div className={`text-lg ${getTextSizeClass('question')}`}>
                    <span>{parts[0]}</span>
                    <span className={`mx-2 px-4 py-2 rounded-lg ${
                      response.correct
                        ? "bg-green-50 text-green-700 border border-green-300"
                        : "bg-red-50 text-red-700 border border-red-300"
                    }`}>
                      {response.userAnswer || "No answer provided"}
                    </span>
                    <span>{parts[1]}</span>
                  </div>
                  <div className={`p-3 rounded-lg bg-green-50 border border-green-200 ${getTextSizeClass('option')}`}>
                    <span className="font-medium">Correct Answer:</span>{" "}
                    {question.correct}
                  </div>
                </div>
              </div>
            );
    
          default:
            return null;
        }
      };
    
      return (
        <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`font-bold ${getTextSizeClass('heading')}`}>Previous Quiz Attempt</h2>
              <button
                onClick={startNewQuiz}
                className={`flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg 
                           hover:bg-purple-700 ${getTextSizeClass('button')}`}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start New Attempt
              </button>
            </div>
    
            {/* Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className={`text-green-800 font-medium ${getTextSizeClass('label')}`}>Score</div>
                <div className={`font-bold text-green-600 ${getTextSizeClass('heading')}`}>
                  {previousScore} / {totalQuestions}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className={`text-blue-800 font-medium ${getTextSizeClass('label')}`}>Percentage</div>
                <div className={`font-bold text-blue-600 ${getTextSizeClass('heading')}`}>{percentage}%</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className={`text-purple-800 font-medium ${getTextSizeClass('label')}`}>Attempted On</div>
                <div className={`font-medium text-purple-600 ${getTextSizeClass('metadata')}`}>
                  {new Date(existingResponse.submittedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
    
            {/* Questions Review */}
            <div className="space-y-8">
              {existingResponse.responses.map((response, index) => {
                const question = questions[index];
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center
                          ${response.correct ? "bg-green-100" : "bg-red-100"}`}
                      >
                        {response.correct ? (
                          <Check className="text-green-600 h-5 w-5" />
                        ) : (
                          <X className="text-red-600 h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-medium ${getTextSizeClass('heading')}`}>Question {index + 1}</h3>
                            <span className={`px-3 py-1 bg-gray-200 text-gray-700 rounded-full ${getTextSizeClass('metadata')}`}>
                              {question.type.toUpperCase()}
                            </span>
                          </div>
                          <p className={`mt-2 text-gray-800 ${getTextSizeClass('question')}`}>{response.question}</p>
                        </div>
    
                        {renderQuestionOptions(response, question)}
    
                        {question.explanation && (
                          <div className={`mt-4 p-4 bg-blue-50 rounded-lg ${getTextSizeClass('explanation')}`}>
                            <div className="flex items-center space-x-2 mb-2">
                              <HelpCircle className="text-blue-600 h-5 w-5" />
                              <span className={`font-medium text-blue-800 ${getTextSizeClass('label')}`}>
                                Explanation
                              </span>
                            </div>
                            <p className="text-blue-900">{question.explanation}</p>
                          </div>
                        )}
    
                        {question.skills && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {question.skills.map((skill, i) => (
                              <span
                                key={i}
                                className={`px-2 py-1 bg-purple-50 text-purple-700 rounded-full 
                                  flex items-center ${getTextSizeClass('metadata')}`}
                              >
                                <Brain className="h-3 w-3 mr-1" />
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

  const handleAnswerSelection = (answer) => {
    const currentQuestionType = questions[currentQuestion].type;

    if (currentQuestionType === "mcq") {
      // Handle multiple choice questions
      const newSelectedOptions = new Set(selectedOptions);
      if (newSelectedOptions.has(answer)) {
        newSelectedOptions.delete(answer);
      } else {
        newSelectedOptions.add(answer);
      }
      setSelectedOptions(newSelectedOptions);
      const answersArray = Array.from(newSelectedOptions);
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestion] = answersArray;
      setUserAnswers(newAnswers);
    } else {
      // Handle single answer questions
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestion] = answer;
      setUserAnswers(newAnswers);
    }
  };

  const isAnswerCorrect = (question, userAnswer) => {
    if (!question || userAnswer === null) return false;

    switch (question.type) {
      case "mcq":
        if (!Array.isArray(userAnswer)) return false;
        if (question.correct.length !== userAnswer.length) return false;
        return (
          question.correct.every((ans) => userAnswer.includes(ans)) &&
          userAnswer.every((ans) => question.correct.includes(ans))
        );

      case "scq":
        return userAnswer === question.correct;

      case "truefalse":
        return userAnswer === question.correct;

      case "fillinblanks":
        return (
          userAnswer.toLowerCase().trim() ===
          question.correct.toLowerCase().trim()
        );

      default:
        return false;
    }
  };

  const calculateScore = () => {
    if (!questions || questions.length === 0) return 0;
    return questions.reduce((score, question, index) => {
      return score + (isAnswerCorrect(question, userAnswers[index]) ? 1 : 0);
    }, 0);
  };

  const moveToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOptions(
        new Set(
          Array.isArray(userAnswers[currentQuestion + 1])                                                       
            ? userAnswers[currentQuestion + 1]
            : []
        )
      );
    }
  };

  const moveToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOptions(
        new Set(
          Array.isArray(userAnswers[currentQuestion - 1])
            ? userAnswers[currentQuestion - 1]
            : []
        )
      );
    }
  };

  const QuizView = () => {
    const question = questions[currentQuestion];
    if (!question) return null;
  
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-purple-600 h-2.5 rounded-full transition-all"
            style={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
  
        {/* Question count and type */}
        <div className="flex justify-between items-center">
          <span className={`text-gray-600 ${getTextSizeClass('metadata')}`}>
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className={`text-gray-600 ${getTextSizeClass('metadata')}`}>
            {question.type.toUpperCase()}
          </span>
        </div>
  
        {/* Question */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className={`text-gray-900 ${getTextSizeClass('question')}`}>
            {question.type === "fillinblanks"
              ? question.question.replace("_____", "________")
              : question.question}
          </h2>
  
          {/* Metadata */}
          <div className={`bg-gray-100 p-4 rounded-lg ${getTextSizeClass('metadata')}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium">Difficulty: </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  question.difficulty === "hard"
                    ? "bg-red-100 text-red-700"
                    : question.difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {question.difficulty?.charAt(0).toUpperCase() + question.difficulty?.slice(1) || "Medium"}
                </span>
              </div>
              {question.conceptualArea && (
                <div>
                  <span className="font-medium">Area: </span>
                  <span>{question.conceptualArea}</span>
                </div>
              )}
              {question.skills && (
                <div>
                  <span className="font-medium">Skills: </span>
                  <span>{question.skills.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
  
          {/* Options */}
          {question.type === "mcq" && (
            <div className="space-y-3">
              {Object.entries(question.options).map(([key, value]) => (
                <div
                  key={key}
                  onClick={() => handleAnswerSelection(key)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedOptions.has(key)
                      ? "bg-purple-50 border-purple-300"
                      : "bg-white border-gray-200 hover:border-purple-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                        selectedOptions.has(key)
                          ? "border-purple-500 bg-purple-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedOptions.has(key) && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className={`text-gray-700 ${getTextSizeClass('option')}`}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
  
          {question.type === "scq" && (
            <div className="space-y-3">
              {Object.entries(question.options).map(([key, value]) => (
                <div
                  key={key}
                  onClick={() => handleAnswerSelection(key)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    userAnswers[currentQuestion] === key
                      ? "bg-purple-50 border-purple-300"
                      : "bg-white border-gray-200 hover:border-purple-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                        userAnswers[currentQuestion] === key
                          ? "border-purple-500 bg-purple-500"
                          : "border-gray-300"
                      }`}
                    >
                      {userAnswers[currentQuestion] === key && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className={`text-gray-700 ${getTextSizeClass('option')}`}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
  
          {question.type === "truefalse" && (
            <div className="space-y-3">
              {["true", "false"].map((option) => (
                <div
                  key={option}
                  onClick={() => handleAnswerSelection(option === "true")}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    userAnswers[currentQuestion] === (option === "true")
                      ? "bg-purple-50 border-purple-300"
                      : "bg-white border-gray-200 hover:border-purple-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                        userAnswers[currentQuestion] === (option === "true")
                          ? "border-purple-500 bg-purple-500"
                          : "border-gray-300"
                      }`}
                    >
                      {userAnswers[currentQuestion] === (option === "true") && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className={`capitalize text-gray-700 ${getTextSizeClass('option')}`}>
                      {option}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
  
          {question.type === "fillinblanks" && (
            <div className={`space-y-4 ${getTextSizeClass('option')}`}>
              <div className="flex items-center">
                <span>{question.question.split('_____')[0]}</span>
                <input
                  type="text"
                  value={userAnswers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerSelection(e.target.value)}
                  className="mx-2 p-2 border border-gray-300 rounded-lg focus:outline-none 
                           focus:ring-2 focus:ring-purple-500 inline-block w-64"
                  placeholder="Type your answer here"
                  autoFocus
                />
                <span>{question.question.split('_____')[1]}</span>
              </div>
            </div>
          )}
        </div>
  
        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={moveToPreviousQuestion}
            disabled={currentQuestion === 0}
            className={`px-4 py-2 text-purple-600 disabled:text-gray-400 
                       hover:bg-purple-50 rounded-lg transition-colors 
                       ${getTextSizeClass('button')}`}
          >
            Previous
          </button>
          
          <div className="flex gap-2">
            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={moveToNextQuestion}
                className={`px-6 py-2 bg-purple-600 text-white rounded-lg 
                          hover:bg-purple-700 transition-colors
                          ${getTextSizeClass('button')}`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleQuizSubmit}
                disabled={isSaving}
                className={`px-6 py-2 bg-green-600 text-white rounded-lg 
                          hover:bg-green-700 transition-colors disabled:bg-gray-400 
                          ${getTextSizeClass('button')}`}
              >
                {isSaving ? 'Saving...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </div>
  
        {saveError && (
          <div className={`mt-4 p-4 bg-red-50 text-red-700 rounded-lg ${getTextSizeClass('metadata')}`}>
            Failed to save quiz response: {saveError}
          </div>
        )}
      </div>
    );
  };
  const startNewQuiz = () => {
    setShowingHistory(false);
    setExistingResponse(null);
    setUserAnswers(new Array(questions.length).fill(null));
    setCurrentQuestion(0);
    setSelectedOptions(new Set());
    setIsQuizComplete(false);
  };


  const ResultsView = () => {
    const renderQuestionResult = (question, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = isAnswerCorrect(question, userAnswer);
    
      return (
        <div key={index} className="mb-8 p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                ${isCorrect ? "bg-green-100" : "bg-red-100"}`}
              >
                {isCorrect ? (
                  <Check className="text-green-600 h-5 w-5" />
                ) : (
                  <X className="text-red-600 h-5 w-5" />
                )}
              </div>
            </div>
    
            <div className="flex-grow">
              {/* Question Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium ${getTextSizeClass('heading')}`}>
                    Question {index + 1}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      question.difficulty === "hard"
                        ? "bg-red-100 text-red-700"
                        : question.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    } ${getTextSizeClass('metadata')}`}>
                      {question.difficulty?.charAt(0).toUpperCase() + question.difficulty?.slice(1) || "Medium"}
                    </span>
                    {question.conceptualArea && (
                      <span className={`text-gray-500 ${getTextSizeClass('metadata')}`}>
                        {question.conceptualArea}
                      </span>
                    )}
                  </div>
                </div>
                <p className={`mt-2 text-gray-800 ${getTextSizeClass('question')}`}>
                  {question.question}
                </p>
              </div>
    
              {/* Answer Options */}
              <div className="mb-4">
                {question.type === "mcq" || question.type === "scq" ? (
                  Object.entries(question.options).map(([key, value]) => {
                    const isCorrectOption = Array.isArray(question.correct)
                      ? question.correct.includes(key)
                      : question.correct === key;
                    const isSelectedOption = Array.isArray(userAnswer)
                      ? userAnswer.includes(key)
                      : userAnswer === key;
    
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg mb-2 ${
                          isCorrectOption
                            ? "bg-green-50 border border-green-200"
                            : isSelectedOption
                            ? "bg-red-50 border border-red-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={getTextSizeClass('option')}>
                            <span className="font-medium">{key}:</span> {value}
                          </span>
                          {isCorrectOption && (
                            <Check className="text-green-500 h-4 w-4" />
                          )}
                          {isSelectedOption && !isCorrectOption && (
                            <X className="text-red-500 h-4 w-4" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : question.type === "truefalse" ? (
                  <div className="space-y-2">
                    {["true", "false"].map((option) => (
                      <div
                        key={option}
                        className={`p-3 rounded-lg ${
                          question.correct === (option === "true")
                            ? "bg-green-50 border border-green-200"
                            : userAnswer === (option === "true")
                            ? "bg-red-50 border border-red-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <span className={`capitalize ${getTextSizeClass('option')}`}>
                          {option}
                          {question.correct === (option === "true") && (
                            <Check className="inline ml-2 text-green-500 h-4 w-4" />
                          )}
                          {userAnswer === (option === "true") && 
                           question.correct !== (option === "true") && (
                            <X className="inline ml-2 text-red-500 h-4 w-4" />
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className={`p-3 rounded-lg bg-green-50 border border-green-200 ${getTextSizeClass('option')}`}>
                      <span className="font-medium">Correct Answer:</span> {question.correct}
                    </div>
                    {userAnswer && (
                      <div className={`p-3 rounded-lg bg-red-50 border border-red-200 ${getTextSizeClass('option')}`}>
                        <span className="font-medium">Your Answer:</span> {userAnswer}
                      </div>
                    )}
                  </div>
                )}
              </div>
    
              {/* Explanation */}
              {question.explanation && (
                <div className={`mt-4 p-4 bg-blue-50 rounded-lg ${getTextSizeClass('explanation')}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <HelpCircle className="text-blue-600 h-5 w-5" />
                    <span className={`font-medium text-blue-800 ${getTextSizeClass('label')}`}>
                      Explanation
                    </span>
                  </div>
                  <p className="text-blue-900">{question.explanation}</p>
                </div>
              )}
    
              {/* Skills */}
              {question.skills && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {question.skills.map((skill, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 bg-purple-50 text-purple-700 rounded-full 
                        flex items-center ${getTextSizeClass('metadata')}`}
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
         <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
        {saveError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            Warning: Failed to save quiz results. Your results may not be available in your history.
          </div>
        )}
        {/* Score Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 w-full">
          <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-green-800 font-medium">Score</div>
              <div className="text-2xl font-bold text-green-600">
                {calculateScore()} / {questions.length}
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-blue-800 font-medium">Percentage</div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((calculateScore() / questions.length) * 100)}%
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-purple-800 font-medium">Questions</div>
              <div className="text-2xl font-bold text-purple-600">
                {questions.length}
              </div>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-6 w-full">
          {questions.map((question, index) =>
            renderQuestionResult(question, index)
          )}
        </div>
      </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
          <div className="text-red-600 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-6">
        {showingHistory ? (
          <ExistingResponseView />
        ) : isQuizComplete ? (
          <ResultsView />
        ) : (
          <QuizView />
        )}
      </div>
    </div>
  );
};
  

export default McqTest;
