"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, ArrowLeft, Bot, User, Loader2, Mic, MicOff } from 'lucide-react';
import Navbar from "@/components/navbar";


const languageMap = {
  Hindi: 'hi-IN',  // Hindi
  Marathi: 'mr-IN',  // Marathi
  Gujarati: 'gu-IN',  // Gujarati
  Bengali: 'bn-IN',  // Bengali
  Assamese: 'as-IN',  // Assamese
};


const AiTeacher = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get("id");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [voiceError, setVoiceError] = useState(null);
  const [preferredLang, setPreferredLang] = useState('');
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // Update the useEffect for speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        if (!SpeechRecognition) {
          throw new Error('Speech recognition not supported');
        }

        const recognition = new SpeechRecognition();
        
        // Get user's preferred language
        const userLang = localStorage.getItem("preferredLanguage") || 'en';
        setPreferredLang(userLang);
        
        // Configure recognition
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = languageMap[userLang] || languageMap['en'];

        // Handle start
        recognition.onstart = () => {
          console.log('Speech recognition started');
          setIsRecording(true);
          setVoiceError(null);
        };

        // Handle results
        recognition.onresult = (event) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          
          if (event.results[last].isFinal) {
            setCurrentMessage(prev => prev + ' ' + transcript.trim());
            setIsRecording(false);
          }
        };

        // Handle errors with specific error messages
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          switch (event.error) {
            case 'no-speech':
              setVoiceError('No speech detected. Please try again.');
              break;
            case 'audio-capture':
              setVoiceError('Microphone not found. Please check your microphone.');
              break;
            case 'not-allowed':
              setVoiceError('Microphone permission denied. Please allow microphone access.');
              break;
            case 'network':
              setVoiceError('Network error occurred. Please check your connection.');
              break;
            case 'language-not-supported':
              setVoiceError(`Speech recognition is not supporting ${languageMap[preferredLang]}. Falling back to English.`);
              recognition.lang = 'en-IN';
              break;
            default:
              setVoiceError('Error occurred during speech recognition. Please try again.');
          }
          setIsRecording(false);
        };

        // Handle end
        recognition.onend = () => {
          setIsRecording(false);
          setIsListening(false);
          console.log('Speech recognition ended');
        };

        recognitionRef.current = recognition;
        setRecognition(recognition);

      } catch (error) {
        console.error('Speech recognition setup error:', error);
        setVoiceError('Speech recognition is not supported in your browser.');
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        if (isListening) {
          recognitionRef.current.stop();
        }
      }
    };
  }, [preferredLang]); // Re-initialize when language changes
  const formatText = (text) => {
    if (!text) return '';
  
    return text.split('\n').map((line, index) => {
      // Handle headings (e.g., **Heading**)
      if (/^\*\*(.+)\*\*$/.test(line.trim())) {
        const headingText = line.trim().replace(/\*\*/g, '');
        return (
          <h2 key={index} className="text-xl font-bold mb-4 mt-6">
            {headingText}
          </h2>
        );
      }
  
      // Handle inline bold text (e.g., **Law 1:** ...)
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.+?\*\*)/).map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={`strong-${index}-${i}`}>
                {part.replace(/\*\*/g, '')}
              </strong>
            );
          }
          return <span key={`span-${index}-${i}`}>{part}</span>;
        });
  
        return (
          <p key={index} className="mb-4">
            {parts}
          </p>
        );
      }
  
      // Handle bullet points (e.g., * Bullet Point)
      if (line.trim().startsWith('* ')) {
        const bulletText = line.trim().replace(/^\* /, '').trim();
        return (
          <li key={index} className="ml-6 mb-2 list-disc">
            {bulletText}
          </li>
        );
      }
  
      // Fallback to paragraph for unformatted lines
      return (
        <p key={index} className="mb-4">
          {line}
        </p>
      );
    });
  };
  
  
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversation = async () => {
    if (!startPage || !endPage) {
      setError("Please select page range");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch("https://jyoti-ai.com/api/start-ai-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          docId,
          startPage: parseInt(startPage),
          endPage: parseInt(endPage),
          lang: localStorage.getItem("preferredLanguage")
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start conversation");
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm your AI teacher for these pages. What would you like to know?"
        }
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

   const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionId) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage("");
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    // Add a temporary thinking message
    setIsThinking(true);
    
    try {
      const response = await fetch("https://jyoti-ai.com/api/chat-ai-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const endConversation = async () => {
    if (sessionId) {
      try {
        await fetch("https://jyoti-ai.com/api/end-ai-teacher", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            sessionId,
          }),
        });
      } catch (err) {
        console.error("Error ending conversation:", err);
      }
    }
    router.back();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const toggleRecording = async () => {
    if (!recognition) {
      setVoiceError('Speech recognition is not supported in your browser.');
      return;
    }

    try {
      if (isRecording) {
        recognition.stop();
        setIsRecording(false);
        setIsListening(false);
      } else {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            setVoiceError(null);
            recognition.lang = languageMap[preferredLang] || languageMap['en'];
            recognition.start();
            setIsListening(true);
          })
          .catch(err => {
            console.error('Microphone permission error:', err);
            setVoiceError('Please allow microphone access to use voice input.');
          });
      }
    } catch (error) {
      console.error('Toggle recording error:', error);
      setVoiceError('Error accessing microphone. Please try again.');
    }
  };

  const renderMessageInput = () => (
    <div className="border-t p-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your question..."
            className="flex-1 p-2 border rounded-lg resize-none h-12"
            rows={1}
          />
          <button
            onClick={toggleRecording}
            className={`p-2 ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
            } text-white rounded-lg hover:opacity-90 transition-colors`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isThinking}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        {voiceError && (
          <div className="text-sm text-red-600 px-2">
            {voiceError}
          </div>
        )}
        {isRecording && (
          <div className="text-sm text-green-600 px-2 flex items-center">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-2" />
            Listening in {languageMap[preferredLang] || 'en-IN'}...
          </div>
        )}
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-4">
        <button
          onClick={endConversation}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Document
        </button>

        {!sessionId ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Start AI Teacher Session</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Page
                </label>
                <input
                  type="number"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Page
                </label>
                <input
                  type="number"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <button
                onClick={startConversation}
                disabled={isProcessing}
                className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing Pages...
                  </div>
                ) : (
                  "Start Conversation"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-8xl mx-auto bg-white rounded-lg shadow-sm">
            <div className="h-[700px] overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 ${
                      message.role === "user" ? "justify-end" : ""
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-purple-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="prose prose-sm text-2xl max-w-none">
                        {formatText(message.content)}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isThinking && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                    </div>
                    <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-800">
                      <div className="prose prose-sm max-w-none">
                        Thinking...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            
            {renderMessageInput()}
          </div>
        )}
      </div>
    </div>
  );
};


export default AiTeacher;