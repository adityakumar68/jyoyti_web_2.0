"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { ArrowLeft } from 'lucide-react';

const SummaryPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get('docId');
  const summaryId = searchParams.get('summaryId');

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsLargerText, setNeedsLargerText] = useState(false);
  const audioRef = useRef(null);

  // Check language preference on component mount
  useEffect(() => {
    const lang = localStorage.getItem('preferredLanguage') || 'English';
    setNeedsLargerText(!['Hindi', 'English'].includes(lang));
  }, []);

  const getTextSizeClass = (type) => {
    if (!needsLargerText) {
      return {
        heading: 'text-xl',
        paragraph: 'text-base',
        bullet: 'text-base',
        metadata: 'text-sm'
      }[type];
    }

    return {
      heading: 'text-3xl leading-relaxed',
      paragraph: 'text-2xl leading-relaxed',
      bullet: 'text-2xl leading-relaxed',
      metadata: 'text-lg'
    }[type];
  };

  const formatText = (text) => {
    if (!text) return '';

    return text.split('\n').map((line, index) => {
      if (line.trim().startsWith('**')) {
        const headingText = line.trim().replace(/\*\*|\*\*$/g, '');
        return (
          <h2 
            key={index} 
            className={`font-bold text-gray-900 mb-4 mt-6 ${getTextSizeClass('heading')}`}
          >
            {headingText}
          </h2>
        );
      }

      if (line.trim().startsWith('*')) {
        const bulletText = line.trim().replace(/^\*/, '').trim();
        return (
          <li 
            key={index} 
            className={`ml-6 mb-2 list-disc ${getTextSizeClass('bullet')}`}
          >
            {bulletText}
          </li>
        );
      }

      return (
        <p 
          key={index} 
          className={`mb-4 ${getTextSizeClass('paragraph')}`}
        >
          {line}
        </p>
      );
    });
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`https://jyoti-ai.com/api/get-summary/${docId}/${summaryId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch summary');
        }

        const data = await response.json();
        setSummary(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (docId && summaryId) {
      fetchSummary();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [docId, summaryId]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto mt-2">

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col gap-4">
              <h1 className={`font-semibold text-gray-900 ${getTextSizeClass('heading')}`}>
                Document Summary
              </h1>
              {summary?.audio && (
                <div className="w-full bg-gray-50 p-4 rounded-lg">
                  <audio
                    ref={audioRef}
                    controls
                    className="w-full focus:outline-none"
                    style={{
                      height: '40px',
                      '--webkit-media-controls-panel-background': '#f3f4f6',
                      '--webkit-media-controls-current-time-display': '#4b5563',
                      '--webkit-media-controls-time-remaining-display': '#4b5563',
                      '--webkit-media-controls-volume-slider-container': '#4b5563',
                      '--webkit-media-controls-volume-slider': '#4b5563',
                      '--webkit-media-controls-seek-back-button': '#4b5563',
                      '--webkit-media-controls-seek-forward-button': '#4b5563',
                      '--webkit-media-controls-fullscreen-button': '#4b5563',
                      '--webkit-media-controls-rewind-button': '#4b5563',
                      '--webkit-media-controls-return-to-realtime-button': '#4b5563',
                      '--webkit-media-controls-toggle-closed-captions-button': '#4b5563',
                    }}
                  >
                    <source 
                      src={`data:audio/mp3;base64,${summary.audio}`} 
                      type="audio/mp3"
                    />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </div>

          {summary && (
            <div className="p-6 space-y-4">
              <div className={`flex items-center space-x-4 text-gray-500 ${getTextSizeClass('metadata')}`}>
                <span className="flex items-center">
                  <span className="font-medium">Pages:</span>
                  <span className="ml-2">{summary.pages.start} - {summary.pages.end}</span>
                </span>
                <span className="flex items-center">
                  <span className="font-medium">Generated:</span>
                  <span className="ml-2">{new Date(summary.createdAt).toLocaleString()}</span>
                </span>
              </div>

              <div className="prose max-w-none">{formatText(summary.text)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;