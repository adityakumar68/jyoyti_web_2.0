"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { Globe2, Check } from "lucide-react";

export default function Profile() {
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  const languages = [
    { code: 'hi', name: 'Hindi', },
    { code: 'en', name: 'English',  },
    { code: 'mr', name: 'Marathi',},
    { code: 'as', name: 'Assamese', },
    { code: 'bn', name: 'Bengali', },
    { code: 'gu', name: 'Gujarati',}
  ];

  const handleLanguageChange = (langName) => {
    setSelectedLanguage(langName);
    localStorage.setItem('preferredLanguage', langName);
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-blue-50 rounded-full mb-4">
              <Globe2 className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Language Preferences
            </h1>
            <p className="text-gray-600">
              Choose your preferred language for Quizzes, Flashcards, Translation and JyotiAI Teacher
            </p>
          </div>

          {/* Language Selection Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 relative">
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 text-left bg-gray-300 rounded-lg hover:bg-gray-100 
                          transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {languages.find(l => l.name === selectedLanguage)?.flag}
                  </span>
                  <span className="text-gray-800 font-medium">
                    {selectedLanguage}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 
                            ${isOpen ? 'transform rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute w-full mt-2 py-2 bg-gray-300 rounded-lg shadow-xl border 
                              border-gray-100 z-10">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.name)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center 
                                justify-between group transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-gray-700 group-hover:text-gray-900">
                          {lang.name}
                        </span>
                      </div>
                      {selectedLanguage === lang.name && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Your language preference will be used across all features including AI interactions,
                quiz generation, and content translation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}