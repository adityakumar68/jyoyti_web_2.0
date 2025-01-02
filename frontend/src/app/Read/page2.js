"use client";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { ChevronDown } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import { Play, Pause, RotateCcw, Rewind, FastForward } from "lucide-react";
import LanguageDropdown from "@/components/LanguageDropdown";

export default function Read() {
  const [logout, setLogout] = useState(false);
  const [imageStatus, setImageStatus] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [textState, setTextState] = useState("");
  const [askJyotiState, setAskJyotiState] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioUrl2, setAudioUrl2] = useState("");
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true); // Add a state for play/pause
  const [isPlaying2, setIsPlaying2] = useState(true); // Add a state for play/pause
  const router = useRouter();
  const [modelresponce, setModelResponce] = useState(false);
  const notify = () => toast("Logged out Successfully!");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const jyotiAudioRef = useRef(null);
  const waitingAudioRef = useRef(null); // Add a ref for waiting audio
  const [error, setError] = useState("");
  const [pdfStatus, setPdfStatus] = useState("");
  const [pdfPages, setPdfPages] = useState([]); // Stores text and audio data for each page
  // Add this state at the component level
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const toggleDropdown = () => setShowDropdown((prev) => !prev);
  const toggleDropdown2 = () => setShowDropdown2((prev) => !prev);

  const askJyoti = () => {
    const audio = new Audio("/audio/ask_your_question.mp3"); // Update the path to your local audio file
    audio.play();

    audio.onended = () => {
      startRecording();
    };
  };
  // dropdown for translate feature for the website
  const languages = [
    { code: "hi", name: "Hindi" },
    { code: "en", name: "English" },
    { code: "mr", name: "Marathi" },
    { code: "as", name: "Assamese" },
    { code: "bn", name: "Bengali" },
    { code: "gu", name: "Gujarati" },
  ];

  const translateText = () => {
    if (isRequestPending) {
      console.log("Please wait for the current request to complete");
      return;
    }
    setIsRequestPending(true); // Lock the requests

    // Play waiting audio
    const waitingAudio = new Audio("/audio/waiting.mp3");
    waitingAudio.play();
    waitingAudioRef.current = waitingAudio;

    // Send the request to the backend API
    const language = localStorage.getItem("preferredLanguage");
    console.log(textState, language);
    axios
      .post("https://jyoti-ai.com/api/translate", {
        text: textState,
        targetLanguage: language, // Using the selected language
      })
      .then((response) => {
        const { translatedText, audio } = response.data;

        // Clear the previous translation response
        setTextState("");
        setAudioUrl("");

        // Update the state with the translated text
        setTextState(translatedText);

        // Handle audio playback
        setTimeout(() => {
          setAudioUrl(`data:audio/mp3;base64,${audio}`);
          if (jyotiAudioRef.current) {
            jyotiAudioRef.current.load();
            jyotiAudioRef.current.play();
            setIsPlaying(true);
          }
        }, 50);

        // Stop the waiting audio
        if (waitingAudioRef.current) {
          waitingAudioRef.current.pause();
          waitingAudioRef.current.currentTime = 0;
        }
      })
      .catch((error) => {
        console.error("Error in translation:", error);
        // Stop the waiting audio in case of an error
        if (waitingAudioRef.current) {
          waitingAudioRef.current.pause();
          waitingAudioRef.current.currentTime = 0;
        }
      })
      .finally(() => {
        setIsRequestPending(false); // Unlock for new requests
      });
  };
  const startRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    mediaRecorderRef.current.onstop = sendRecording;
    mediaRecorderRef.current.start();
  };
  const skipTime = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };
  const skipTime2 = (seconds) => {
    if (jyotiAudioRef.current) {
      jyotiAudioRef.current.currentTime += seconds;
    }
  };
  

  const stopRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
      setIsRecording(false);
      setIsRequestPending(false);
      mediaRecorderRef.current.stop();
    }
  };

  const sendRecording = () => {
    if (isRequestPending) {
      console.log("Please wait for the current request to complete");
      return;
    }

    setIsRequestPending(true);
    const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
    const formData = new FormData();
    formData.append("file", blob, "recording.wav");
    formData.append("information", textState);

    // Play waiting audio
    const waitingAudio = new Audio("/audio/waiting.mp3");
    waitingAudio.play();
    waitingAudioRef.current = waitingAudio;

    axios
      .post("https://jyoti-ai.com/api/process_question", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log("Full response:", response.data); // Debug log
        const { responseText, audio } = response.data;

        if (!responseText?.output?.text) {
          console.error("Unexpected response format:", responseText);
          throw new Error("Invalid response format");
        }

        // Set the response text
        setAskJyotiState(responseText.output.text);

        // Handle audio
        if (!audio) {
          console.error("No audio data received");
          throw new Error("No audio data");
        }

        setAudioUrl2("");
        setTimeout(() => {
          const audioUrl = `data:audio/mp3;base64,${audio}`;
          setAudioUrl2(audioUrl);

          if (jyotiAudioRef.current) {
            console.log("Loading audio..."); // Debug log
            jyotiAudioRef.current.load();

            // Add event listeners for debugging
            jyotiAudioRef.current.addEventListener("playing", () => {
              console.log("Audio started playing");
            });

            jyotiAudioRef.current.addEventListener("error", (e) => {
              console.error("Audio error:", e);
            });

            jyotiAudioRef.current
              .play()
              .then(() => {
                console.log("Audio play successful");
                setIsPlaying2(true);
              })
              .catch((error) => {
                console.error("Audio play failed:", error);
              });
          } else {
            console.error("Audio ref not found");
          }
        }, 50);

        // Stop the waiting audio
        if (waitingAudioRef.current) {
          waitingAudioRef.current.pause();
          waitingAudioRef.current.currentTime = 0;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        // Stop the waiting audio in case of an error
        if (waitingAudioRef.current) {
          waitingAudioRef.current.pause();
          waitingAudioRef.current.currentTime = 0;
        }
      })
      .finally(() => {
        setIsRequestPending(false);
      });

    audioChunksRef.current = []; // Clear chunks after sending
  };
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
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

  useEffect(() => {
    if (isRecording) {
      // Stop all audio playback
      if (jyotiAudioRef.current) {
        jyotiAudioRef.current.pause();
        jyotiAudioRef.current.currentTime = 0;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (waitingAudioRef.current) {
        waitingAudioRef.current.pause();
        waitingAudioRef.current.currentTime = 0;
      }

      // Update playing states
      setIsPlaying(false);
      setIsPlaying2(false);
    }
  }, [isRecording]);

  useEffect(() => {
    // When isPlaying2 becomes true, stop isPlaying audio
    if (isPlaying2 && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isPlaying2]);

  useEffect(() => {
    // When isPlaying becomes true, stop isPlaying2 audio
    if (isPlaying && isPlaying2) {
      if (jyotiAudioRef.current) {
        jyotiAudioRef.current.pause();
        jyotiAudioRef.current.currentTime = 0;
        setIsPlaying2(false);
      }
    }
  }, [isPlaying]);

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

      setTimeout(() => {
        setImageStatus("");
      }, 2000);

      // Play waiting audio
      const waitingAudio = new Audio("/audio/waiting.mp3");
      waitingAudio.play();
      waitingAudioRef.current = waitingAudio;

      fetch("https://jyoti-ai.com/api/process-image", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageDataURL }),
      })
        .then((response) => response.json())
        .then((data) => {
          setTextState(data.text);
          setAudioUrl("");
          setTimeout(() => {
            setAudioUrl(`data:audio/mp3;base64,${data.audio}`);
            if (audioRef.current) {
              audioRef.current.load();
              audioRef.current.play();
              setIsPlaying(true); // Set to playing state
            }
          }, 50);

          // Stop the waiting audio
          if (waitingAudioRef.current) {
            waitingAudioRef.current.pause();
            waitingAudioRef.current.currentTime = 0;
          }
        })
        .catch((error) => console.error("Error:", error));
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("https://jyoti-ai.com/api/logout", {
        method: "GET",
        credentials: "include",
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
        const response = await axios.get("https://jyoti-ai.com/api/me", {
          withCredentials: true,
        });
        if (response.status === 200) {
        } else {
          router.push("/");
        }
      } catch (error) {
        console.log(error);
        router.push("/");
      }
    };

    checkAuth();
  }, [logout, router]);

  const getSummary = () => {
    if (isRequestPending) {
      console.log("Please wait for the current request to complete");
      return;
    }
    setIsRequestPending(true); // Lock the requests

    // Play waiting audio
    const waitingAudio = new Audio("/audio/waiting.mp3");
    waitingAudio.play();
    waitingAudioRef.current = waitingAudio;

    // Send the request to the backend API
    axios
      .post("https://jyoti-ai.com/api/get_summary", { information: textState })
      .then((response) => {
        const { responseText, audio } = response.data;

        // Clear the previous Ask Jyoti response
        setAskJyotiState("");
        setAudioUrl2("");

        // Update the state with the summary response text
        // Changed from responseText.outputs[0].text to responseText.output.text
        setAskJyotiState(responseText.output.text);

        setTimeout(() => {
          setAudioUrl2(`data:audio/mp3;base64,${audio}`);
          if (jyotiAudioRef.current) {
            jyotiAudioRef.current.load();
            jyotiAudioRef.current.play();
            setIsPlaying2(true);
          }
        }, 50);

        // Stop the waiting audio
        if (waitingAudioRef.current) {
          waitingAudioRef.current.pause();
          waitingAudioRef.current.currentTime = 0;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        // Stop the waiting audio in case of an error
        if (waitingAudioRef.current) {
          waitingAudioRef.current.pause();
          waitingAudioRef.current.currentTime = 0;
        }
      })
      .finally(() => {
        setIsRequestPending(false); // Unlock for new requests
      });
  };

  const copyText = () => {
    navigator.clipboard
      .writeText(textState)
      .then(() => console.log("copied"))
      .catch((err) => console.error("Failed to copy text: ", err));
  };
  const copyText2 = () => {
    navigator.clipboard
      .writeText(askJyotiState)
      .then(() => console.log("copied"))
      .catch((err) => console.error("Failed to copy text: ", err));
  };
  useEffect(() => {
    if (audioRef.current) {
      const audioElement = audioRef.current;

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      audioElement.addEventListener("play", handlePlay);
      audioElement.addEventListener("pause", handlePause);

      return () => {
        audioElement.removeEventListener("play", handlePlay);
        audioElement.removeEventListener("pause", handlePause);
      };
    }
  }, [audioUrl]);
  useEffect(() => {
    if (jyotiAudioRef.current) {
      const audioElement2 = jyotiAudioRef.current;

      const handlePlay2 = () => setIsPlaying2(true);
      const handlePause2 = () => setIsPlaying2(false);

      audioElement2.addEventListener("play", handlePlay2);
      audioElement2.addEventListener("pause", handlePause2);

      return () => {
        audioElement2.removeEventListener("play", handlePlay2);
        audioElement2.removeEventListener("pause", handlePause2);
      };
    }
  }, [audioUrl2]);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl]);
  useEffect(() => {
    if (jyotiAudioRef.current && audioUrl2) {
      jyotiAudioRef.current.play();
      setIsPlaying2(true);
    }
  }, [audioUrl2]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying); // Toggle the play/pause state
    }
  };
  const toggleJyotiPlayPause = () => {
    if (jyotiAudioRef.current.paused) {
      jyotiAudioRef.current.play();
      setIsPlaying2(true);
    } else {
      jyotiAudioRef.current.pause();
      setIsPlaying2(false);
    }
  };

  // Save OCR result as PDF using jsPDF
  const saveAsPDF = () => {
    const doc = new jsPDF();
    doc.text(textState, 10, 10);
    doc.save("ocr-result.pdf");
  };
  const saveAsPDF2 = () => {
    const doc = new jsPDF();
    doc.text(askJyotiState, 10, 10);
    doc.save("ocr-result.pdf");
  };
  const selectImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const imageDataURL = e.target.result;
        setImageStatus("Image selected successfully!");

        // Clear status message after 2 seconds
        setTimeout(() => {
          setImageStatus("");
        }, 2000);

        // Play waiting audio
        const waitingAudio = new Audio("/audio/waiting.mp3");
        waitingAudio.play();
        waitingAudioRef.current = waitingAudio;

        // Process the image
        fetch("https://jyoti-ai.com/api/process-image", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: imageDataURL }),
        })
          .then((response) => response.json())
          .then((data) => {
            setTextState(data.text);
            setAudioUrl("");

            setTimeout(() => {
              setAudioUrl(`data:audio/mp3;base64,${data.audio}`);
              if (audioRef.current) {
                audioRef.current.load();
                audioRef.current.play();
                setIsPlaying(true);
              }
            }, 50);

            // Stop the waiting audio
            if (waitingAudioRef.current) {
              waitingAudioRef.current.pause();
              waitingAudioRef.current.currentTime = 0;
            }
          })
          .catch((error) => console.error("Error:", error));
      };

      reader.readAsDataURL(file);
    }
  };

  const selectPdf = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const pdfDataURL = e.target.result;
        setPdfStatus("PDF selected successfully!");

        // Clear status message after 2 seconds
        setTimeout(() => {
          setPdfStatus("");
        }, 2000);

        // Play waiting audio
        const waitingAudio = new Audio("/audio/waiting.mp3");
        waitingAudio.play();
        waitingAudioRef.current = waitingAudio;

        // Process the PDF
        fetch("https://jyoti-ai.com/api/process-pdf", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pdf: pdfDataURL }),
        })
          .then((response) => response.json())
          .then((data) => {
            setPdfPages(data.pages); // Store processed PDF page data
            setAudioUrl("");

            // Set audio for the combined PDF text
            setTimeout(() => {
              setAudioUrl(`data:audio/mp3;base64,${data.pages[0].audio}`); // Example: Load audio for the first page
              if (audioRef.current) {
                audioRef.current.load();
                audioRef.current.play();
                setIsPlaying(true);
              }
            }, 50);

            // Stop the waiting audio
            if (waitingAudioRef.current) {
              waitingAudioRef.current.pause();
              waitingAudioRef.current.currentTime = 0;
            }
          })
          .catch((error) => {
            console.error("Error processing PDF:", error);
          });
      };

      reader.readAsDataURL(file);
    }
  };

  // Save OCR result as TXT
  const saveAsTXT = () => {
    const blob = new Blob([textState], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ocr-result.txt";
    link.click();
  };

  // Save OCR result as HTML
  const saveAsHTML = () => {
    const htmlContent = `<html><body><pre>${textState}</pre></body></html>`;
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ocr-result.html";
    link.click();
  };

  const saveAsAudio = () => {
    // Create a temporary anchor element for download
    const link = document.createElement("a");
    link.href = audioUrl; // Use the audioUrl as the file source
    link.download = "audio-file.mp3"; // Set the filename for download
    document.body.appendChild(link);
    link.click(); // Trigger the download
    document.body.removeChild(link); // Clean up
  };

  // Save OCR result as TXT
  const saveAsTXT2 = () => {
    const blob = new Blob([askJyotiState], {
      type: "text/plain;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "AskJyoti-result.txt";
    link.click();
  };

  // Save OCR result as HTML
  const saveAsHTML2 = () => {
    const htmlContent = `<html><body><pre>${askJyotiState}</pre></body></html>`;
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "AskJyoti-result.html";
    link.click();
  };

  const saveAsAudio2 = () => {
    // Create a temporary anchor element for download
    const link = document.createElement("a");
    link.href = audioUrl2; // Use the audioUrl as the file source
    link.download = "AskJyoti-response.mp3"; // Set the filename for download
    document.body.appendChild(link);
    link.click(); // Trigger the download
    document.body.removeChild(link); // Clean up
  };

  // Base button style with more prominent shadow
  const baseButtonStyle =
    "py-2 px-2 sm:px-4 rounded-md text-sm sm:text-base shadow-lg hover:shadow-2xl transition duration-200 ease-in-out";

  // Refined color palette with more depth
  const buttonStyles = {
    primary: `${baseButtonStyle} bg-[#B22222] hover:bg-[#8B0000] text-white`,
    secondary: `${baseButtonStyle} bg-white border border-gray-300 hover:bg-gray-100 text-[#B22222]`,
  };

  return (
    <div className="bg-gray-100 ">
      <nav>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a className="text-4xl font-bold text-red-600" href="#">
              Jyoti AI
            </a>
            <div className="flex items-center">
              <button
                className="text-black hover:text-white border border-gray-400 rounded-lg px-2 py-1 mr-2 text-md font-semibold transition-all duration-200 hover:bg-gray-800 hover:border-gray-800"
                onClick={() => router.push("/Profile")}
              >
                Profile
              </button>
              <button
                className="text-black hover:text-white border border-gray-400 rounded-lg px-2 py-1 text-md font-semibold transition-all duration-200 hover:bg-gray-800 hover:border-gray-800"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Camera Module - Full width on mobile, half on desktop */}
        <div className="w-full md:w-1/2 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200">
          <select
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            value={selectedDeviceId}
            className="w-full max-w-xs p-3 border-4 border-blue-700 rounded-lg text-black focus:outline-none focus:ring-2 mb-6 focus:ring-blue-500 transition duration-200"
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
            className="w-full max-w-lg mb-4 rounded"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex space-x-4 mt-2">
            <button
              className="bg-red-500 text-white text-2xl py-1 px-4 rounded transition duration-300 ease-in-out hover:bg-red-700"
              onClick={() => document.getElementById("fileInput").click()}
            >
              Import Image
            </button>
            <input
              type="file"
              accept="image/*"
              id="fileInput"
              onChange={selectImage}
              style={{ display: "none" }}
            />
            <button
              className="bg-red-500 text-white text-2xl py-1 px-4 rounded transition duration-300 ease-in-out hover:bg-red-700"
              onClick={captureImage}
            >
              Read Camera
            </button>
            {/* <button
              className="bg-red-500 text-white text-2xl py-1 px-4 rounded transition duration-300 ease-in-out hover:bg-red-700"
              onClick={() => document.getElementById("fileInput2").click()}
            >
              Import PDF
            </button> */}

            <input
              type="file"
              accept="application/pdf"
              id="fileInput2"
              onChange={selectPdf}
              style={{ display: "none" }}
            />
          </div>

          <input
            type="file"
            accept="application/pdf"
            id="fileInput2"
            onChange={selectPdf}
            style={{ display: "none" }}
          />
          {imageStatus && (
            <p className="mt-2 text-black text-2xl">{imageStatus}</p>
          )}
        </div>

        {/* Right side content - Full width on mobile, half on desktop */}
        <div className="w-full md:w-1/2 px-4">
          {/* Processed Text Block */}
          <div className="bg-gray-100 shadow-md rounded px-4 sm:px-6 py-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-blue-800">
              Processed Text:
            </h2>
            <div className="bg-white p-4 rounded-lg mb-2 max-h-[180px] overflow-y-auto border-b-4 border-red-600 min-h-[180px]">
              <p className="text-base sm:text-lg leading-relaxed text-gray-700">
                {textState}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Ask Jyoti Button */}
              <button
                onClick={askJyoti}
                className={`${buttonStyles.secondary} flex items-center`}
              >
                🔍&nbsp;Ask Jyoti
              </button>

              {/* Summarize Button */}
              <button
                onClick={getSummary}
                className={`${buttonStyles.secondary} flex items-center`}
              >
                📝&nbsp;Summarize
              </button>

              {/* Copy Text Button */}
              <button
                onClick={copyText}
                className={`${buttonStyles.secondary} flex items-center`}
              >
                📋&nbsp;Copy text
              </button>

              {/* Save As Dropdown */}
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className={`${buttonStyles.secondary} flex items-center`}
                >
                  💾&nbsp;Save As ▼
                </button>
                {showDropdown && (
                  <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-300 rounded shadow-xl z-10">
                    <button
                      onClick={saveAsPDF}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      📄 Save as PDF
                    </button>
                    <button
                      onClick={saveAsTXT}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      📄 Save as TXT
                    </button>
                    <button
                      onClick={saveAsHTML}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      🌐 Save as HTML
                    </button>
                    <button
                      onClick={saveAsAudio}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      🔊 Save as Audio
                    </button>
                  </div>
                )}
              </div>

              {/* Translate Button */}
              <button
                onClick={translateText}
                className={`${buttonStyles.secondary}`}
              >
                Translate
              </button>

              {/* Recording Buttons */}
              {isRecording && (
                <>
                  <button
                    onClick={stopRecording}
                    className={`${buttonStyles.primary}`}
                  >
                    Stop Recording
                  </button>
                  <p className="text-sm text-[#8B0000] self-center">
                    Recording...
                  </p>
                </>
              )}
            </div>
            {audioUrl && (
              <div className="flex flex-col items-center justify-center mt-4">
                <audio
                  ref={audioRef}
                  controls
                  autoPlay
                  className="w-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  <source src={audioUrl} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>

                <div className="flex justify-center mt-2 gap-2">
                  <button
                    onClick={() => skipTime(-1.5)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex items-center gap-1"
                  >
                    <Rewind className="w-4 h-4" />
                    -2s
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex items-center gap-1"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isPlaying ? "Pause" : "Play"}
                  </button>

                  <button
                    onClick={() => {
                      audioRef.current.currentTime = 0;
                      audioRef.current.play();
                    }}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Replay
                  </button>

                  <button
                    onClick={() => skipTime(1.5)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex items-center gap-1"
                  >
                    <FastForward className="w-4 h-4" />
                    +2s
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ask Jyoti and Summary Response Block */}
          <div className="bg-gray-100 shadow-md rounded px-4 sm:px-6 py-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-blue-800">
              Ask Jyoti and Summary Response:
            </h2>
            <div className="bg-white p-4 rounded-lg mb-2 max-h-[180px] overflow-y-auto border-b-4 border-red-600 min-h-[180px]">
              <p className="text-base sm:text-lg leading-relaxed text-gray-700">
                {askJyotiState}
              </p>
            </div>

            <div className="flex items-center space-x-4 mt-2">
              {/* Copy Text Button */}
              <button
                onClick={copyText2}
                className={`${buttonStyles.secondary} flex items-center`}
              >
                📋&nbsp;Copy text
              </button>
              {/* Save As Dropdown */}
              <div className="relative">
                <button
                  onClick={toggleDropdown2}
                  className={`${buttonStyles.secondary} flex items-center`}
                >
                  💾&nbsp;Save As ▼
                </button>
                {showDropdown2 && (
                  <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-300 rounded shadow-xl z-10">
                    <button
                      onClick={saveAsPDF2}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      📄 Save as PDF
                    </button>
                    <button
                      onClick={saveAsTXT2}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      📄 Save as TXT
                    </button>
                    <button
                      onClick={saveAsHTML2}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      🌐 Save as HTML
                    </button>
                    <button
                      onClick={saveAsAudio2}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      🔊 Save as Audio
                    </button>
                  </div>
                )}
              </div>
            </div>

            {audioUrl2 && (
              <div className="flex flex-col items-center justify-center mt-4">
                <audio
                  ref={jyotiAudioRef}
                  controls
                  autoPlay
                  className="w-full"
                  onPlay={() => setIsPlaying2(true)}
                  onPause={() => setIsPlaying2(false)}
                >
                  <source src={audioUrl2} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>

                <div className="flex justify-center mt-2 gap-2">
                  <button
                    onClick={() => skipTime2(-1.5)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex items-center gap-1"
                  >
                    <Rewind className="w-4 h-4" />
                    -2s
                  </button>

                  <button
                    onClick={toggleJyotiPlayPause}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex items-center gap-1"
                  >
                    {isPlaying2 ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isPlaying2 ? "Pause" : "Play"}
                  </button>

                  <button
                    onClick={() => {
                      jyotiAudioRef.current.currentTime = 0;
                      jyotiAudioRef.current.play();
                    }}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Replay
                  </button>

                  <button
                    onClick={() => skipTime2(1.5)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex items-center gap-1"
                  >
                    <FastForward className="w-4 h-4" />
                    +2s
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
