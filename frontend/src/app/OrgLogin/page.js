"use client";

import { useState } from "react";
import { initializeApp } from "firebase/app";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useRecoilState } from 'recoil';
import { logoutState } from '../../store/atom';
import Navbar from "../../components/navbar";

const OrgLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [isLoggedOut, setIsLoggedOut] = useRecoilState(logoutState);
  
  const firebaseConfigBase64 = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_BASE64;

  if (!firebaseConfigBase64) {
    throw new Error("Missing Firebase configuration base64 string in environment variables.");
  }

  // Decode the base64 string to get the JSON string
  const firebaseConfigJson = Buffer.from(firebaseConfigBase64, "base64").toString("utf8");
  const firebaseConfig = JSON.parse(firebaseConfigJson);
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(true);
  
      const response = await axios.post(
        "https://jyoti-ai.com/api/org/login",
        { idToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
  
      if (response.status === 200) {
        // Get data from response
        const { orgId, email: orgEmail, orgName } = response.data;
        
        // Store necessary data
        localStorage.setItem("orgEmail", orgEmail);
        localStorage.setItem("orgId", orgId);
        
        setIsLoggedOut(false);
        toast.success("Logged in Successfully!");
        
        // Redirect to org dashboard with search params
        router.push(`/OrgDashboard?orgId=${orgId}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response && error.response.status === 401) {
        toast.error("Not authorized as an organization admin");
      } else if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        toast.error("Invalid credentials");
      } else {
        toast.error("An error occurred during login");
      }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-lg overflow-hidden">
          <h1 className="text-3xl font-semibold text-center py-6 text-indigo-800">
            Organization Login
          </h1>
          <form className="px-8 py-6" onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                className="block text-indigo-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Organization Email:
              </label>
              <input
                className="appearance-none border border-indigo-400 rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email"
                required
              />
            </div>
            <div className="mb-6">
              <label
                className="block text-indigo-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                Password:
              </label>
              <input
                className="appearance-none border border-indigo-400 rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Password"
                required
              />
            </div>
            <button
              className="w-full bg-indigo-600 hover:bg-indigo-800 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Login
            </button>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default OrgLogin;