"use client";

import { FaInfoCircle, FaLightbulb, FaGift, FaNewspaper } from "react-icons/fa";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigation, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { Twitter, Facebook, Instagram, Linkedin } from "lucide-react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/bundle";
import Navbar from "../components/navbar";
import NewsArticles from "../components/newsArticles";
import VideoGallery from "../components/userTestimonials";
import Form from "../components/form";
import UserFeedbacks from "@/components/userFeedback";
import ThreeAwardSlider from "@/components/awards";
import JyotiAIAbout from "@/components/about";
import Head from 'next/head';

const Section = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center w-48">
    <div className="text-red-500 text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

export default function Home() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const swiperRef = useRef(null);

  const NavigationButton = ({ direction }) => {
    const isLeft = direction === "left";

    const handleClick = () => {
      if (isLeft) {
        swiperRef.current.swiper.slidePrev();
      } else {
        swiperRef.current.swiper.slideNext();
      }
    };

    return (
      <button
        onClick={handleClick}
        className={`
          absolute top-1/2 z-10 transform -translate-y-1/2
          ${isLeft ? "left-4" : "right-4"}
          w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          hover:bg-white/20 hover:scale-110
          group shadow-lg hover:shadow-xl
          border border-white/10
        `}
      >
        {isLeft ? (
          <ChevronLeft className="w-6 h-6 text-white transition-transform group-hover:-translate-x-1" />
        ) : (
          <ChevronRight className="w-6 h-6 text-white transition-transform group-hover:translate-x-1" />
        )}
      </button>
    );
  };

  const slides = [
    {
      image: "/images/jyotiAI.jpg",
    },
    {
      image: "/images/necessity.jpg",
    },
    {
      image: "/images/impact2.jpg",
    },
    {
      image: "/images/hunnySir.jpg",
    },
    {
      image: "/images/accessibility.jpg",
    },
    {
      image: "/images/awards.jpg",
    },

    {
      image: "/images/features.jpg",
    },
    {
      image: "/images/glasses.jpg",
    },
    {
      image: "/images/ring.jpg",
    },
    {
      image: "/images/reader.jpg",
    },

    // Add more slides as needed
  ];

  return (
    <>
      <Head>
        {/* Title */}
        <title>Jyoti AI Pro: Smart Glasses for Accessibility</title>

        {/* Meta Description */}
        <meta name="description" content="Explore Jyoti AI Pro Smart Glasses with audio features and AI capabilities. Enhance accessibility, recognize objects, and achieve independence with cutting-edge technology. Buy now!" />

        <meta name="keywords" content="AI smart glasses, accessibility glasses, Jyoti AI, audio glasses, assistive technology, smart eyewear, glasses for visually impaired, object recognition glasses" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Jyoti AI Pro: Smart Glasses for Accessibility" />
        <meta property="og:description" content="Empowering the visually impaired with AI glasses that recognize objects, text, and more." />
        <meta property="og:image" content="https://www.yourwebsite.com/images/jyoti-ai-pro-glasses.jpg" />
        <meta property="og:url" content="https://www.yourwebsite.com/" />
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Jyoti AI Pro: Smart Glasses for Accessibility" />
        <meta name="twitter:description" content="Empowering the visually impaired with AI glasses that recognize objects, text, and more." />
        <meta name="twitter:image" content="https://www.yourwebsite.com/images/jyoti-ai-pro-glasses.jpg" />

        {/* Robots */}
        <meta name="robots" content="index, follow" />
        <meta name="DC.title" content="Jyoti AI Pro: Smart Glasses with AI Audio for Accessibility" />
        <meta name="DC.creator" content="Jyoti AI Team" />
        <meta name="DC.subject" content="AI-powered smart glasses for visually impaired users to gain independence and accessibility." />
        <meta name="DC.description" content="Explore the innovative Jyoti AI Pro Smart Glasses, featuring AI audio, object recognition, and multilingual text reading." />
        <meta name="DC.publisher" content="Jyoti AI" />
        <meta name="DC.language" content="en" />

      </Head>

      {/* Main Content */}
      <main>
      <Navbar></Navbar>

      <div className="flex-grow">
      <div className="w-full relative group">
        <Swiper
          ref={swiperRef}
          modules={[Navigation, Autoplay]}
          className="w-full"
          onSlideChange={() => {
            setIsTransitioning(true);
            setTimeout(() => setIsTransitioning(false), 500);
          }}
          speed={800}
          effect="fade"
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          touchEventsTarget="container"
          threshold={5}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full flex items-center justify-center bg-black overflow-hidden">
                {/* Dynamic height based on screen orientation and device */}
                <div className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[92vh] relative">
                  <img
                    src={slide.image}
                    alt={`Slide ${index}`}
                    className={`
                      absolute inset-0 w-full h-full object-contain
                      transition-transform duration-700 ease-out
                      ${isTransitioning ? "scale-105" : "scale-100"}
                    `}
                  />
                  <div
                    className={`
                      absolute inset-0 bg-black/30
                      flex flex-col items-center justify-center p-4
                      transition-opacity duration-500
                      ${isTransitioning ? "opacity-0" : "opacity-100"}
                    `}
                  >
                    <h2
                      className={`
                        text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold 
                        mb-2 md:mb-4 text-center px-4
                        transform transition-all duration-700
                        ${isTransitioning ? "translate-y-10 opacity-0" : "translate-y-0 opacity-100"}
                      `}
                    >
                      {slide.text}
                    </h2>
                    <p
                      className={`
                        text-white text-sm sm:text-base md:text-lg text-center
                        px-4 max-w-[90%] md:max-w-[80%] lg:max-w-[70%]
                        transform transition-all duration-700 delay-100
                        ${isTransitioning ? "translate-y-10 opacity-0" : "translate-y-0 opacity-100"}
                      `}
                    >
                      {slide.description}
                    </p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation buttons */}
        <NavigationButton direction="left" />
        <NavigationButton direction="right" />
      </div>
      </div>
      <JyotiAIAbout></JyotiAIAbout>
      <ThreeAwardSlider></ThreeAwardSlider>
     
      <NewsArticles></NewsArticles>
      <VideoGallery></VideoGallery>
      <Form></Form>
      

      <footer className="bg-gradient-to-r from-gray-900 to-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Company Information */}
            <div className="space-y-4">
              <h2 className="text-6xl font-bold text-red-500">torch-it</h2>{" "}
              {/* Changed to red */}
              <p className="text-gray-300 italic">
                Empowering Vision Beyond Sight
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-red-500">Address:</p>{" "}
                {/* Changed to red */}
                <p>MV House, 703-708, BAPS Cir,</p>
                <p>Bhadreshwar Society, Shahibag,</p>
                <p>Ahmedabad, Gujarat 380004</p>
              </div>
              <div className="pt-4">
                <p className="font-semibold text-red-500">Contact Us:</p>{" "}
                {/* Changed to red */}
                <p>
                  Email:{" "}
                  <a
                    href="mailto:hello@torchit.in"
                    className="hover:text-red-500 transition duration-300"
                  >
                    hello@torchit.in
                  </a>
                </p>{" "}
                {/* Changed hover color */}
                <p>Phone: +91 722 799 4043</p>
              </div>
            </div>

            {/* Latest Posts */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-red-500">Latest Posts</h2>{" "}
              {/* Changed to red */}
              <ul className="space-y-4">
                <li>
                  <a
                    href="https://www.linkedin.com/posts/torchit_meaningfulbusiness-2024mb100-mb100-activity-7258062685576065025-s6xy?utm_source=share&utm_medium=member_desktop"
                    className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition duration-300"
                  >
                    <h3 className="font-bold text-red-500">
                      Happy to share, we have been recognised MB100 for Meaningful Business 2024. 
                    </h3>{" "}
                    {/* Changed to red */}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/posts/torchit_jyotiai-unga79-pactforthefuture-activity-7243577282777239554-jsC0?utm_source=share&utm_medium=member_desktop"
                    className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition duration-300"
                  >
                    <h3 className="font-bold  text-red-500">
                   JyotiAI has been awarded the prestigious SDG Digital Pioneers Award at the United Nations
                    </h3>{" "}
                    {/* Changed to red */}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/posts/torchit_seoy-youngturks-changmakers-activity-7241040589658415104-CMA1?utm_source=share&utm_medium=member_desktop"
                    className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition duration-300"
                  >
                    <h3 className="font-bold text-red-500">
                    We were honored to receive the Social Entrepreneur of the Year (SEOY)
                    </h3>{" "}
                  </a>
                </li>
              </ul>
              <button className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition duration-300 mt-6">
                {" "}
                {/* Changed to red */}
                Join Our Mission
              </button>
            </div>

            {/* Social Media & Donations */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-red-500 mb-4">
                  Connect With Us
                </h2>{" "}
                {/* Changed to red */}
                <div className="flex space-x-4">
                  <a
                    href="https://x.com/torchitltd"
                    className="text-gray-300 hover:text-red-500 transition duration-300"
                  >
                    <Twitter size={24} />
                  </a>
                  <a
                    href="https://www.facebook.com/torchitt/"
                    className="text-gray-300 hover:text-red-500 transition duration-300"
                  >
                    <Facebook size={24} />
                  </a>
                  <a
                    href="https://www.instagram.com/mytorchit/?hl=en"
                    className="text-gray-300 hover:text-red-500 transition duration-300"
                  >
                    <Instagram size={24} />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/torchit/posts/?feedView=all"
                    className="text-gray-300 hover:text-red-500 transition duration-300"
                  >
                    <Linkedin size={24} />
                  </a>
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-red-500 mb-4">
                  Support Our Cause
                </h2>{" "}
                {/* Changed to red */}
                <p className="text-gray-300 mb-4">
                  Your donation can make a difference in someone's life.
                </p>
                <button className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition duration-300 w-full">
                  {" "}
                  {/* Changed to red */}
                  Donate Now
                </button>
                {/* Payment Icons */}
                <div className="flex space-x-4 mt-6">
                  {" "}
                  {/* Adjusted padding and margin */}
                  <PaymentIcon type="visa" format="flatRounded" width={100} />
                  <PaymentIcon
                    type="mastercard"
                    format="flatRounded"
                    width={100}
                  />
                  <PaymentIcon
                    type="discover"
                    format="flatRounded"
                    width={100}
                  />
                  <PaymentIcon type="amex" format="flatRounded" width={100} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-12 text-gray-400 text-sm">
          <p>© 2023-2024 jyotiAI – Torchit. All Rights Reserved.</p>
        </div>
      </footer>

      <ToastContainer />
      </main>
    </>
  );
}
