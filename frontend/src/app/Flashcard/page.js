"use client"
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight,
  ArrowLeftCircle,
  RotateCw
} from 'lucide-react';
import Navbar from '@/components/navbar';

const FlashcardSet = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get("docId");
  const setId = searchParams.get("setId");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState({});
  const [needsLargerText, setNeedsLargerText] = useState(false);

  // Check language preference on component mount
  useEffect(() => {
    const lang = localStorage.getItem('preferredLanguage') || '';
    setNeedsLargerText(!['hi', 'en'].includes(lang));
  }, []);

  const getTextSizeClass = (type) => {
    if (!needsLargerText) {
      return {
        question: 'text-2xl',
        answer: 'text-xl',
        label: 'text-lg',
        button: 'text-base',
        progress: 'text-sm'
      }[type];
    }

    return {
      question: 'text-4xl leading-relaxed',
      answer: 'text-3xl leading-relaxed',
      label: 'text-2xl leading-relaxed',
      button: 'text-xl',
      progress: 'text-lg'
    }[type];
  };
  useEffect(() => {
    if (docId && setId) {
      fetchFlashcards();
    }
  }, [docId, setId]);

  const fetchFlashcards = async () => {
    try {
      const response = await fetch(
        `https://jyoti-ai.com/api/get-flashcard-set/${docId}/${setId}`,
        {
          credentials: 'include'
        }
      );
      if (!response.ok) throw new Error('Failed to fetch flashcards');
      const data = await response.json();
      setFlashcards(data.flashcards);
      
      // Initialize progress with empty values
      const initialProgress = {};
      data.flashcards.forEach((_, index) => {
        initialProgress[index] = 'unreviewed';
      });
      setProgress(initialProgress);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const markProgress = (status) => {
    setProgress(prev => ({
      ...prev,
      [currentCardIndex]: status
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto mb-8 mt-4">
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-gray-600 ${getTextSizeClass('progress')}`}>Progress</span>
            <span className={`text-gray-600 ${getTextSizeClass('progress')}`}>
              Card {currentCardIndex + 1} of {flashcards.length}
            </span>
          </div>
          <div className="flex gap-1">
            {flashcards.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  progress[index] === 'correct' 
                    ? 'bg-green-500'
                    : progress[index] === 'incorrect'
                    ? 'bg-red-500'
                    : index === currentCardIndex
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-4xl mx-auto">
        <div className="relative h-96">
          <div 
            className={`w-full h-full transition-transform duration-500 transform-gpu ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            } [transform-style:preserve-3d]`}
          >
            {/* Front (Question) */}
            <div className={`absolute w-full h-full bg-white rounded-xl shadow-lg p-8 
                           [backface-visibility:hidden] ${isFlipped ? 'invisible' : 'visible'}`}>
              <div className="flex flex-col justify-between h-full">
                <div className={`font-medium text-blue-600 mb-4 ${getTextSizeClass('label')}`}>
                  Question →
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className={`font-medium text-center text-gray-800 ${getTextSizeClass('question')}`}>
                    {currentCard.front}
                  </div>
                </div>
                <button
                  onClick={handleFlip}
                  className={`w-full py-3 flex items-center justify-center gap-2 text-blue-600 
                            hover:bg-blue-50 rounded-lg transition-colors ${getTextSizeClass('button')}`}
                >
                  <RotateCw className="h-4 w-4" />
                  Flip to see answer
                </button>
              </div>
            </div>

            {/* Back (Answer) */}
            <div className={`absolute w-full h-full bg-white rounded-xl shadow-lg p-8 
                           [backface-visibility:hidden] [transform:rotateY(180deg)]
                           ${isFlipped ? 'visible' : 'invisible'}`}>
              <div className="flex flex-col justify-between h-full">
                <div className={`font-medium text-green-600 mb-4 ${getTextSizeClass('label')}`}>
                  Answer →
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className={`text-center text-gray-700 ${getTextSizeClass('answer')}`}>
                    {currentCard.back}
                  </div>
                </div>
                <button
                  onClick={handleFlip}
                  className={`w-full py-3 flex items-center justify-center gap-2 text-green-600 
                            hover:bg-green-50 rounded-lg transition-colors ${getTextSizeClass('button')}`}
                >
                  <RotateCw className="h-4 w-4" />
                  Flip to question
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentCardIndex === 0}
            className="p-3 rounded-full bg-white shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => markProgress('incorrect')}
              className={`px-6 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 
                         transition-colors ${getTextSizeClass('button')}`}
            >
              Need Review
            </button>
            <button
              onClick={() => markProgress('correct')}
              className={`px-6 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 
                         transition-colors ${getTextSizeClass('button')}`}
            >
              Got It!
            </button>
          </div>

          <button
            onClick={handleNext}
            disabled={currentCardIndex === flashcards.length - 1}
            className="p-3 rounded-full bg-white shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardSet;
