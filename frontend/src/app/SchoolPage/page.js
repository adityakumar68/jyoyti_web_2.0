"use client";

import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useRecoilState } from 'recoil';
import { logoutState, schoolState } from '../../store/atom';
import { UserPlus, LogIn, School, ArrowRight } from 'lucide-react';
import Navbar from "@/components/navbar";
import SchoolLogoutModal from '@/components/SchoolLogoutModal'; 
const SchoolHome = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useRecoilState(schoolState);
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Firebase config and initialization
  const firebaseConfigBase64 = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_BASE64;
  const firebaseConfig = JSON.parse(Buffer.from(firebaseConfigBase64, "base64").toString("utf8"));
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const handleSchoolLogout = async () => {
    try {
      await axios.post('https://jyoti-ai.com/api/school/logout', {}, {
        withCredentials: true
      });
      setSchoolInfo(null);
      router.push('/SchoolLogin');
    } catch (error) {
      console.error('Logout error:', error);
      showToast("error", "Logout failed. Please try again.");
    }
  };

  // Auth check effect
  useEffect(() => {
    axios.defaults.withCredentials = true;
    const checkSchoolAuth = async () => {
      try {
        const response = await axios.get('https://jyoti-ai.com/api/school/me');
        if (response.data) {
          setSchoolInfo({
            schoolId: response.data.schoolId,
            schoolName: response.data.schoolName,
            email: response.data.email
          });
        } else {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      }
    };
    checkSchoolAuth();
  }, []);

  const showToast = (type, message) => {
    toast[type](message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(true);
      
      const response = await axios.post(
        "https://jyoti-ai.com/api/student/login",
        { 
          idToken,
          schoolId: schoolInfo.schoolId 
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        showToast("success", "Welcome back!");
        setTimeout(() => router.push("/ImportDocs"), 1000);
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast("error", "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name.trim() || !grade || grade < 3 || grade > 12) {
      showToast("error", "Please fill in all fields correctly");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(true);

      const response = await axios.post(
        "https://jyoti-ai.com/api/student/signup",
        { 
          idToken,
          schoolId: schoolInfo.schoolId,
          name,
          email,
          grade: parseInt(grade)
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        showToast("success", "Account created successfully!");
        setTimeout(() => router.push("/ImportDocs"), 1000);
      }
    } catch (error) {
      console.error("Signup error:", error);
      showToast("error", error.code === 'auth/email-already-in-use' 
        ? "Email already registered. Please sign in instead." 
        : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
        <Navbar></Navbar>
      {/* Header */}
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            <School className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-900">
              {schoolInfo?.schoolName || 'School Portal'}
            </h1>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="px-4 py-2 text-md font-medium text-blue-600 hover:text-blue-800"
          >
            School Logout
          </button>
        </div>

        {/* Auth Forms */}
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isSignUp ? 'Create Student Account' : 'Student Sign In'}
                </h2>
                <p className="text-blue-100">
                  {isSignUp ? 'Join your school\'s digital platform' : 'Welcome back!'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="px-8 py-6 space-y-4">
                {isSignUp && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade
                      </label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Grade</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 3} value={i + 3}>
                            Grade {i + 3}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="student@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium 
                    ${isLoading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'} 
                    transition-colors duration-200 flex items-center justify-center`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {isSignUp ? <UserPlus className="mr-2 h-5 w-5" /> : <LogIn className="mr-2 h-5 w-5" />}
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Form Type */}
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setEmail("");
                    setPassword("");
                    setName("");
                    setGrade("");
                  }}
                  className="w-full flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <span>{isSignUp ? 'Already have an account?' : 'New student?'}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>{isSignUp ? 'Sign In' : 'Create Account'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SchoolLogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onLogout={handleSchoolLogout}
        />

      <ToastContainer />
    </div>
  );
};

export default SchoolHome;