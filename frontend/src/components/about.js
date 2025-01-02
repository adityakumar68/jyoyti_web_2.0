import React, { useState, useEffect, useRef } from 'react';

// AnimatedCounter Component
const AnimatedCounter = ({ endValue, duration = 2000, label }) => {
  const [count, setCount] = useState(0);
  const [showPlus, setShowPlus] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          setCount(0);
          setShowPlus(false);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    let animationFrame;
    
    const numericValue = parseInt(endValue.toString().replace('+', ''));
    const easeOutQuad = t => t * (2 - t);
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      if (progress < 1) {
        const easedProgress = easeOutQuad(progress);
        setCount(Math.floor(numericValue * easedProgress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(numericValue);
        setShowPlus(true);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration, isVisible]);

  return (
    <div 
      ref={counterRef}
      className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300"
    >
      <span className="text-4xl font-bold text-blue-600 mb-2">
        {count.toLocaleString()}
        {showPlus && endValue.toString().includes('+') && '+'}
      </span>
      <span className="text-gray-600 font-medium text-center">{label}</span>
    </div>
  );
};


const ProductCard = ({ title, description, imageSrc, buyLink }) => {
  return (
    <div  className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300 flex flex-col w-full">
      <div className="h-64 overflow-hidden">
        <img
          src={imageSrc || '/api/placeholder/400/320'}
          alt={title}
          className="w-full h-full object-cover transform hover:scale-110 transition-all duration-500"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
        <a
          href={buyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
        >
          Buy Now
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
};


// Main JyotiAIAbout Component
const JyotiAIAbout = () => {
  return (
    <div  id="about" className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-gray-50 to-gray-100 w-full py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* About Section */}
        <div className="flex flex-col lg:flex-row gap-12 items-center mb-16">
          <div className="lg:w-1/2 space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                About <span className="text-red-600">Jyoti</span>
                <span className="text-red-600">AI</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
              Jyoti by Torchit represents a groundbreaking solution for individuals with visual impairments. This AI-powered smart glass leverages cutting-edge artificial intelligence and computer vision to provide features like object recognition, currency identification, color detection, text interpretation, and people recognition.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <AnimatedCounter
            endValue="50000+"
            label="Lives Impacted"
          />
          <AnimatedCounter
            endValue="75+"
            label="Successful Campaigns"
          />
          <AnimatedCounter
            endValue="110+"
            label="Partnerships Worldwide"
          />
        </div>

        {/* Products Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-12">Our Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProductCard
              title="Jyoti AI Pro: Smart Eye Glasses with Audio"
              description="AI smart eye glasses with audio are technologically advanced eyewear that incorporates artificial intelligence capabilities and built-in speakers. They provide a hands-free and immersive experience, allowing users to access information, receive notifications, and listen to audio content directly through the glasses."
              imageSrc="/images/img24.jpg"
              buyLink="https://enablemart.in/shop/ai-smart-eye-glasses-with-audio/"
            />
            <ProductCard
              title="Jyoti AI Smart Eye Glasse"
              description="The Jyoti AI-powered smart glasses enhance the lives of visually impaired individuals by recognizing objects, currency, colors, and people, as well as interpreting text in multiple languages. This advanced device promotes independence, enabling users to engage with the world confidently and paving the way for a more accessible future."
              imageSrc="/images/glasses.webp"
              buyLink="https://enablemart.in/shop/jyoti-ai-smart-eye-glasses/"
            />
            <ProductCard
              title="Jyoti AI Reader & Scanner (Multilingual)"
              description="The Jyoti AI Reader is a portable camera that reads, translates, and digitizes printed content, supporting 34+ languages for audio and 100+ for translation. Designed for accessibility, it features LED lighting, touch controls, offline use, and multi-device compatibility—ideal for visually impaired users seeking independence. "
              imageSrc="/images/img30.jpg"
              buyLink="https://enablemart.in/shop/jyoti-ai-reader/"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JyotiAIAbout;