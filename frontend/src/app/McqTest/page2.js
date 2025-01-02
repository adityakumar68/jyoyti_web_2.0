"use client"

import React, { useState, useEffect } from 'react';
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from 'lucide-react';
import Navbar from '@/components/navbar';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {children}
    </div>
  );
};

const MCQQuiz = () => {
  const searchParams = useSearchParams();
  const docId = searchParams.get('docId');
  const quizId = searchParams.get('quizId');
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://jyoti-ai.com/api/get-quiz-data/${docId}/${quizId}`,
          {
            credentials: 'include'
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch quiz data');
        }

        const data = await response.json();
        if (!Array.isArray(data.questions)) {
          throw new Error('Invalid questions format');
        }
        setQuestions(data.questions);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching quiz:', err);
      } finally {
        setLoading(false);
      }
    };

    if (docId && quizId) {
      fetchQuizData();
    } else {
      setError('Missing document ID or quiz ID');
    }
  }, [docId, quizId]);

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    if (!submitted) {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionIndex]: selectedOption
      }));
    }
  };

  const handleSubmit = () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert("Please answer all questions before submitting!");
      return;
    }

    let correctCount = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);
  };

  const getOptionClassName = (questionIndex, optionKey) => {
    const baseClass = "relative p-4 border rounded-lg transition-all duration-300 cursor-pointer";
    
    if (!submitted) {
      return `${baseClass} ${
        selectedAnswers[questionIndex] === optionKey 
          ? 'bg-blue-50 border-blue-300 shadow-md' 
          : 'hover:bg-gray-50'
      }`;
    }
    
    const question = questions[questionIndex];
    const isSelected = selectedAnswers[questionIndex] === optionKey;
    const isCorrect = optionKey === question.correct;
    
    if (isCorrect) return `${baseClass} bg-green-100 border-green-300 shadow-lg`;
    if (isSelected && !isCorrect) return `${baseClass} bg-red-100 border-red-300 shadow-lg`;
    return `${baseClass} opacity-50`;
  };

  const getResultEmoji = (questionIndex) => {
    const question = questions[questionIndex];
    const isCorrect = selectedAnswers[questionIndex] === question.correct;
    return isCorrect ? 
      <CheckCircle className="w-6 h-6 text-green-500 animate-bounce" /> : 
      <XCircle className="w-6 h-6 text-red-500 animate-bounce" />;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-gray-600">Loading quiz...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-red-600">Error: {error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen mx-auto mt-1">
      <Navbar />
      <Card className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Interactive MCQ Quiz
          </h1>
          {!submitted && (
            <p className="text-gray-600 mt-2">Answer all questions to test your knowledge!</p>
          )}
        </div>

        <div className="space-y-8">
          {questions.map((question, index) => (
            <div key={index} className="border-b pb-8">
              <div className="flex items-start justify-between mb-4">
                <p className="font-semibold text-lg">
                  <span className="text-2xl text-blue-600 mr-2">{index + 1}.</span> 
                  {question.question}
                </p>
                {submitted && (
                  <div className="ml-4">
                    {getResultEmoji(index)}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(question.options).map(([key, value]) => (
                  <div
                    key={key}
                    className={getOptionClassName(index, key)}
                    onClick={() => handleAnswerSelect(index, key)}
                  >
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${selectedAnswers[index] === key ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                      `}>
                        {selectedAnswers[index] === key && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-lg">
                        <span className="font-semibold text-blue-600">{key}.</span> {value}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg
                font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Submit Quiz
            </button>
          ) : (
            <div className="text-center">
              <div className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 
                bg-clip-text text-transparent">
                Final Score: {score} out of {questions.length}
              </div>
              <div className="text-lg text-gray-600">
                {score === questions.length 
                  ? "Perfect score! Excellent work! 🎉" 
                  : score >= questions.length / 2 
                    ? "Good job! Keep practicing! 👍" 
                    : "Keep learning! You can do better! 💪"}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MCQQuiz;