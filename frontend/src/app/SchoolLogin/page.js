"use client";

import { useState } from "react";
import { initializeApp } from "firebase/app";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useRecoilState } from 'recoil';
import { logoutState, schoolState } from '../../store/atom';  // Add schoolState
import Navbar from "../../components/navbar";
import { BookOpen, School, Lock } from 'lucide-react';

const SchoolLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isLoggedOut, setIsLoggedOut] = useRecoilState(logoutState);
  const [, setSchoolInfo] = useRecoilState(schoolState);  // Add schoolState
  const firebaseConfigBase64 = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_BASE64;

  if (!firebaseConfigBase64) {
    throw new Error("Missing Firebase configuration");
  }

  const firebaseConfigJson = Buffer.from(firebaseConfigBase64, "base64").toString("utf8");
  const firebaseConfig = JSON.parse(firebaseConfigJson);
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const showToast = (type, message) => {
    toast[type](message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(true);
      
      const response = await axios.post(
        "https://jyoti-ai.com/api/schoolLogin",
        { idToken },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,  // Important for cookies
        }
      );

      if (response.status === 200) {
        const { schoolId, schoolName, email } = response.data;
        
        // Store school info in Recoil state
        setSchoolInfo({
          schoolId,
          schoolName,
          email
        });
        
        setIsLoggedOut(false);
        showToast("success", `Welcome back, ${schoolName}!`);
        router.push("/SchoolPage");
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast("error", error.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md px-6">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-8 py-6">
              <div className="flex justify-center mb-4">
                <School className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-center text-white">
                School Portal Login
              </h1>
              <p className="text-indigo-200 text-center mt-2">
                Access your school's dashboard 
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="school@example.com"
                    required
                  />
                  <BookOpen className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium 
                  ${isLoading 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'} 
                  transition-colors duration-200 flex items-center justify-center`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default SchoolLogin;