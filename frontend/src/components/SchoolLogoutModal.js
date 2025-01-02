import { useState } from "react";
import { XCircle } from 'lucide-react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import axios from 'axios'

const SchoolLogoutModal = ({ isOpen, onClose, onLogout }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First validate the credentials
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(true);
      
      // Verify school credentials
      const response = await axios.post(
        "https://jyoti-ai.com/api/schoolLogin",
        { idToken },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        // If validation successful, proceed with logout
        await onLogout();
        onClose();
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Invalid school credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold leading-6 text-gray-900">
              Confirm School Logout
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Please enter school administrator credentials to confirm logout.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="school@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Password
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

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg
                  ${isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'} 
                  transition-colors duration-200 flex items-center`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Confirm Logout'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
    
  );
};

export default SchoolLogoutModal