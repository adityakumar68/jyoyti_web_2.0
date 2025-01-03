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
import { getFirestore, doc, setDoc } from "firebase/firestore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const notify = () => toast("Logged in Successfully!");
  const notify2 = () => toast("Wrong Credentials!");
  const notify3 = () => toast("Something Went Wrong!");
  const [isLoggedOut, setIsLoggedOut] = useRecoilState(logoutState);
  const firebaseConfigBase64 = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_BASE64;

  if (!firebaseConfigBase64) {
    throw new Error(
      "Missing Firebase configuration base64 string in environment variables."
    );
  }

  // Decode the base64 string to get the JSON string
  const firebaseConfigJson = Buffer.from(
    firebaseConfigBase64,
    "base64"
  ).toString("utf8");

  // Parse the JSON string to get the config object
  const firebaseConfig = JSON.parse(firebaseConfigJson);
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleLogin = async (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        userCredential.user.getIdToken(true).then((idToken) => {
          axios
            .post(
              "https://jyoti-ai.com/api/login",
              { idToken },
              {
                headers: {
                  "Content-Type": "application/json",
                },
                withCredentials: true, // Include credentials in the request
              }
            )
            .then(async (response) => {
              const data = response.data;
              const email =response.data.email
              
              
              if (response.status === 200) {
                  localStorage.setItem("userEmail", email);
                  console.log("Stored email:", email);
                  setIsLoggedOut(false)     
                  await router.push("/Read");
                  setTimeout(() => {
                      notify();
                  }, 400);
              }
          })
            .catch((error) => {
              setTimeout(() => {
                notify3();
              }, 100);
              console.error("Login error:", error);
            });
        });
      })
      .catch((error) => {
        setTimeout(() => {
          notify2();
        }, 200);
        console.error("Login error:", error);
      });
  };

  return (
    <div>
      <Navbar></Navbar>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-lg overflow-hidden">
          <h1 className="text-3xl font-semibold text-center py-6 text-indigo-800">
            Login
          </h1>
          <form className="px-8 py-6" onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                className="block text-indigo-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email:
              </label>
              <input
                className="appearance-none border border-indigo-400 rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email"
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

export default Login;
