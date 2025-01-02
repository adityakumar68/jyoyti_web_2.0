"use client"

import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { useRouter } from 'next/navigation';
import { getAuth , createUserWithEmailAndPassword } from 'firebase/auth'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Navbar2 from '../../components/navbar';
import { getFirestore, doc, setDoc } from "firebase/firestore";

const Login = () => {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fname,setFname]=useState('');
  const [number,setNumber]=useState('');
  const router = useRouter();
  const notify = () => toast("Logged in Successfully!");
  const notify2 = () => toast("Wrong Credentials!");
  const notify3 = () => toast("Something Went Wrong!");
  const firebaseConfigBase64 = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_BASE64;

  if (!firebaseConfigBase64) {
    throw new Error('Missing Firebase configuration base64 string in environment variables.');
  }
  
  // Decode the base64 string to get the JSON string
  const firebaseConfigJson = Buffer.from(firebaseConfigBase64, 'base64').toString('utf8');
  
  // Parse the JSON string to get the config object
  const firebaseConfig = JSON.parse(firebaseConfigJson);
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  
  const registerUser = async (email, password, fname, mobileno) => {
    try {
      // 1. Create authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // 2. Store additional user data in Firestore
      await setDoc(doc(db, "free_users", user.uid), {
        email: email,
        fName: fname,
        mobile: mobileno,
      });
  
      return {
        success: true,
        user: user,
        message: "User successfully registered"
      };
  
    } catch (error) {
      let errorMessage;
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address";
          break;
        case 'auth/weak-password':
          errorMessage = "Password should be at least 6 characters";
          break;
        default:
          errorMessage = error.message;
      }
  
      return {
        success: false,
        error: errorMessage
      };
    }
  };


  const handleRegister = async (e) => {
    e.preventDefault();
    const result = await registerUser(
      email,
      password,
      fname,
      number
    );
  
    if (result.success) {
      console.log("Registration successful:", result.user);
      router.push('/Login');
      // Navigate to next screen or show success message
    } else {
      console.error("Registration failed:", result.error);
      // Show error message to user
    }
  };
  

  return (
    <div>
    <Navbar2></Navbar2>
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
  <div className="max-w-lg w-full bg-white rounded-lg shadow-lg overflow-hidden">
    <h1 className="text-3xl font-semibold text-center py-6 text-indigo-800">
      Signup
    </h1>
    <form className="px-8 py-6" onSubmit={handleRegister}>
       <div className="mb-4">
        <label
          className="block text-indigo-700 text-sm font-bold mb-2"
          htmlFor="fname"
        >
          Full Name
        </label>
        <input
          className="appearance-none border border-indigo-400 rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
          id="fname"
          type="text"
          value={fname}
          onChange={(e) => setFname(e.target.value)}
          aria-label="fname"
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-indigo-700 text-sm font-bold mb-2"
          htmlFor="number"
        >
          Mobile Number
        </label>
        <input
          className="appearance-none border border-indigo-400 rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
          id="number"
          type="tel"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          aria-label="number"
        />
      </div>
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
        Signup
      </button>
    </form>
  </div>
</div>
    <ToastContainer />
  </div>
  
  
  );
};

export default Login;
