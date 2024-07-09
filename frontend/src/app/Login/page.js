"use client"

import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { useRouter } from 'next/navigation';
import { getAuth , signInWithEmailAndPassword } from 'firebase/auth'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const Login = () => {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        userCredential.user.getIdToken(true)
          .then((idToken) => {
            axios.post('http://localhost:3100/login', { idToken }, {
              headers: {
                'Content-Type': 'application/json',
              },
              withCredentials: true, // Include credentials in the request
            })
              .then(response => {
                if (response.status === 200) {
                  // Redirect to the desired location after successful login
                  router.push('/Read');
                  setTimeout(() => {
                    notify()
                  }, 400);
                } else {
                  // Handle error if login is unsuccessful
                  throw new Error('Login unsuccessful');
                }
              })
              .catch(error => {
                setTimeout(() => {
                  notify3()
                }, 100);
                console.error('Login error:', error);
              });
          });
      })
      .catch((error) => {
        setTimeout(() => {
          notify2()
        }, 200);
        console.error('Login error:', error);
      });
  };

  return (
    <div>
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
                <a className="block mt-4 md:inline-block md:mt-0 text-gray-800 hover:text-gray-900 mr-6" href="/">
                  Home
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
          <h1 className="text-2xl font-semibold text-center py-4">Login</h1>
          
          <form className="px-6 py-4" onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email:</label>
              <input className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password:</label>
              <input className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">Login</button>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;
