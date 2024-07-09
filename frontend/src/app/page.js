"use client";

import { FaInfoCircle, FaLightbulb, FaGift, FaNewspaper } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import 'swiper/css/bundle';

const Section = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center w-48">
    <div className="text-red-500 text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

export default function Home() {
  const sections = [
    {
      icon: <FaInfoCircle />,
      title: 'About Torchit',
      description: 'A social venture dedicated to the upliftment, advancement, and empowerment of the differently abled',
    },
    {
      icon: <FaLightbulb />,
      title: 'About Innovation',
      description: 'Technological innovation lies at the heart of our initiatives aimed at developing IoT, AI & ML based solutions for improving the quality of life of persons with disabilities',
    },
    {
      icon: <FaGift />,
      title: 'Gift Now',
      description: 'Become the reason for a blind person’s smile today; contribute to our ‘Donate for a Cause’ program',
    },
    {
      icon: <FaNewspaper />,
      title: 'News & Media',
      description: 'Get access to latest news & updates about TorchIt and our impact in the lives of the differently abled',
    },
  ];

  const slides = [
    {
      image: '/images/sarthi.jpg',
      text: "A company By the Blind, For the Blind & Of the Blind",
      description: "TorchIt is brewing a microsystem within the organisation where the Differently Abled community is not only empowered through using modern & effective products, but it tries to integrate as many Differently Abled people in its workforce, thereby giving more freedom & power to the community"
    },
    {
      image: '/images/sarthi.png',
      text: "A company By the Blind, For the Blind & Of the Blind",
      description: "TorchIt is brewing a microsystem within the organisation where the Differently Abled community is not only empowered through using modern & effective products, but it tries to integrate as many Differently Abled people in its workforce, thereby giving more freedom & power to the community"
    },
    // Add more slides as needed
  ];

  return (
    <div className="flex flex-col min-h-screen overflow-auto">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex items-center justify-between">
              <a className="text-2xl font-bold text-gray-800 lg:text-3xl md:block" href="#">
                Jyoti AI
              </a>
              <button id="menu-toggle" className="block md:hidden">
                <svg className="h-6 w-6 text-gray-800" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div id="menu" className="hidden md:flex md:items-center md:w-auto">
              <div className="text-sm md:flex-none">
                <a className="block mt-4 md:inline-block md:mt-0 text-gray-800 hover:text-gray-900 mr-6" href="/Login">
                  Login
                </a>
                <a className="block mt-4 md:inline-block md:mt-0 text-gray-800 hover:text-gray-900 mr-6" href="#">
                  Buy Now
                </a>
                <a className="block mt-4 md:inline-block md:mt-0 text-gray-800 hover:text-gray-900" href="#">
                  About Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="flex-grow">
        <Swiper
          navigation={true}
          modules={[Navigation]}
          className="mySwiper"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-[92vh]">
                <img src={slide.image} alt={`Slide ${index}`} className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center p-4">
                  <h2 className="text-white text-4xl font-bold mb-4 text-center">{slide.text}</h2>
                  <p className="text-white text-lg text-center">{slide.description}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="flex justify-around py-10">
          {sections.map((section, index) => (
            <Section
              key={index}
              icon={section.icon}
              title={section.title}
              description={section.description}
            />
          ))}
        </div>

        <div className="relative flex justify-center items-center min-h-screen bg-gray-100">
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            className="absolute w-full h-full object-cover"
            type="video/mp4"
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col md:flex-row items-center text-center p-8 bg-white bg-opacity-75 rounded-lg shadow-lg max-w-5xl">
            {/* Left half: Text content */}
            <div className="flex flex-col items-start text-left p-4 md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">About Torchit</h2>
              <p className="text-gray-700 mb-6">
                Torchit is a Government of India aided social venture tech-startup that empowers persons with disabilities to lead a dignified, independent, and meaningful life through design and development of state-of-the-art technological innovations using Artificial Intelligence and Machine Learning.
              </p>
              <button className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 mb-6">
                ABOUT US
              </button>
              {/* Stats */}
              <div className="flex flex-col md:flex-row justify-around w-full mt-6">
                <div className="flex flex-col items-center mb-4 md:mb-0 md:mr-4">
                  <span className="text-2xl font-bold text-blue-600">50000</span>
                  <span className="text-gray-600">Lives impacted</span>
                </div>
                <div className="flex flex-col items-center mb-4 md:mb-0 md:mr-4">
                  <span className="text-2xl font-bold text-blue-600">75</span>
                  <span className="text-gray-600">Campaigns</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-blue-600">110+</span>
                  <span className="text-gray-600">Partnerships Worldwide</span>
                </div>
              </div>
            </div>

            {/* Right half: Images */}
            <div className="flex justify-center items-center p-4 md:w-1/2">
              <div className="flex flex-col md:flex-row justify-center items-center space-x-4">
                <img src='/images/Capture11.png' alt="Device 1" className="w-48 h-48 object-contain mb-4 md:mb-0 md:mr-4" />
                <img src='/images/device2.png' alt="Device 2" className="w-32 h-32 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-black text-white p-6">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div>
          <h2 className="text-xl font-bold mb-4">torch-it</h2>
          <p>Empowering Vision Beyond Sight</p>
          <div className="mt-4">
            <p>Head Office (HO):</p>
            <p>205, ABC 1, Opp. Waghbakri Tea Lounge, Off. CG Road</p>
            <p>Ahmedabad - 380009</p>
            <p>Email: hello@torchit.in</p>
            <p>Phone: +91 722 799 4043</p>
          </div>
          <div className="mt-4">
            <p>Manufacturing Office (MO):</p>
            <p>703, M V House, Namaste Circle, Shahibaug</p>
            <p>Ahmedabad - 380004</p>
          </div>
        </div>
        
        {/* Latest Posts */}
        <div>
          <h2 className="text-xl font-bold mb-4">Latest Posts</h2>
          <ul>
            <li className="mb-2"><a href="#" className="text-green-500">Dilipbhai: A Beacon of Hope</a></li>
            <li className="mb-2"><a href="#" className="text-green-500">5 things you must know about TorchIt’s NorthEast India crusade</a></li>
            <li className="mb-2"><a href="#" className="text-green-500">Saarthi: Carving a better future for thousands of visually impaired</a></li>
          </ul>
          <button className="bg-green-500 text-white px-4 py-2 mt-4">Click To Join Us</button>
        </div>
        
        {/* Social Media & Donations */}
        <div>
          <h2 className="text-xl font-bold mb-4">@TorchitLtd</h2>
          <div className="bg-gray-800 p-4 mb-4">
            <p>Nothing to see here - yet</p>
            <a href="#" className="text-blue-500">View on X</a>
          </div>
          <h2 className="text-xl font-bold mb-4">Donate Now</h2>
          <div className="space-y-4">
            <img src="" alt="PayPal Donate" className="w-32 mx-auto" />
            <div className="flex justify-center space-x-4">
              <img src="" alt="Visa" className="w-10" />
              <img src="" alt="MasterCard" className="w-10" />
              <img src="" alt="Discover" className="w-10" />
              <img src="" alt="American Express" className="w-10" />
            </div>
            <img src="" alt="Paytm" className="w-32 mx-auto" />
          </div>
        </div>
      </div>
      <div className="text-center mt-6">
        <p>All Right Reserved 2023-2024 @ jyotiAI – Torchit </p>
      </div>
    </footer>

      <ToastContainer />
    </div>
  );
}
