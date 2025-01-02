import React from 'react';
import { Gift } from 'lucide-react';

const JyotiAIForm = () => {
  const handleRedirect = (e) => {
    e.preventDefault();
    window.location.href = "https://forms.gle/Qe4C8XsH1b4KNY8F7";
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Section - Images */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src="/images/jyoti_glasses.png" 
                  alt="Jyoti AI glasses" 
                  className="col-span-2 w-full object-contain h-40"
                />
                <img 
                  src="images/jyoti_pro.png" 
                  alt="Jyoti AI Pro" 
                  className="w-full object-contain h-40"
                />
                <img 
                  src="images/jyoti_hardware.png" 
                  alt="Jyoti AI Reader" 
                  className="w-full object-contain h-40"
                />
              </div>
            </div>

            {/* Right Section - Content */}
            <div className="p-8 flex flex-col justify-center">
              <div className="text-center lg:text-left space-y-6">
                <div className="flex justify-center lg:justify-start">
                  <Gift className="w-12 h-12 text-indigo-600" />
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Want Jyoti AI For Free?
                  </h2>
                  <p className="text-lg text-gray-600">
                    Get exclusive access to Jyoti AI! Fill out the form below and start your journey with AI.
                  </p>
                </div>

                <button
                  onClick={handleRedirect}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Access JyotiAI Signup Form
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JyotiAIForm;