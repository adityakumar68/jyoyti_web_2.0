import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp,ChevronDown, Award } from 'lucide-react';

const awards = [
  {
    id: 1,
    title: "Torchit: Empowering People with Disabilities through Innovation",
    description: "Torchit is an Indian enterprise dedicated to empowering People with Disabilities (PwDs) by providing affordable, effective assistive solutions. Recognized with national awards, Torchit aims to foster independence and inclusion, enabling PwDs to lead more fulfilled lives",
    image: "/images/award1.jpg"
  },
  {
    id: 2,
    title: "Awards for Jyoti AI by Torchit",
    description: " Jyoti AI has received global and national recognition, including the UN SDG Award, Rotary Innovation Award, and coverage on CNBC TV18 for its impact on accessibility.",
    image: "/images/awards.jpg"
  },
  {
    id: 3,
    title: "Certifications for Jyoti AI by Torchit",
    description: "Jyoti AI holds key certifications, including CE for compliance with European health standards, ISO 9001:2015 for quality management, and RoHS for environmental safety, ensuring reliability and quality in assistive technology.",
    image: "/images/certificates.jpg"
  },
  {
    id: 4,
    title: "Government of India Recognition and Appreciation for Jyoti AI",
    description: "Jyoti AI has been awarded the 2024 BIRAC Innovator Award by the Biotechnology Industry Research Assistance Council (BIRAC), Government of India, for its AI-powered assistive tool for the visually impaired. The recognition follows a thorough clinical validation involving experts from top institutions like AIIMS. Jyoti AI's technology aims to enhance mobility, accessibility, and navigation for the visually impaired, gaining unanimous approval for its impact and user-friendly design.",
    image: "/images/govn.jpg"
  },
  {
    id: 5,
    title: "Recommendations for Jyoti AI from Leading Organizations",
    description: "Leading organizations—Blind People's Association, NetraDeep Pratishthan, and Samarthanam Trust—commend Jyoti AI for its assistive technology that empowers the visually impaired. The letters praise its affordability, user-friendliness, and ability to enhance mobility and accessibility, highlighting the device's life-changing impact.",
    image: "/images/recommandations.jpg"
  },
  {
    id: 6,
    title: " Endorsements for Jyoti AI from Key Disability Organizations",
    description: "The National Association for the Blind, NIEPVD, and the Association for Disabled People endorse Jyoti AI for its positive impact on visually impaired individuals. The letters commend the device for enhancing mobility, communication, and daily living, benefiting students, seniors, and professionals by fostering greater independence and accessibility.",
    image: "/images/recomm2.jpg"
  }
];


const AwardSlide = ({ award, isSmallScreen }) => (
  <div className={`relative ${isSmallScreen ? 'w-full mb-6' : 'w-1/3'} flex flex-col items-center justify-center ${isSmallScreen ? 'my-2' : 'mx-4'}`}>
    <div className="w-full aspect-square relative">
      <img 
        src={award.image} 
        alt={award.title} 
        className="w-full h-full object-contain bg-gray-800"
      />
      <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center p-4 sm:p-6 text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
        <h3 className={`font-bold text-center mb-2 sm:mb-3 lg:mb-4 
          ${isSmallScreen 
            ? 'text-lg sm:text-xl' 
            : 'text-xl lg:text-2xl'
          }`}
        >
          {award.title}
        </h3>
        <p className={`text-center leading-tight sm:leading-relaxed overflow-y-auto max-h-[70%]
          ${isSmallScreen 
            ? 'text-sm sm:text-base' 
            : 'text-base lg:text-lg'
          }
          max-w-[90%] sm:max-w-[100%]`}
        >
          {award.description}
        </p>
      </div>
    </div>
  </div>
);

const NavigationButton = ({ direction, onClick, isSmallScreen }) => {
  const baseClasses = "absolute bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200 z-10";
  
  const positionClasses = isSmallScreen
    ? direction === 'up' 
      ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" 
      : "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
    : direction === 'left'
      ? "top-1/2 -translate-y-1/2 left-6"
      : "top-1/2 -translate-y-1/2 right-6";

  const buttonSize = isSmallScreen ? 24 : 28;

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${positionClasses}`}
      aria-label={
        direction === 'left' || direction === 'up' 
          ? 'Previous Slide' 
          : 'Next Slide'
      }
    >
      {isSmallScreen
        ? direction === 'up' 
          ? <ChevronUp size={buttonSize} />
          : <ChevronDown size={buttonSize} />
        : direction === 'left'
          ? <ChevronLeft size={buttonSize} />
          : <ChevronRight size={buttonSize} />
      }
    </button>
  );
};

const ThreeAwardSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % (awards.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + awards.length - 2) % (awards.length - 2));
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full bg-gray-900 overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="py-8 lg:py-12">
        {/* Header */}
        <div className="flex items-center text-white mb-8">
          <Award size={isSmallScreen ? 24 : 28} className="shrink-0" />
          <span className={`ml-3 font-bold ${isSmallScreen ? 'text-xl' : 'text-2xl'}`}>
            Awards & Achievements
          </span>
        </div>

        {/* Slider Container */}
        <div className="relative">
          <div className={`${isSmallScreen ? 'flex flex-col space-y-8 py-8' : 'flex'}`}>
            {awards.slice(currentIndex, currentIndex + 3).map((award) => (
              <AwardSlide 
                key={award.id} 
                award={award} 
                isSmallScreen={isSmallScreen}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <NavigationButton 
            direction={isSmallScreen ? 'up' : 'left'} 
            onClick={prevSlide}
            isSmallScreen={isSmallScreen}
          />
          <NavigationButton 
            direction={isSmallScreen ? 'down' : 'right'} 
            onClick={nextSlide}
            isSmallScreen={isSmallScreen}
          />

          {/* Pagination Indicators */}
          <div className={`absolute ${
            isSmallScreen 
              ? 'right-4 sm:right-6 top-1/2 -translate-y-1/2 flex-col' 
              : 'bottom-0 left-0 w-full'
            } flex justify-center gap-2`}>
            {awards.slice(0, awards.length - 2).map((_, index) => (
              <div
                key={index}
                className={`${
                  isSmallScreen ? 'h-8 w-2 sm:h-10 sm:w-3' : 'h-2 sm:h-3 w-8 sm:w-10'
                } rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white' : 'bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeAwardSlider;