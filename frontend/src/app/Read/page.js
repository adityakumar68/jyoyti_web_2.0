"use client";

import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Read() {
  const [logout, setLogout] = useState(false);
  const [imageStatus, setImageStatus] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [textState, setTextState] = useState(''); 
  const router = useRouter();
  const notify = () => toast("Logged out Successfully!");

  useEffect(() => {
    // Request camera access immediately when the component mounts
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // After getting the stream, enumerate devices
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((deviceInfos) => {
        const videoDevices = deviceInfos.filter(
          (device) => device.kind === "videoinput"
        );
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      })
      .catch((error) => console.error("Error accessing camera:", error));
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      // This effect will run when the user selects a different camera
      navigator.mediaDevices
        .getUserMedia({
          video: { deviceId: selectedDeviceId },
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => console.error("Error accessing camera:", error));
    }
  }, [selectedDeviceId]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = 1920;
      canvas.height = 1080;
      context.drawImage(video, 0, 0, 1920, 1080);

      const imageDataURL = canvas.toDataURL("image/png");
      setImageStatus("Image captured successfully!");

      // Play capture sound
      const audio = new Audio("/capture-sound.mp3"); // Ensure this path is correct
      audio.play();

      // Hide the image status after 5 seconds
      setTimeout(() => {
        setImageStatus("");
      }, 5000);

      // Send the captured image to the backend
      fetch("http://localhost:3100/process-image", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageDataURL }),
      })
        .then((response) => response.json())
        .then((data) => setTextState(data.text))
        .catch((error) => console.error("Error:", error));
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:3100/logout", {
        method: "GET",
        credentials: "include", // Include credentials in the request
      });
      if (response.ok) {
        setLogout(true);
        setTimeout(() => {
          notify();
        }, 200);
      } else {
        throw new Error("Logout unsuccessful");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:3100/me", {
          withCredentials: true,
        }); // Assuming '/me' route checks authentication status
        if (response.status === 200) {
          // User is authenticated, do nothing
        } else {
          // User is not authenticated, redirect to '/'
          router.push("/");
        }
      } catch (error) {
        // Error occurred or user is not authenticated, redirect to '/'
        console.log(error);
        router.push("/");
      }
    };

    checkAuth();
  }, [logout, router]);

  const askJyoti = () => {
    // Implement Ask Jyoti functionality
    console.log("Ask Jyoti clicked");
  };

  const getSummary = () => {
    // Implement Summary functionality
    console.log("Summary clicked");
  };

  const copyText = () => {
    navigator.clipboard.writeText(backendText)
      .then(() => alert("Text copied to clipboard!"))
      .catch(err => console.error('Failed to copy text: ', err));
  };

  return (
    <div>
     <nav className="bg-black shadow">
  <div className="container mx-auto px-6 py-4">
    <div className="md:flex md:items-center md:justify-between">
      <div className="flex items-center justify-between">
        <a
          className="text-2xl font-bold text-white lg:text-3xl md:block"
          href="#"
        >
          Jyoti AI
        </a>
        <button id="menu-toggle" className="block md:hidden">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <div id="menu" className="hidden md:flex md:items-center md:w-auto">
        <div className="text-sm md:flex-none">
          <button
            className="block mt-4 mx-4 md:inline-block md:mt-0 text-white hover:text-gray-300"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</nav>


      <div className="flex h-screen">
  <div className="w-1/2 flex flex-col items-center justify-center border-r border-gray-200 p-4">
    <select
      onChange={(e) => setSelectedDeviceId(e.target.value)}
      value={selectedDeviceId}
      className="mb-4"
    >
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Camera ${device.deviceId}`}
        </option>
      ))}
    </select>
    <video
      ref={videoRef}
      autoPlay
      style={{
        width: "90%",
        maxHeight: "400px",
        marginBottom: "40px",
        display: "block",
      }}
    />
    <canvas ref={canvasRef} style={{ display: "none" }} />
    <button
      className="bg-blue-500 text-white py-2 px-4 rounded transition duration-300 ease-in-out hover:bg-blue-800 mt-5"
      onClick={captureImage}
    >
      Read
    </button>
    {imageStatus && <p>{imageStatus}</p>}
  </div>
  
  <div className="w-1/2 flex flex-col items-center justify-center p-4">
  <div className="w-full max-w-4xl"> {/* Increased max-width */}
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Processed Text</h2>
      <div className="bg-gray-100 p-4 rounded-lg mb-4 h-96 overflow-y-auto"> {/* Increased height */}
        <p className="text-lg">{textState}</p> {/* Increased text size */}
      </div>
      <div className="flex justify-between">
        <button onClick={askJyoti} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Ask Jyoti
        </button>
        <button onClick={getSummary} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Summary
        </button>
        <button onClick={copyText} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
          Copy
        </button>
      </div>
    </div>
  </div>
</div>
</div>
      <ToastContainer />
    </div>
  );
}
