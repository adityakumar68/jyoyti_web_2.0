const express = require("express");
const cookieParser = require("cookie-parser");
const textToSpeech = require("@google-cloud/text-to-speech");
const { SpeechClient } = require("@google-cloud/speech");
const multer = require("multer");
const bodyParser = require("body-parser");
const firebaseAdmin = require("firebase-admin");
const cors = require("cors");
const Together = require("together-ai");
const path = require("path");
const fs = require("fs");
const detectText = require("./textDetection");
const { createCanvas } = require("canvas");
const PDFDocument = require("pdfkit");
const sharp = require("sharp");
const { PDFDocument: PDFLib } = require("pdf-lib");
const vision = require("@google-cloud/vision");
const fs2 = require("fs").promises;
const pdf = require("pdf-parse");


require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
// Initialize Vision client
const visionClient = new vision.ImageAnnotatorClient();

// Your API key from Google AI Studio
const API_KEY = process.env.GOOGLE_API_KEY;

// Initialize the model
const genAI = new GoogleGenerativeAI(API_KEY);

// Store active conversations
const activeChats = new Map();

const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

// Initialize the Google Speech client
const speechClient = new SpeechClient();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images and PDFs
    if (
      file.mimetype.startsWith('image/') || 
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and WAV audio files are allowed.'), false);
    }
  },
});

const upload2= multer({ dest: "uploads/" });


// Utility function to generate unique document ID
const generateDocId = () => {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
// Utility function to convert images to PDF
const convertImagesToPDF = async (files) => {
  // Create chunks array to collect PDF data
  const chunks = [];
  
  // First, process all images to get their dimensions
  const imageInfos = await Promise.all(files.map(async (file) => {
    const metadata = await sharp(file.buffer).metadata();
    
    // Optimize image
    const optimizedImage = await sharp(file.buffer)
      .resize(metadata.width, metadata.height, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();
      
    return {
      buffer: optimizedImage,
      width: metadata.width,
      height: metadata.height
    };
  }));

  // Create PDF with custom page sizes
  return new Promise((resolve, reject) => {
    // Create first page with first image dimensions
    const firstImage = imageInfos[0];
    const pdfDoc = new PDFDocument({
      size: [firstImage.width, firstImage.height],
      margin: 0 // Remove margins
    });

    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);

    // Process each image sequentially
    const processImages = async () => {
      try {
        for (let i = 0; i < imageInfos.length; i++) {
          const imageInfo = imageInfos[i];
          
          // For pages after the first one, add a new page with custom size
          if (i > 0) {
            pdfDoc.addPage({
              size: [imageInfo.width, imageInfo.height],
              margin: 0
            });
          }

          // Add image to the page, using the full page dimensions
          pdfDoc.image(imageInfo.buffer, 0, 0, {
            width: imageInfo.width,
            height: imageInfo.height
          });
        }
        
        pdfDoc.end();
      } catch (error) {
        reject(new Error(`Failed to process images: ${error.message}`));
      }
    };

    processImages().catch(reject);
  });
};

const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
const REGION_NAME = process.env.REGION_NAME;
const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

const client = new BedrockRuntimeClient({
  region: REGION_NAME,
  credentials: {
    secretAccessKey: SECRET_KEY,
    accessKeyId: ACCESS_KEY,
  },
});

const ttsClient = new textToSpeech.TextToSpeechClient({
  keyFilename:
    "/home/aditya/intern/jyoti_web/backend/positive-leaf-427611-h7-1426bbecb44e.json", // Replace with the path to your service account file
});

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!serviceAccountBase64) {
  throw new Error(
    "Missing Firebase service account base64 string in environment variables."
  );
}

if (!databaseURL) {
  throw new Error("Missing Firebase database URL in environment variables.");
}

// Decode the base64 string to get the JSON string
const serviceAccountJson = Buffer.from(serviceAccountBase64, "base64").toString(
  "utf8"
);

// Parse the JSON string to get the service account object
const serviceAccount = JSON.parse(serviceAccountJson);

// Initialize Firebase Admin SDK
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  storageBucket: "jyotiai.firebasestorage.app",
});
const app = express();
const bucket = firebaseAdmin.storage().bucket();

console.log(bucket.name); // This will print your bucket name
const db = firebaseAdmin.firestore();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const port = 3100;
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const checkAuth = async (req, res, next) => {
  const sessionCookie = req.cookies.session || "";

  firebaseAdmin
    .auth()
    .verifySessionCookie(sessionCookie, true)
    .then((decodedClaims) => {
      req.user = decodedClaims;
      next();
    })

    .catch((error) => {
      res.status(401).send("Unauthorized");
    });
};

// Handle login using ID token
app.post("/login", async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify the ID token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    if (!decodedToken) {
      return res.status(401).send("Unauthorized");
    }

    const email = decodedToken.email;
    console.log("Checking email:", email);

    // Query users collection for matching email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      return res.status(401).json({ 
        error: "User not registered", 
        message: "Please register first" 
      });
    }

    // Create session cookie
    const expiresIn = 604800000; // 1 week in milliseconds
    const sessionCookie = await firebaseAdmin.auth()
      .createSessionCookie(idToken, { expiresIn });

    // Set cookie
    res.cookie("session", sessionCookie, { 
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Get the user data from first matching document
    const userData = usersSnapshot.docs[0].data();

    // Return success with user data
    res.status(200).json({
      message: "Login successful",
      user: {
        email: email,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
});
// Protected route
app.get("/me", checkAuth, (req, res) => {
  res.status(200).send(`Welcome ${req.user.email}`);
});

app.get("/logout", checkAuth, (req, res) => {
  res.cookie("session", "");
  res.status(200).send(`Logout successful`);
});

app.post("/process-image", checkAuth, async (req, res) => {
  try {
    const { image } = req.body;

    // Process the image and detect text
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const filePath = path.join(process.cwd(), "captured-image.png");
    await fs.promises.writeFile(filePath, base64Data, "base64");

    // Read and detect text from image
    const imageBuffer = await fs.promises.readFile(filePath);
    const detectedText = await detectText(imageBuffer);

    // Ensure detectedText is not empty and split if necessary
    if (!detectedText) throw new Error("No text detected in the image");

    // Helper function to split text into 5000-byte chunks
    const splitText = (text, maxBytes = 5000) => {
      const chunks = [];
      let currentText = "";

      for (const word of text.split(" ")) {
        if (Buffer.byteLength(currentText + " " + word, "utf8") < maxBytes) {
          currentText += " " + word;
        } else {
          chunks.push(currentText.trim());
          currentText = word;
        }
      }

      if (currentText) chunks.push(currentText.trim());
      return chunks;
    };

    // Split text if it exceeds the byte limit
    const textChunks = splitText(detectedText);

    // Text-to-Speech conversion for each chunk and concatenate audio results

    const audioBuffers = [];
    const wordTimings = []; // To store the word timings for the entire text

    for (const chunk of textChunks) {
      const request = {
        input: { text: chunk },
        voice: { languageCode: "en-IN", ssmlGender: "NEUTRAL" },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 0.9,
          enable_time_pointing: ["WORD"], // Enable word timings
        },
      };

      const [response] = await ttsClient.synthesizeSpeech(request);
      console.log(response); // This will show the full response, which should include timepoints
      if (response.timepoints) {
        console.log("Timepoints:", response.timepoints);
      } else {
        console.log("No timepoints returned in response.");
      }

      // Process the timepoints for each word
      if (response.timepoints) {
        // The response will have timepoints for each word
        response.timepoints.forEach((timepoint, index) => {
          wordTimings.push({
            word: timepoint.word,
            startTime: timepoint.timeSeconds, // Start time of the word
            endTime:
              index < response.timepoints.length - 1
                ? response.timepoints[index + 1].timeSeconds // End time is the start of the next word
                : timepoint.timeSeconds + 1, // If it's the last word, assume a 1-second duration
          });
        });
      }

      // Add the audio content to the buffer
      audioBuffers.push(response.audioContent);
    }

    // Concatenate audio buffers and save to file
    const combinedAudio = Buffer.concat(
      audioBuffers.map((buf) => Buffer.from(buf, "base64"))
    );
    const audioFilePath = path.join(process.cwd(), "output.mp3");
    await fs.promises.writeFile(audioFilePath, combinedAudio, "binary");

    // The combined audio base64 can be sent back to the frontend
    const audioBase64 = combinedAudio.toString("base64");

    console.log(wordTimings);

    // Send the response
    res.status(200).json({
      message: "Image processed successfully",
      text: detectedText,
      audio: audioBase64,
    });
  } catch (apiError) {
    console.error(apiError);
    res
      .status(500)
      .json({ error: "Failed to process image and generate audio" });
  }
});

// Helper: Split text into chunks for TTS
const splitText = (text, maxBytes = 5000) => {
  const chunks = [];
  let currentText = "";

  for (const word of text.split(" ")) {
    if (Buffer.byteLength(currentText + " " + word, "utf8") < maxBytes) {
      currentText += " " + word;
    } else {
      chunks.push(currentText.trim());
      currentText = word;
    }
  }

  if (currentText) chunks.push(currentText.trim());
  return chunks;
};

// Helper: Save audio buffers as a file
const saveAudioToFile = async (audioBuffers, outputFilePath) => {
  const combinedAudio = Buffer.concat(
    audioBuffers.map((buf) => Buffer.from(buf, "base64"))
  );
  await fs.writeFile(outputFilePath, combinedAudio, "binary");
  return combinedAudio.toString("base64");
};

app.post("/process_question", upload2.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const textState = req.body.information;

    // Convert audio to text using Google Speech-to-Text
    const audio = {
      content: fs.readFileSync(filePath).toString("base64"),
    };

    const request = {
      audio: audio,
      config: {
        languageCode: "en-IN",
      },
    };
    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");

    console.log("Transcription:", transcription);

    // Prepare the message based on whether there's additional information
    const promptMessage = textState
      ? `Based on this information: ${textState}, answer the following question: ${transcription}`
      : transcription;

    // Call Together.ai API
    const togetherResponse = await together.chat.completions.create({
      messages: [
        {
          role: "user",
          content: promptMessage,
        },
      ],
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      max_tokens: 8000,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
    });

    // Get the response text
    const generatedText = togetherResponse.choices[0].message.content;

    console.log("Generated Text:", generatedText);

    // Text-to-speech conversion
    const ttsRequest = {
      input: { text: generatedText },
      voice: { languageCode: "en-IN", ssmlGender: "NEUTRAL" },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.9,
      },
    };

    const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
    const audioBase64 = ttsResponse.audioContent.toString("base64");

    // Delete the uploaded file
    fs.unlinkSync(filePath);

    // Match the frontend's expected format
    res.status(200).json({
      responseText: {
        output: {
          text: generatedText, // Changed from outputs[0].text to output.text
        },
      },
      audio: audioBase64,
    });
  } catch (error) {
    console.error("Error processing question:", error.message);
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }
    res.status(500).json({
      error: "Failed to process question",
      details: error.message,
    });
  }
});

app.post("/get_summary", async (req, res) => {
  try {
    const textState = req.body.information;
    console.log(textState);

    if (!textState) {
      return res.status(500).json("No information provided");
    }

    // Prepare the prompt for Together AI
    const promptMessage = `Based on this information, give the summary: ${textState}`;

    // Call Together AI API
    const togetherResponse = await together.chat.completions.create({
      messages: [
        {
          role: "user",
          content: promptMessage,
        },
      ],
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      max_tokens: 8000,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
    });

    // Get the generated summary
    const generatedSummary = togetherResponse.choices[0].message.content;
    console.log("Generated Summary:", generatedSummary);

    // Convert summary to speech using Google Text-to-Speech
    const ttsRequest = {
      input: { text: generatedSummary },
      voice: { languageCode: "en-IN", ssmlGender: "NEUTRAL" },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.9,
      },
    };

    const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
    const audioBase64 = ttsResponse.audioContent.toString("base64");

    // Send response with the same structure as before
    res.status(200).json({
      responseText: {
        output: {
          text: generatedSummary,
        },
      },
      audio: audioBase64,
    });
  } catch (error) {
    console.error("Error processing summary:", error.message);
    res.status(500).json({
      error: "Failed to generate summary",
      details: error.message,
    });
  }
});

// api for translation

app.post("/translate", async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    console.log("Text to translate:", text);
    console.log("Target language:", targetLanguage);
    // Set the appropriate language code for Text-to-Speech
    targetLanguage2 = targetLanguage;
    let languageCode;
    switch (targetLanguage) {
      case "Hindi":
        languageCode = "hi-IN";
        break;
      case "English":
        languageCode = "en-IN";
        break;
      case "Marathi":
        languageCode = "mr-IN";
        break;
      case "Assamese":
        languageCode = "en-IN";
        break;
      case "Bengali":
        languageCode = "bn-IN";
        break;
      case "Gujarati":
        languageCode = "gu-IN";
        break;
      default:
        languageCode = "en-IN";
    }

    if (!text || !targetLanguage2) {
      return res.status(500).json("Text and target language are required");
    }

    // Prepare the prompt for Together AI
    const promptMessage = `
        "${text}"
        Your task is to translate the given text in ${targetLanguage2} language. Please translate in the ${targetLanguage2}. Give only the translated text. It is very important to translate in ${targetLanguage2} only.
        `;

    console.log(promptMessage);

    // Call Together AI API
    const togetherResponse = await together.chat.completions.create({
      messages: [
        {
          role: "user",
          content: promptMessage,
        },
      ],
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      max_tokens: 10000,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
    });

    // Get the translated text
    const translatedText = togetherResponse.choices[0].message.content;
    console.log("Translated Text:", translatedText);

    // Convert translated text to speech using Google Text-to-Speech
    const ttsRequest = {
      input: { text: translatedText },
      voice: { languageCode: languageCode, ssmlGender: "NEUTRAL" },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.9,
      },
    };

    const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
    const audioBase64 = ttsResponse.audioContent.toString("base64");

    // Send response
    res.status(200).json({
      translatedText: translatedText,
      audio: audioBase64,
    });
  } catch (error) {
    console.error("Error in translation:", error.message);
    res.status(500).json({
      error: "Failed to translate text",
      details: error.message,
    });
  }
});

app.post("/save-pdf", checkAuth, upload.array("files"), async (req, res) => {
  try {
    const { files } = req;
    const userEmail = req.user.email;
    const documentName = req.body.documentName || "Untitled Document"; // Get document name from request body

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const docId = generateDocId();
    const isImages = files.every((file) => file.mimetype.startsWith("image/"));
    let pdfBuffer;

    if (isImages) {
      pdfBuffer = await convertImagesToPDF(files);
    } else {
      pdfBuffer = files[0].buffer;
    }

    // Get total pages from PDF
    let totalPages;
    try {
      const pdfData = await pdf(pdfBuffer);
      totalPages = pdfData.numpages;
    } catch (pdfError) {
      console.error("Error counting PDF pages:", pdfError);
      totalPages = 0; // Fallback value if counting fails
    }

    // Modified storage path
    const storagePath = `documents/${userEmail}/${docId}.pdf`;
    const file = bucket.file(storagePath);

    // Upload with explicit content type
    await file.save(pdfBuffer, {
      metadata: {
        contentType: "application/pdf",
      },
      public: true, // Makes the file publicly accessible
      validation: "md5",
    });

    // Get the public URL instead of signed URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Save to Firestore with totalPages and documentName
    const documentData = {
      docId,
      userId: userEmail,
      url: publicUrl,
      storagePath,
      documentName, // Add document name to Firestore
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      type: isImages ? "converted-images" : "uploaded-pdf",
      originalFileCount: files.length,
      status: "active",
      flashcards: [],
      summary: [],
      //adding a content array to avoice while generating quizzes , summary , content 
      content:{},
      quizzes: [],
      totalPages: totalPages,
    };

    await db.collection("documents").doc(docId).set(documentData);

    res.status(200).json({
      success: true,
      docId,
      url: publicUrl,
      documentName, // Include document name in response
      totalPages,
      message: "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Document upload failed:", error);
    res.status(500).json({
      error: "Document upload failed",
      details: error.message,
    });
  }
});
// Endpoint to fetch user's documents
app.get("/user-documents", checkAuth, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Simpler query that doesn't require composite index
    const documents = await db
      .collection("documents")
      .where("userId", "==", userEmail)
      .get();

    const userDocs = documents.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }))
      // Sort in memory
      .sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json(userDocs);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    res.status(500).json({
      error: "Failed to fetch documents",
      details: error.message,
    });
  }
});

// Add this endpoint to your existing backend
app.get("/get-document/:id", checkAuth, async (req, res) => {
  try {
    const docId = req.params.id;
    const userEmail = req.user.email;

    // Get document from Firestore
    const docRef = await db.collection("documents").doc(docId).get();

    if (!docRef.exists) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docData = docRef.data();

    // Verify user has access to this document
    if (docData.userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get quizzes with their latest response scores
    const quizzesWithScores = await Promise.all((docData.quizzes || []).map(async quiz => {
      try {
        // Get all responses for this quiz and user, then sort in memory
        const responseSnapshot = await db.collection('quiz_responses')
          .where('quizId', '==', quiz.quizId)
          .get();
        
        // Sort responses by submittedAt in memory
        const responses = responseSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.submittedAt?.toMillis() - a.submittedAt?.toMillis());

        if (responses.length > 0) {
          const response = responses[0];
          return {
            ...quiz,
            score: {
              score: response.score,
              total: response.totalQuestions,
            }
          };
        }

        // Return quiz without score if no responses found
        return {
          ...quiz,
          score: null
        };
      } catch (error) {
        console.error(`Error fetching quiz response for ${quiz.quizId}:`, error);
        return quiz;
      }
    }));

    // Return document data with scored quizzes
    res.status(200).json({
      id: docRef.id,
      ...docData,
      quizzes: quizzesWithScores,
      flashcards: docData.flashcards || [],
      createdAt: docData.createdAt?.toDate(),
      pdfUrl: docData.url
    });

  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({
      error: "Failed to fetch document",
      details: error.message,
    });
  }
});
/*async function processPdfPages(pdfBuffer, startPage, endPage) {
  try {
    // Load the PDF document using PDFLib
    const pdfDoc = await PDFLib.load(pdfBuffer);

    // Validate page range
    const pageCount = pdfDoc.getPageCount();
    if (startPage < 1 || endPage > pageCount || startPage > endPage) {
      throw new Error(
        `Invalid page range specified. Document has ${pageCount} pages.`
      );
    }

    // Create a new PDF with only the specified pages
    const newPdfDoc = await PDFLib.create();

    // Copy the specified pages (convert to 0-based index)
    const pageIndices = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => i + startPage - 1
    );

    const pages = await newPdfDoc.copyPages(pdfDoc, pageIndices);

    // Add the pages to the new document
    pages.forEach((page) => newPdfDoc.addPage(page));

    // Save the new PDF
    const trimmedPdfBytes = await newPdfDoc.save();

    // Convert PDF to base64
    const encodedPdf = Buffer.from(trimmedPdfBytes).toString("base64");

    // Prepare request for Cloud Vision API
    const request = {
      requests: [
        {
          inputConfig: {
            content: encodedPdf,
            mimeType: "application/pdf",
          },
          features: [
            {
              type: "DOCUMENT_TEXT_DETECTION",
            },
          ],
          pages: pageIndices.map((i) => i + 1), // Convert back to 1-based for Vision API
        },
      ],
    };

    // Call Vision API's batchAnnotateFiles
    const [result] = await visionClient.batchAnnotateFiles(request);

    // Extract text from the response
    const textResponses = result.responses[0].responses;
    let extractedText = "";

    textResponses.forEach((response) => {
      if (response.fullTextAnnotation) {
        extractedText += response.fullTextAnnotation.text + "\n";
      }
    });
    console.log(extractedText);

    return extractedText.trim();
  } catch (error) {
    console.error("PDF Processing error details:", error);
    throw new Error(`Error processing PDF: ${error.message}`);
  }
}*/
async function processPdfPages(pdfBuffer, startPage, endPage, docId, userEmail) {
  try {
    // Load the PDF document
    const pdfDoc = await PDFLib.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Validate page range
    if (startPage < 1 || endPage > pageCount || startPage > endPage) {
      throw new Error(`Invalid page range. Document has ${pageCount} pages.`);
    }

    // Define the content storage path
    const contentStoragePath = `documents/${userEmail}/${docId}/contents/pages.json`;
    const contentFile = bucket.file(contentStoragePath);
    
    // Try to get existing content file
    let existingContent = {};
    try {
      const [contentBuffer] = await contentFile.download();
      existingContent = JSON.parse(contentBuffer.toString());
      console.log('Successfully loaded existing content');
    } catch (error) {
      console.log('No existing content file found, starting fresh');
    }

    const pageIndices = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage - 1 + i
    );

    let extractedText = "";
    let hasNewContent = false;
    let updatedContent = { ...existingContent };
    
    // Process each page
    for (const pageIndex of pageIndices) {
      const pageNumber = pageIndex + 1;
      
      // Check if content exists in cache
      if (updatedContent[pageNumber]) {
        console.log(`Using cached content for page ${pageNumber}`);
        extractedText += updatedContent[pageNumber] + "\n\n";
        continue;
      }

      try {
        // Create a separate PDF for each page
        const singlePagePdf = await PDFLib.create();
        const [page] = await singlePagePdf.copyPages(pdfDoc, [pageIndex]);
        singlePagePdf.addPage(page);

        // Convert single page PDF to base64
        const pdfBytes = await singlePagePdf.save();
        const encodedPdf = Buffer.from(pdfBytes).toString("base64");

        // Prepare request for single page
        const request = {
          requests: [{
            inputConfig: {
              content: encodedPdf,
              mimeType: "application/pdf",
            },
            features: [{
              type: "DOCUMENT_TEXT_DETECTION",
            }],
            pages: [1],
          }],
        };

        // Process single page
        const [result] = await visionClient.batchAnnotateFiles(request);
        const pageResponse = result.responses[0].responses[0];

        if (pageResponse && pageResponse.fullTextAnnotation) {
          const pageContent = pageResponse.fullTextAnnotation.text;
          extractedText += pageContent + "\n\n";
          
          // Store the new content
          updatedContent[pageNumber] = pageContent;
          hasNewContent = true;
        }
      } catch (pageError) {
        console.error(`Error processing page ${pageNumber}:`, pageError);
        extractedText += `[Error extracting text from page ${pageNumber}]\n\n`;
        
        // Store the error message
        updatedContent[pageNumber] = `[Error extracting text from page ${pageNumber}]`;
        hasNewContent = true;
      }
    }

    // If we have new content to update
    if (hasNewContent) {
      try {
        // Save the updated content to Storage
        await contentFile.save(JSON.stringify(updatedContent, null, 2), {
          metadata: { 
            contentType: "application/json",
            metadata: {
              lastUpdated: new Date().toISOString()
            }
          }
        });
        
        console.log(`Updated content cache for pages: ${pageIndices.map(i => i + 1).join(", ")}`);
      } catch (updateError) {
        console.error("Error updating content cache in storage:", updateError);
        // Continue execution even if cache update fails
      }
    }

    return extractedText.trim();
  } catch (error) {
    console.error("PDF Processing error details:", error);
    throw new Error(`Error processing PDF: ${error.message}`);
  }
}
// Constants for question generation
const MAX_PAGES_PER_CHUNK = 5;

const getQuestionPrompt = (text, type, numQuestions, language = 'English') => {
  const basePrompt = `Using this content:\n${text}\n\n`;
  
  // Calculate number of questions for each difficulty
  const getDistribution = (total) => {
    const totalNum = parseInt(total) || 10;
    return {
      easy: Math.ceil(totalNum * 0.3),      // 30% easy
      medium: Math.ceil(totalNum * 0.4),     // 40% medium
      hard: totalNum - Math.ceil(totalNum * 0.3) - Math.ceil(totalNum * 0.4)  // remaining hard
    };
  };

  const distribution = numQuestions ? getDistribution(numQuestions) : 'a balanced mix';
  const difficultySpec = numQuestions 
    ? `${distribution.easy} easy, ${distribution.medium} medium, and ${distribution.hard} hard questions` 
    : "an equal distribution of easy, medium, and hard questions";

  const languageInstruction = language.toLowerCase() !== 'english' 
    ? `Generate all questions, options, and explanations in ${language}. Use simple, clear language that's easily understood.` 
    : "Use simple, clear English that's easily understood by everyone.";

  const difficultyGuidelines = `
Difficulty levels should be distributed as follows:
- Easy questions: Test recall and basic comprehension. Focus on directly stated facts and simple connections.
- Medium questions: Test understanding and application. Require connecting multiple pieces of information.
- Hard questions: Test analysis and evaluation. Require deeper understanding, inference, and critical thinking.`;

  const mcqPrompt = `${basePrompt}Generate ${difficultySpec} multiple choice questions. ${languageInstruction}

Follow this exact JSON format:
[
  {
    "question": "Clear, contextual question that naturally incorporates relevant information?",
    "options": {
      "A": "First option (directly from the content)",
      "B": "Second option (directly from the content)",
      "C": "Third option (directly from the content)",
      "D": "Fourth option (directly from the content)"
    },
    "correct": ["A", "C"],
    "type": "mcq",
    "difficulty": "easy|medium|hard",
    "skills": ["analysis", "critical-thinking", "application"],
    "conceptualArea": "Topic or concept from the content",
    "explanation": "Detailed explanation showing why the correct options are right and why incorrect options are wrong"
  }
]

Guidelines:${difficultyGuidelines}

For each difficulty level:
- Easy: Single concept questions with straightforward answers
- Medium: Questions combining multiple related concepts
- Hard: Questions requiring analysis of complex relationships or evaluation of multiple factors

Additional requirements:
- Frame questions naturally within their context
- ALL options must come directly from the provided content
- Keep language simple and clear
- Never use information from outside the content`;

  const scqPrompt = `${basePrompt}Generate ${difficultySpec} single choice questions. ${languageInstruction}

Follow this exact JSON format:
[
  {
    "question": "Natural, contextual question that incorporates relevant information?",
    "options": {
      "A": "First option (directly from the content)",
      "B": "Second option (directly from the content)",
      "C": "Third option (directly from the content)",
      "D": "Fourth option (directly from the content)"
    },
    "correct": "A",
    "type": "scq",
    "difficulty": "easy|medium|hard",
    "skills": ["comprehension", "analysis"],
    "conceptualArea": "Topic or concept from the content",
    "explanation": "Clear explanation showing why the answer is correct and others are incorrect"
  }
]

Guidelines:${difficultyGuidelines}

For each difficulty level:
- Easy: Direct factual questions
- Medium: Questions requiring understanding of relationships
- Hard: Questions involving complex reasoning or multiple concepts`;

  const trueFalsePrompt = `${basePrompt}Generate ${difficultySpec} true/false questions. ${languageInstruction}

Follow this exact JSON format:
[
  {
    "question": "Clear statement incorporating relevant context?",
    "correct": true,
    "type": "truefalse",
    "difficulty": "easy|medium|hard",
    "skills": ["fact-checking", "inference"],
    "conceptualArea": "Topic or concept from the content",
    "explanation": "Clear explanation showing why the statement is true/false"
  }
]

Guidelines:${difficultyGuidelines}

For each difficulty level:
- Easy: Simple factual statements
- Medium: Statements combining multiple facts
- Hard: Complex statements requiring inference or analysis`;

  const fillInBlanksPrompt = `${basePrompt}Generate ${difficultySpec} fill-in-the-blank questions. ${languageInstruction}

Follow this exact JSON format:
[
  {
    "question": "Complete sentence with natural context and a _____ for the blank",
    "correct": "answer (directly from the content)",
    "type": "fillinblanks",
    "difficulty": "easy|medium|hard",
    "skills": ["recall", "contextual-understanding"],
    "conceptualArea": "Topic or concept from the content",
    "explanation": "Clear explanation showing why this is the correct answer"
  }
]

Guidelines:${difficultyGuidelines}

For each difficulty level:
- Easy: Single word or simple phrase blanks
- Medium: Key concept or term blanks requiring understanding
- Hard: Blanks requiring synthesis of multiple concepts`;

  switch (type) {
    case "mcq":
      return mcqPrompt;
    case "scq":
      return scqPrompt;
    case "truefalse":
      return trueFalsePrompt;
    case "fillinblanks":
      return fillInBlanksPrompt;
    default:
      return mcqPrompt;
  }
};

// MCQ Generation Route with Gemini
app.post("/get-mcq/:id", checkAuth, async (req, res) => {
  try {
    const docId = req.params.id;
    const userEmail = req.user.email;
    let { startPage, endPage, numQuestions, questionType = "mcq" , lang} = req.body;
    console.log("Number of questions requested:", numQuestions);
    const quizName = `${questionType}_${numQuestions || "auto"}_page${startPage}-${endPage}`;
    const quizId = `quiz_${Date.now()}_${quizName}`;

    startPage = parseInt(startPage);
    endPage = parseInt(endPage);

    // Document verification
    const docRef = await db.collection("documents").doc(docId).get();
    if (!docRef.exists) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docData = docRef.data();
    if (docData.userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    const file = bucket.file(docData.storagePath);
    const [pdfBuffer] = await file.download();

    // Process text in chunks
    const chunks = [];
    for (let i = startPage; i <= endPage; i += MAX_PAGES_PER_CHUNK) {
      chunks.push({
        start: i,
        end: Math.min(i + MAX_PAGES_PER_CHUNK - 1, endPage),
      });
    }

    let allExtractedText = "";
    for (const chunk of chunks) {
      try {
        // Pass both docId and userEmail to processPdfPages
        const chunkText = await processPdfPages(pdfBuffer, chunk.start, chunk.end, docId, userEmail);
        allExtractedText += chunkText + "\n\n";
      } catch (error) {
        console.error(`Error processing chunk ${chunk.start}-${chunk.end}:`, error);
        if (!allExtractedText) {
          throw new Error(`Failed to extract text from initial chunk: ${error.message}`);
        }
        break;
      }
    }

    if (!allExtractedText.trim()) {
      throw new Error("No text could be extracted from any of the pages");
    }

    // Rest of your existing code for quiz generation remains the same...
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      maxTokens: 12000 
    });

    const prompt = getQuestionPrompt(allExtractedText, questionType, numQuestions, lang);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawResponse = response.text();
    console.log(rawResponse)
    const questions = extractAndValidateJSON(rawResponse, questionType);
    console.log(questions)

    // Prepare quiz data
    const quizData = {
      pages: { start: startPage, end: endPage },
      questions,
      createdAt: new Date().toISOString(),
      quizId,
      quizName,
      questionType,
      numQuestions: questions.length,
      processedChunks: chunks,
    };

    // Save quiz to Firebase Storage
    const quizStoragePath = `documents/${userEmail}/${docId}/quizzes/${quizId}.json`;
    const quizFile = bucket.file(quizStoragePath);
    await quizFile.save(JSON.stringify(quizData, null, 2), {
      metadata: { contentType: "application/json" },
      public: true,
    });

    const quizUrl = `https://storage.googleapis.com/${bucket.name}/${quizStoragePath}`;

    // Update Firestore with quiz metadata
    await db.collection("documents").doc(docId).update({
      quizzes: firebaseAdmin.firestore.FieldValue.arrayUnion({
        quizId,
        quizName,
        url: quizUrl,
        pages: { start: startPage, end: endPage },
        createdAt: firebaseAdmin.firestore.Timestamp.now(),
        numQuestions: questions.length,
        questionType,
        processedChunks: chunks,
      }),
    });

    res.status(200).json({
      success: true,
      questions,
      quizId,
      quizName,
      pages: { start: startPage, end: endPage },
      processedChunks: chunks,
      numQuestions: questions.length,
      questionType,
    });
  } catch (error) {
    console.error("Error processing questions:", error);
    res.status(500).json({
      error: "Failed to generate questions",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Flashcard Generation Route with Gemini
app.post("/get-flashcards/:id", checkAuth, async (req, res) => {
  try {
    const docId = req.params.id;
    const userEmail = req.user.email;
    let { startPage, endPage , lang } = req.body;
    
    startPage = parseInt(startPage);
    endPage = parseInt(endPage);

    // Document verification and access check
    const docRef = await db.collection("documents").doc(docId).get();
    if (!docRef.exists) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docData = docRef.data();
    if (docData.userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    const file = bucket.file(docData.storagePath);
    const [pdfBuffer] = await file.download();

    // Process text in chunks
    const chunks = [];
    for (let i = startPage; i <= endPage; i += MAX_PAGES_PER_CHUNK) {
      chunks.push({
        start: i,
        end: Math.min(i + MAX_PAGES_PER_CHUNK - 1, endPage),
      });
    }

    let allExtractedText = "";
    for (const chunk of chunks) {
      try {
        // Use updated processPdfPages with docId and userEmail
        const chunkText = await processPdfPages(pdfBuffer, chunk.start, chunk.end, docId, userEmail);
        allExtractedText += chunkText + "\n\n";
      } catch (error) {
        console.error(`Error processing chunk ${chunk.start}-${chunk.end}:`, error);
        if (!allExtractedText) {
          throw new Error(`Failed to extract text from initial chunk: ${error.message}`);
        }
        break;
      }
    }

    if (!allExtractedText.trim()) {
      throw new Error("No text could be extracted from any of the pages");
    }

    // Generate flashcards using Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      maxTokens: 8000
    });

    const prompt = `Analyze this text and create 5-15 flashcards. Each flashcard should have a front side (question or concept) and back side (answer or explanation). Format the output as a JSON array like this:
    [
      {
        "front": "Question or concept",
        "back": "Detailed answer or explanation"
      }
    ]
    
    Make the content comprehensive but concise. and the language of the content should be in ${lang} language Source text: ${allExtractedText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawResponse = response.text();

    // Parse the flashcards from the response
    let flashcards;
    try {
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid flashcard format received");
      }
    } catch (error) {
      console.error("Error parsing flashcards:", error);
      throw new Error("Failed to parse flashcard data");
    }

    // Create unique ID and prepare data
    const setId = `flashcards_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const flashcardData = {
      setId,
      pages: { start: startPage, end: endPage },
      flashcards,
      createdAt: new Date().toISOString(),
      processedChunks: chunks,
    };

    // Save to Firebase Storage
    const storagePath = `documents/${userEmail}/${docId}/flashcards/${setId}.json`;
    const flashcardFile = bucket.file(storagePath);

    await flashcardFile.save(JSON.stringify(flashcardData, null, 2), {
      metadata: {
        contentType: "application/json",
        metadata: {
          lastUpdated: new Date().toISOString()
        }
      },
      public: true,
    });

    const flashcardUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Update Firestore document with flashcard metadata
    await db.collection("documents").doc(docId).update({
      flashcards: firebaseAdmin.firestore.FieldValue.arrayUnion({
        setId,
        url: flashcardUrl,
        pages: { start: startPage, end: endPage },
        createdAt: firebaseAdmin.firestore.Timestamp.now(),
        processedChunks: chunks,
      }),
    });

    res.status(200).json({
      success: true,
      flashcards,
      setId,
      url: flashcardUrl,
      pages: { start: startPage, end: endPage },
      processedChunks: chunks,
    });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({
      error: "Failed to generate flashcards",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});
// Quiz Data Retrieval API
app.get("/get-quiz-data/:docId/:quizId", checkAuth, async (req, res) => {
  try {
    const { docId, quizId } = req.params;
    const userEmail = req.user.email;

    // Verify access
    const docRef = await db.collection("documents").doc(docId).get();
    if (!docRef.exists) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docData = docRef.data();
    if (docData.userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    const quizRef = docData.quizzes?.find((quiz) => quiz.quizId === quizId);
    if (!quizRef) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Get quiz data
    const quizStoragePath = `documents/${userEmail}/${docId}/quizzes/${quizId}.json`;
    const quizFile = bucket.file(quizStoragePath);

    const [fileExists] = await quizFile.exists();
    if (!fileExists) {
      return res.status(404).json({ error: "Quiz file not found in storage" });
    }

    // Download and parse
    const [quizDataBuffer] = await quizFile.download();
    const quizData = JSON.parse(quizDataBuffer.toString());

    // Validate questions array
    if (!Array.isArray(quizData.questions)) {
      return res.status(500).json({ error: "Invalid quiz data format" });
    }

    res.status(200).json(quizData);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({
      error: "Failed to fetch quiz data",
      details: error.message,
    });
  }
});
// Helper function to parse MCQ string into structured format
function formatMCQString(mcqString) {
  try {
    // Split the string into individual questions
    const lines = mcqString.split("\n");
    const questions = [];
    let currentQuestion = null;

    lines.forEach((line) => {
      line = line.trim();
      if (!line) return; // Skip empty lines

      // Check for new question (starts with number and dot)
      const questionMatch = line.match(/^(\d+)\.(.*)/);
      if (questionMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          id: parseInt(questionMatch[1]),
          question: questionMatch[2].trim(),
          options: [],
          correctAnswer: null,
        };
      }
      // Check for options (starts with a letter and parenthesis)
      else if (currentQuestion && line.match(/^[A-Da-d]\)/)) {
        const option = line.substring(2).trim();
        currentQuestion.options.push(option);

        // If this option has a correct answer indicator
        if (line.toLowerCase().includes("(correct)") || line.includes("✓")) {
          currentQuestion.correctAnswer = option
            .replace(/\s*\(correct\)/i, "")
            .replace("✓", "")
            .trim();
        }
      }
    });

    // Add the last question
    if (currentQuestion) {
      // If no correct answer was marked, use the first option as correct
      if (
        !currentQuestion.correctAnswer &&
        currentQuestion.options.length > 0
      ) {
        currentQuestion.correctAnswer = currentQuestion.options[0];
      }
      questions.push(currentQuestion);
    }

    return questions;
  } catch (error) {
    console.error("Error formatting MCQ string:", error);
    return []; // Return empty array if parsing fails
  }
}

// Get all quizzes for a document
app.get("/get-quizzes/:docId", checkAuth, async (req, res) => {
  try {
    const { docId } = req.params;
    const userEmail = req.user.email;

    // First verify document ownership
    const docRef = db.collection("documents").doc(docId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists || docSnapshot.data().userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Fetch quizzes for this document
    const quizzesSnapshot = await db
      .collection("quizzes")
      .where("docId", "==", docId)
      .get();

    const quizzes = [];
    quizzesSnapshot.forEach((quiz) => {
      quizzes.push({
        id: quiz.id,
        ...quiz.data(),
        createdAt: quiz.data().createdAt?.toDate(),
      });
    });

    res.status(200).json({
      quizzes: quizzes.sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({
      error: "Failed to fetch quizzes",
      details: error.message,
    });
  }
});

// Get all flashcards for a document
app.get("/get-flashcards/:docId", checkAuth, async (req, res) => {
  try {
    const { docId } = req.params;
    const userEmail = req.user.email;

    // First verify document ownership
    const docRef = db.collection("documents").doc(docId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists || docSnapshot.data().userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Fetch flashcards for this document
    const flashcardsSnapshot = await db
      .collection("flashcards")
      .where("docId", "==", docId)
      .get();

    const flashcards = [];
    flashcardsSnapshot.forEach((flashcard) => {
      flashcards.push({
        id: flashcard.id,
        ...flashcard.data(),
        createdAt: flashcard.data().createdAt?.toDate(),
      });
    });

    res.status(200).json({
      flashcards: flashcards.sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    res.status(500).json({
      error: "Failed to fetch flashcards",
      details: error.message,
    });
  }
});

app.post("/get-flashcards/:id", checkAuth, async (req, res) => {
  try {
    const docId = req.params.id;
    const userEmail = req.user.email;
    const { startPage, endPage } = req.body;

    console.log(
      `Processing request for docId: ${docId}, pages ${startPage}-${endPage}`
    );

    // Get document from Firestore
    const docRef = await db.collection("documents").doc(docId).get();
    if (!docRef.exists) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docData = docRef.data();
    if (docData.userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    const file = bucket.file(docData.storagePath);
    const [pdfBuffer] = await file.download();

    // Break the page range into chunks
    const MAX_PAGES_PER_CHUNK = 5;
    const chunks = [];
    for (let i = startPage; i <= endPage; i += MAX_PAGES_PER_CHUNK) {
      chunks.push({
        start: i,
        end: Math.min(i + MAX_PAGES_PER_CHUNK - 1, endPage),
      });
    }

    // Process each chunk and collect text
    let allExtractedText = "";
    for (const chunk of chunks) {
      try {
        console.log(`Processing chunk: pages ${chunk.start}-${chunk.end}`);
        const chunkText = await processPdfPages(
          pdfBuffer,
          chunk.start,
          chunk.end
        );
        allExtractedText += chunkText + "\n\n";
      } catch (error) {
        console.error(
          `Error processing chunk ${chunk.start}-${chunk.end}:`,
          error
        );
        if (!allExtractedText) {
          throw new Error(
            `Failed to extract text from initial chunk: ${error.message}`
          );
        }
        break;
      }
    }

    if (!allExtractedText.trim()) {
      throw new Error("No text could be extracted from any of the pages");
    }

    // Generate flashcards using Together AI
    let prompt = `Analyze the following text and generate an appropriate number of flashcards (between 5-15) based on the content density and importance of concepts. For each flashcard, create a front side with a question or concept, and a back side with the answer or explanation. Format the output as a JSON array with "front" and "back" properties for each card. The content should be concise but comprehensive. Text: ${allExtractedText}`;

    const togetherResponse = await together.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      max_tokens: 8000,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
    });

    // Parse the response to ensure it's valid JSON
    let flashcards;
    try {
      const responseText = togetherResponse.choices[0].message.content;
      // Extract JSON array from the response if it's wrapped in text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid flashcard format received");
      }
    } catch (error) {
      console.error("Error parsing flashcards:", error);
      throw new Error("Failed to parse flashcard data");
    }

    // Create a unique ID for the flashcard set
    const setId = `flashcards_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Prepare the flashcard data
    const flashcardData = {
      setId,
      pages: { start: startPage, end: endPage },
      flashcards,
      createdAt: new Date().toISOString(),
      processedChunks: chunks,
    };

    // Save flashcards to Firebase Storage
    const storagePath = `documents/${userEmail}/${docId}/flashcards/${setId}.json`;
    const flashcardFile = bucket.file(storagePath);

    await flashcardFile.save(JSON.stringify(flashcardData, null, 2), {
      metadata: {
        contentType: "application/json",
      },
      public: true,
    });

    const flashcardUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Update Firestore document
    await db
      .collection("documents")
      .doc(docId)
      .update({
        flashcards: firebaseAdmin.firestore.FieldValue.arrayUnion({
          setId,
          url: flashcardUrl,
          pages: { start: startPage, end: endPage },
          createdAt: firebaseAdmin.firestore.Timestamp.now(),
        }),
      });

    res.status(200).json({
      success: true,
      flashcards,
      setId,
      url: flashcardUrl,
    });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({
      error: "Failed to generate flashcards",
      details: error.message,
    });
  }
});

app.get("/get-flashcard-set/:docId/:setId", checkAuth, async (req, res) => {
  try {
    const { docId, setId } = req.params;
    const userEmail = req.user.email;

    // Get document from Firestore to verify access and get flashcard reference
    const docRef = await db.collection("documents").doc(docId).get();

    if (!docRef.exists) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docData = docRef.data();
    if (docData.userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Find the flashcard reference in the document's flashcards array
    const flashcardRef = docData.flashcards?.find(
      (flashcard) => flashcard.setId === setId
    );

    if (!flashcardRef) {
      return res.status(404).json({ error: "Flashcard set not found" });
    }

    // Get the flashcard data from Firebase Storage
    const flashcardStoragePath = `documents/${userEmail}/${docId}/flashcards/${setId}.json`;
    const flashcardFile = bucket.file(flashcardStoragePath);

    const [fileExists] = await flashcardFile.exists();
    if (!fileExists) {
      return res
        .status(404)
        .json({ error: "Flashcard file not found in storage" });
    }

    // Download and parse the flashcard data
    const [flashcardDataBuffer] = await flashcardFile.download();
    const flashcardData = JSON.parse(flashcardDataBuffer.toString());

    res.status(200).json({
      ...flashcardData,
      documentTitle: docData.title || "Untitled Document",
    });
  } catch (error) {
    console.error("Error fetching flashcard set:", error);
    res.status(500).json({
      error: "Failed to fetch flashcard data",
      details: error.message,
    });
  }
});

app.post("/summary2", checkAuth, async (req, res) => {
  try {
    const { docId, startPage, endPage, lang } = req.body;
    const userEmail = req.user.email;

    // Document verification and text extraction (existing code remains the same until generating summary)
    const docRef = await db.collection("documents").doc(docId).get();
    if (!docRef.exists) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docData = docRef.data();
    if (docData.userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    const file = bucket.file(docData.storagePath);
    const [pdfBuffer] = await file.download();

    // Process text in chunks with content caching
    const chunks = [];
    for (let i = startPage; i <= endPage; i += MAX_PAGES_PER_CHUNK) {
      chunks.push({
        start: i,
        end: Math.min(i + MAX_PAGES_PER_CHUNK - 1, endPage),
      });
    }

    let allExtractedText = "";
    for (const chunk of chunks) {
      try {
        const chunkText = await processPdfPages(pdfBuffer, chunk.start, chunk.end, docId, userEmail);
        allExtractedText += chunkText + "\n\n";
      } catch (error) {
        console.error(`Error processing chunk ${chunk.start}-${chunk.end}:`, error);
        if (!allExtractedText) {
          throw new Error(`Failed to extract text from initial chunk: ${error.message}`);
        }
        break;
      }
    }

    if (!allExtractedText.trim()) {
      throw new Error("No text could be extracted from the specified pages");
    }

    // Generate summary using Together AI
    const promptMessage = `Create a concise but comprehensive summary of the following text. Focus on key points, main ideas, and important details. The summary content should be in ${lang} langugage.The summary should be well-structured and maintain logical flow: ${allExtractedText}`;

    const togetherResponse = await together.chat.completions.create({
      messages: [{ role: "user", content: promptMessage }],
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      max_tokens: 8000,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
    });

    const generatedSummary = togetherResponse.choices[0].message.content;

    // Function to split text into chunks of specified byte size
    function splitTextIntoChunks(text, maxBytes = 4800) { // Using 4800 to have some buffer
      const chunks = [];
      let currentChunk = "";
      
      // Split text into sentences (basic split at periods followed by space)
      const sentences = text.split('. ').map(s => s + '. ');
      
      for (const sentence of sentences) {
        // Check if adding next sentence exceeds byte limit
        if (Buffer.byteLength(currentChunk + sentence, 'utf8') > maxBytes) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            // If single sentence is too long, split it into words
            const words = sentence.split(' ');
            let wordChunk = "";
            for (const word of words) {
              if (Buffer.byteLength(wordChunk + " " + word, 'utf8') > maxBytes) {
                chunks.push(wordChunk.trim());
                wordChunk = word;
              } else {
                wordChunk += (wordChunk ? " " : "") + word;
              }
            }
            if (wordChunk) {
              currentChunk = wordChunk;
            }
          }
        } else {
          currentChunk += sentence;
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      
      return chunks;
    }

    // Split the summary into chunks
    const textChunks = splitTextIntoChunks(generatedSummary);

    // Generate audio for each chunk
    const audioChunks = await Promise.all(textChunks.map(async (chunk) => {
      const ttsRequest = {
        input: { text: chunk },
        voice: { languageCode: "en-IN", ssmlGender: "NEUTRAL" },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 0.9,
        },
      };

      try {
        const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
        return ttsResponse.audioContent;
      } catch (error) {
        console.error("Error generating audio for chunk:", error);
        throw error;
      }
    }));

    // Combine audio chunks
    const combinedAudio = Buffer.concat(audioChunks);
    const audioBase64 = combinedAudio.toString("base64");

    // Create a unique ID for the summary
    const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save summary data to storage
    const summaryData = {
      summaryId,
      text: generatedSummary,
      audio: audioBase64,
      pages: { start: startPage, end: endPage },
      createdAt: new Date().toISOString(),
      processedChunks: chunks,
    };

    const storagePath = `documents/${userEmail}/${docId}/summaries/${summaryId}.json`;
    const summaryFile = bucket.file(storagePath);

    await summaryFile.save(JSON.stringify(summaryData, null, 2), {
      metadata: {
        contentType: "application/json",
        metadata: {
          lastUpdated: new Date().toISOString()
        }
      },
      public: true,
    });

    // Update document in Firestore
    await db.collection("documents").doc(docId).update({
      summaries: firebaseAdmin.firestore.FieldValue.arrayUnion({
        summaryId,
        pages: { start: startPage, end: endPage },
        createdAt: firebaseAdmin.firestore.Timestamp.now(),
        processedChunks: chunks,
      }),
    });

    // Send response
    res.status(200).json({
      success: true,
      summaryId,
      responseText: {
        output: {
          text: generatedSummary,
        },
      },
      audio: audioBase64,
      pages: { start: startPage, end: endPage },
      processedChunks: chunks,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({
      error: "Failed to generate summary",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});
const extractAndValidateJSON = (text, questionType = "mcq") => {
  try {
    // Find the JSON array in the response
    const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    // Extract and parse just the JSON array portion
    const jsonText = jsonMatch[0];
    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) {
      throw new Error("Parsed content is not an array");
    }

    return parsed.map((q, index) => {
      if (!q.question || !q.explanation) {
        throw new Error(
          `Invalid question format at index ${index}. Questions must include question text and explanation`
        );
      }

      switch (questionType) {
        case "mcq":
          if (
            !q.options ||
            !q.options.A ||
            !q.options.B ||
            !q.options.C ||
            !q.options.D
          ) {
            throw new Error(`Invalid MCQ options at index ${index}`);
          }
          if (
            !Array.isArray(q.correct) ||
            q.correct.length === 0 ||
            q.correct.length > 4
          ) {
            throw new Error(
              `Invalid MCQ answers at index ${index}. Must be an array of 1-4 options`
            );
          }
          if (!q.correct.every((ans) => ["A", "B", "C", "D"].includes(ans))) {
            throw new Error(`Invalid MCQ answer values at index ${index}`);
          }
          // Validate additional fields
          if (
            !q.difficulty ||
            !["easy", "medium", "hard"].includes(q.difficulty)
          ) {
            q.difficulty = "medium"; // Default if not provided
          }
          if (!Array.isArray(q.skills)) {
            q.skills = ["comprehension"]; // Default if not provided
          }
          if (!q.conceptualArea) {
            q.conceptualArea = "General"; // Default if not provided
          }
          break;

        case "scq":
          if (!q.options || !q.options.A || !q.options.B || !q.options.C || !q.options.D) {
            throw new Error(`Invalid SCQ options at index ${index}`);
          }
          if (!["A", "B", "C", "D"].includes(q.correct)) {
            throw new Error(`Invalid SCQ answer at index ${index}`);
          }
          break;

        case "truefalse":
          if (typeof q.correct !== "boolean") {
            throw new Error(`Invalid true/false answer at index ${index}`);
          }
          break;

        case "fillinblanks":
          if (typeof q.correct !== "string" || !q.correct.trim()) {
            throw new Error(
              `Invalid fill-in-the-blank answer at index ${index}`
            );
          }
          if (!q.question.includes("_____")) {
            throw new Error(
              `Fill-in-the-blank question must contain blank space (_____) at index ${index}`
            );
          }
          break;

        default:
          throw new Error(`Unsupported question type: ${questionType}`);
      }

      return {
        ...q,
        type: questionType,
      };
    });
  } catch (error) {
    throw new Error(`JSON parsing failed: ${error.message}`);
  }
};
app.get("/get-summary/:docId/:summaryId", checkAuth, async (req, res) => {
  try {
    const { docId, summaryId } = req.params;
    const userEmail = req.user.email;

    // Get document from Firestore
    const docRef = await db.collection("documents").doc(docId).get();
    if (!docRef.exists) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docData = docRef.data();
    if (docData.userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get summary data from storage
    const storagePath = `documents/${userEmail}/${docId}/summaries/${summaryId}.json`;
    const summaryFile = bucket.file(storagePath);

    const [exists] = await summaryFile.exists();
    if (!exists) {
      return res.status(404).json({ error: "Summary not found" });
    }

    const [summaryContent] = await summaryFile.download();
    const summaryData = JSON.parse(summaryContent.toString());

    res.status(200).json(summaryData);
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({
      error: "Failed to fetch summary",
      details: error.message,
    });
  }
});

app.get("/get-summaries/:docId", checkAuth, async (req, res) => {
  try {
    const docId = req.params.docId;
    const userEmail = req.user.email;

    // Get document from Firestore
    const docRef = await db.collection("documents").doc(docId).get();

    if (!docRef.exists) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docData = docRef.data();

    // Check if user has access to this document
    if (docData.userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    // If document has no summaries, return empty array
    if (!docData.summaries || !docData.summaries.length) {
      return res.status(200).json({ summaries: [] });
    }

    // Get all summaries from storage
    const summaries = await Promise.all(
      docData.summaries.map(async (summaryMeta) => {
        try {
          const storagePath = `documents/${userEmail}/${docId}/summaries/${summaryMeta.summaryId}.json`;
          const summaryFile = bucket.file(storagePath);

          const [exists] = await summaryFile.exists();
          if (!exists) {
            console.warn(`Summary file not found: ${storagePath}`);
            return null;
          }

          const [summaryContent] = await summaryFile.download();
          return JSON.parse(summaryContent.toString());
        } catch (error) {
          console.error(
            `Error fetching summary ${summaryMeta.summaryId}:`,
            error
          );
          return null;
        }
      })
    );

    // Filter out any failed summary fetches
    const validSummaries = summaries.filter((summary) => summary !== null);

    // Sort summaries by creation date (newest first)
    validSummaries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.status(200).json({
      summaries: validSummaries,
    });
  } catch (error) {
    console.error("Error fetching summaries:", error);
    res.status(500).json({
      error: "Failed to fetch summaries",
      details: error.message,
    });
  }
});

// Optional: Add route for detailed user analysis
app.get("/api/admin/users/analysis", async (req, res) => {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    const analysis = {
      colorIdDistribution: {},
      objDetDistribution: {},
      ocrDistribution: {},
      usbCamDistribution: {},
    };

    snapshot.forEach((doc) => {
      const userData = doc.data();

      // Analyze colorid distribution
      if (userData.coloridt) {
        analysis.colorIdDistribution[userData.coloridt] =
          (analysis.colorIdDistribution[userData.coloridt] || 0) + 1;
      }

      // Analyze object detection distribution
      if (userData.objdet) {
        analysis.objDetDistribution[userData.objdet] =
          (analysis.objDetDistribution[userData.objdet] || 0) + 1;
      }

      // Analyze OCR distribution
      if (userData.ocr) {
        analysis.ocrDistribution[userData.ocr] =
          (analysis.ocrDistribution[userData.ocr] || 0) + 1;
      }

      // Analyze USB camera distribution
      if (userData.usbcam) {
        analysis.usbCamDistribution[userData.usbcam] =
          (analysis.usbCamDistribution[userData.usbcam] || 0) + 1;
      }
    });

    res.json(analysis);
  } catch (error) {
    console.error("Error getting user analysis:", error);
    res.status(500).json({ error: "Failed to fetch user analysis" });
  }
});

app.get("/admin/organizations", async (req, res) => {
  try {
    const dashboardRef = db.collection("dashboard");
    const snapshot = await dashboardRef.get();

    const organizations = [];
    snapshot.forEach((doc) => {
      organizations.push({
        id: doc.id,
        name: doc.data().orgName,
      });
    });

    res.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).json({ error: "Failed to fetch organizations" });
  }
});

// Get statistics
app.get("/admin/stats", async (req, res) => {
  try {
    const usersRef = db.collection("users");
    const { orgId } = req.query;

    let query = usersRef;
    if (orgId) {
      query = query.where("orgId", "==", orgId);
    }

    const snapshot = await query.get();

    let stats = {
      totalUsers: 0,
      totalColorId: 0,
      totalEditDelete: 0,
      totalEmailUsers: 0,
      totalMobileUsers: 0,
      totalObjDetection: 0,
      totalOCR: 0,
      totalUsbCam: 0,
      totalCurrencyDetection: 0,
      usageStats: {
        ocrUsage: 0,
        currencyDetectionUsage: 0,
        objectDetectionUsage: 0,
        usbCameraUsage: 0,
      },
    };

    snapshot.forEach((doc) => {
      const userData = doc.data();

      // Increment total users
      stats.totalUsers++;

      // Count feature presence
      if (userData.coloridt) stats.totalColorId++;
      if (userData.curridt) stats.totalCurrencyDetection++;
      if (userData.email) stats.totalEmailUsers++;
      if (userData.mobile) stats.totalMobileUsers++;
      if (userData.objdet) stats.totalObjDetection++;
      if (userData.ocr) stats.totalOCR++;
      if (userData.usbcam) stats.totalUsbCam++;

      // Sum up total usage
      stats.usageStats.ocrUsage += Number(userData.ocr) || 0;
      stats.usageStats.currencyDetectionUsage += Number(userData.curridt) || 0;
      stats.usageStats.objectDetectionUsage += Number(userData.objdet) || 0;
      stats.usageStats.usbCameraUsage += Number(userData.usbcam) || 0;
    });

    res.json(stats);
  } catch (error) {
    console.error("Error getting statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get users list
app.get("/admin/users", async (req, res) => {
  try {
    const usersRef = db.collection("users");
    const { orgId } = req.query;

    let query = usersRef;
    if (orgId) {
      query = query.where("orgId", "==", orgId);
    }

    const snapshot = await query.get();
    const users = [];

    snapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        fName: userData.fName,
        email: userData.email,
        mobile: userData.mobile,
        ocr: userData.ocr,
        curridt: userData.curridt,
        objdet: userData.objdet,
        usbcam: userData.usbcam,
        orgId: userData.orgId,
      });
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/org/login", async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verify the ID token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).send("Unauthorized");
    }

    // Get user's email from decoded token
    const userEmail = decodedToken.email;

    // Check if this email exists in dashboard collection as orgEmail
    const db = firebaseAdmin.firestore();
    const dashboardRef = db.collection("dashboard");
    const orgSnapshot = await dashboardRef
      .where("orgEmail", "==", userEmail)
      .get();

    if (orgSnapshot.empty) {
      return res.status(401).json({
        message: "Not authorized as an organization admin",
      });
    }

    // If organization exists, create session
    const expiresIn = 604800000; // 1 week in milliseconds
    const sessionCookie = await firebaseAdmin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // Set session cookie
    res.cookie("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Get organization details
    const orgDoc = orgSnapshot.docs[0];
    const orgData = orgDoc.data();

    // Respond with success and organization info
    res.status(200).json({
      message: "Login successful",
      email: userEmail,
      orgId: orgDoc.id,
      orgName: orgData.orgName,
    });
  } catch (error) {
    console.error("Organization login error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Optional: Add middleware to verify org session for protected routes
const verifyOrgSession = async (req, res, next) => {
  const sessionCookie = req.cookies.session;

  if (!sessionCookie) {
    return res.status(401).json({ message: "No session found" });
  }

  try {
    const decodedClaims = await firebaseAdmin
      .auth()
      .verifySessionCookie(sessionCookie, true);
    const userEmail = decodedClaims.email;

    // Verify user is still an org admin
    const db = firebaseAdmin.firestore();
    const orgSnapshot = await db
      .collection("dashboard")
      .where("orgEmail", "==", userEmail)
      .get();

    if (orgSnapshot.empty) {
      return res
        .status(401)
        .json({ message: "Not authorized as organization admin" });
    }

    req.orgId = orgSnapshot.docs[0].id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid session" });
  }
};

// Example of protected route using the middleware
app.get("/org/protected", verifyOrgSession, (req, res) => {
  res.json({ message: "Access granted to protected route", orgId: req.orgId });
});

admin = firebaseAdmin;

// Get organization stats
app.get("/org/stats", verifyOrgSession, async (req, res) => {
  try {
    const { orgId } = req.query;
    const db = admin.firestore();

    // Get org details
    const orgDoc = await db.collection("dashboard").doc(orgId).get();
    if (!orgDoc.exists) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Get users for this organization
    const usersSnapshot = await db
      .collection("users")
      .where("orgId", "==", orgId)
      .get();

    const stats = {
      totalOCR: { count: 0, users: 0 },
      totalAskJyoti: { count: 0, users: 0 },
      totalDescribe: { count: 0, users: 0 },
      totalColor: { count: 0, users: 0 },
      totalSummary: { count: 0, users: 0 },
      totalDocument: { count: 0, users: 0 },
      totalUsbCam: { count: 0, users: 0 },
    };

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();

      // OCR
      if (userData.ocr) {
        stats.totalOCR.count += Number(userData.ocr);
        stats.totalOCR.users++;
      }

      // Ask Jyoti
      if (userData.askJyoti) {
        stats.totalAskJyoti.count += Number(userData.askJyoti);
        stats.totalAskJyoti.users++;
      }

      // Describe
      if (userData.describe) {
        stats.totalDescribe.count += Number(userData.describe);
        stats.totalDescribe.users++;
      }

      // Color
      if (userData.color) {
        stats.totalColor.count += Number(userData.color);
        stats.totalColor.users++;
      }

      // Summary
      if (userData.summary) {
        stats.totalSummary.count += Number(userData.summary);
        stats.totalSummary.users++;
      }

      // Document Read
      if (userData.documentRead) {
        stats.totalDocument.count += Number(userData.documentRead);
        stats.totalDocument.users++;
      }

      // USB Camera
      if (userData.usbcam) {
        stats.totalUsbCam.count += Number(userData.usbcam);
        stats.totalUsbCam.users++;
      }
    });

    res.json({
      orgName: orgDoc.data().orgName,
      stats,
    });
  } catch (error) {
    console.error("Error getting organization stats:", error);
    res.status(500).json({ error: "Failed to fetch organization stats" });
  }
});

// Get organization users
app.get("/org/users", verifyOrgSession, async (req, res) => {
  try {
    const { orgId } = req.query;
    const db = admin.firestore();

    const usersSnapshot = await db
      .collection("users")
      .where("orgId", "==", orgId)
      .get();

    const users = usersSnapshot.docs.map((doc) => {
      const userData = doc.data();
      return {
        uid: doc.id,
        fName: userData.fName || "N/A",
        address: userData.address || "N/A",
        pincode: userData.pincode || "N/A",
        ocr: userData.ocr || "0",
        askJyoti: userData.askJyoti || "0",
        describe: userData.describe || "0",
        color: userData.color || "0",
        summary: userData.summary || "0",
        documentRead: userData.documentRead || "0",
        usbcam: userData.usbcam || "0",
      };
    });

    res.json(users);
  } catch (error) {
    console.error("Error getting organization users:", error);
    res.status(500).json({ error: "Failed to fetch organization users" });
  }
});


app.post("/start-ai-teacher", checkAuth, async (req, res) => {
  try {
    console.log("API Key:", process.env.GOOGLE_API_KEY);
    const { docId, startPage, endPage, lang } = req.body;
    const userEmail = req.user.email;

    console.log("Starting AI Teacher for document:", docId);

    // Verify document access
    const docRef = await db.collection("documents").doc(docId).get();
    
    if (!docRef.exists) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docData = docRef.data();
    if (docData.userId !== userEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    console.log("Downloading PDF from storage...");
    const file = bucket.file(docData.storagePath);
    const [pdfBuffer] = await file.download();

    // Process text in chunks using cached content
    const chunks = [];
    for (let i = startPage; i <= endPage; i += MAX_PAGES_PER_CHUNK) {
      chunks.push({
        start: i,
        end: Math.min(i + MAX_PAGES_PER_CHUNK - 1, endPage),
      });
    }

    let allExtractedText = "";
    for (const chunk of chunks) {
      try {
        console.log(`Processing chunk pages ${chunk.start}-${chunk.end}`);
        const chunkText = await processPdfPages(pdfBuffer, chunk.start, chunk.end, docId, userEmail);
        allExtractedText += chunkText + "\n\n";
      } catch (error) {
        console.error(`Error processing chunk ${chunk.start}-${chunk.end}:`, error);
        if (!allExtractedText) {
          throw new Error(`Failed to extract text from initial chunk: ${error.message}`);
        }
        break;
      }
    }

    if (!allExtractedText.trim()) {
      throw new Error("No text could be extracted from the specified pages");
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      maxTokens: 12000 
    });

    // Create chat session with proper format
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{
            text: `You are an AI teacher. Here is the content to teach about:\n\n${allExtractedText}\n\nBe clear, informative, and engaging. Focus only on this content when answering questions and answer in ${lang} language. If asked about something outside this content, politely redirect to relevant parts of this material.`
          }]
        },
        {
          role: "model",
          parts: [{
            text: `I understand. I'll act as a teacher who will answer in ${lang} language and my answers will be focused on this content, providing clear explanations and engaging responses while staying within the scope of the material provided. How can I help you understand this content better?`
          }]
        }
      ]
    });

    // Generate session ID and store chat
    const sessionId = `teach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chatData = {
      sessionId,
      userId: userEmail,
      docId,
      pages: { start: startPage, end: endPage },
      startTime: firebaseAdmin.firestore.Timestamp.now(),
      status: 'active',
      processedChunks: chunks
    };

    // Store chat data in storage
    const storagePath = `documents/${userEmail}/${docId}/ai-teacher/${sessionId}.json`;
    const chatFile = bucket.file(storagePath);
    
    await chatFile.save(JSON.stringify({
      ...chatData,
      createdAt: new Date().toISOString()
    }, null, 2), {
      metadata: {
        contentType: "application/json",
        metadata: {
          lastUpdated: new Date().toISOString()
        }
      },
      public: true,
    });

    // Store session info in Firestore
    await db.collection('documents').doc(docId).update({
      aiTeacherSessions: firebaseAdmin.firestore.FieldValue.arrayUnion({
        ...chatData,
        url: `https://storage.googleapis.com/${bucket.name}/${storagePath}`
      })
    });

    // Store in memory
    activeChats.set(sessionId, {
      chat,
      ...chatData,
      context: allExtractedText
    });

    res.status(200).json({
      success: true,
      sessionId,
      message: "AI Teacher session started successfully",
      pages: { start: startPage, end: endPage },
      processedChunks: chunks
    });

  } catch (error) {
    console.error("Error starting AI Teacher:", error);
    res.status(500).json({
      error: "Failed to start AI Teacher session",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});
  
  app.post("/chat-ai-teacher", checkAuth, async (req, res) => {
    try {
      const { sessionId, message } = req.body;
      const userEmail = req.user.email;
  
      // Verify session exists and belongs to user
      const session = activeChats.get(sessionId);
      if (!session || session.userId !== userEmail) {
        return res.status(403).json({ error: "Invalid session" });
      }
  
      console.log("Sending message to AI:", message);
  
      // Send message to Gemini with proper format
      const result = await session.chat.sendMessage(message);
      const response = await result.response;
      const responseText = response.text();
      
      console.log("AI Response:", responseText);
  
      // Create message data
      const messageData = {
        timestamp: firebaseAdmin.firestore.Timestamp.now(),
        message,
        response: responseText,
        sessionId
      };
  
      // Store in Firestore
      await db.collection('documents').doc(session.docId).update({
        aiTeacherMessages: firebaseAdmin.firestore.FieldValue.arrayUnion(messageData)
      });
  
      res.status(200).json({
        success: true,
        response: responseText
      });
  
    } catch (error) {
      console.error("Error in AI Teacher chat:", error);
      res.status(500).json({
        error: "Failed to process message",
        details: error.message
      });
    }
  });
  
  app.post("/end-ai-teacher", checkAuth, async (req, res) => {
    try {
      const { sessionId } = req.body;
      const userEmail = req.user.email;
  
      // Verify session exists and belongs to user
      const session = activeChats.get(sessionId);
      if (!session || session.userId !== userEmail) {
        return res.status(403).json({ error: "Invalid session" });
      }
  
      // Update session status in Firestore
      const docRef = db.collection('documents').doc(session.docId);
      const doc = await docRef.get();
      const sessions = doc.data().aiTeacherSessions || [];
  
      const updatedSessions = sessions.map(s => {
        if (s.sessionId === sessionId) {
          return {
            ...s,
            endTime: firebaseAdmin.firestore.Timestamp.now(),
            status: 'completed'
          };
        }
        return s;
      });
  
      await docRef.update({
        aiTeacherSessions: updatedSessions
      });
  
      // Clean up memory
      activeChats.delete(sessionId);
  
      res.status(200).json({
        success: true,
        message: "AI Teacher session ended successfully"
      });
  
    } catch (error) {
      console.error("Error ending AI Teacher session:", error);
      res.status(500).json({
        error: "Failed to end session",
        details: error.message
      });
    }
  });
  

// Simplified endpoint to save quiz response
app.post("/save-quiz-response/:docId/:quizId", checkAuth, async (req, res) => {
  try {
    const { docId, quizId } = req.params;
    const userEmail = req.user.email;
    const { responses, score, totalQuestions } = req.body;

    // Create a unique response ID
    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare response data
    const responseData = {
      responseId,
      quizId,
      docId,
      userEmail,
      responses,
      score,
      totalQuestions,
      submittedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
    };

    // Save to quiz_responses collection
    await db.collection("quiz_responses").doc(responseId).set(responseData);

    res.status(200).json({
      success: true,
      responseId,
      message: "Quiz response saved successfully"
    });

  } catch (error) {
    console.error("Error saving quiz response:", error);
    res.status(500).json({
      error: "Failed to save quiz response",
      details: error.message
    });
  }
});

// Simplified endpoint to get quiz responses
app.get("/quiz-responses/:docId/:quizId", checkAuth, async (req, res) => {
  try {
    const { docId, quizId } = req.params;
    const userEmail = req.user.email;

    // Simple query without complex ordering
    const responsesSnapshot = await db.collection("quiz_responses")
      .where("docId", "==", docId)
      .where("quizId", "==", quizId)
      .where("userEmail", "==", userEmail)
      .get();

    const responses = [];
    responsesSnapshot.forEach(doc => {
      responses.push({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate()
      });
    });

    // Sort responses by submittedAt in memory
    responses.sort((a, b) => b.submittedAt - a.submittedAt);

    res.status(200).json({ responses });

  } catch (error) {
    console.error("Error fetching quiz responses:", error);
    res.status(500).json({
      error: "Failed to fetch quiz responses",
      details: error.message
    });
  }
});

app.post("/schoolLogin", async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify the ID token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    if (!decodedToken) {
      return res.status(401).send("Unauthorized");
    }

    const email = decodedToken.email;

    // Query Firestore to find the school
    const schoolsRef = db.collection('schools');
    const schoolSnapshot = await schoolsRef.where('email', '==', email).get();

    if (schoolSnapshot.empty) {
      return res.status(401).json({ error: "School not found" });
    }

    const schoolDoc = schoolSnapshot.docs[0];
    const schoolData = schoolDoc.data();

    // Create session cookie with school-specific claims
    const expiresIn = 604800000; // 1 week
    const sessionCookie = await firebaseAdmin.auth().createSessionCookie(idToken, { 
      expiresIn,
    });
    
    // Only set schoolSession cookie, remove the session cookie
    res.cookie("schoolSession", sessionCookie, { 
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Clear any existing session cookie to avoid confusion
    res.clearCookie("session");

    // Return success with school info
    res.status(200).json({
      message: "Login successful",
      email: email,
      schoolId: schoolDoc.id,
      schoolName: schoolData.name,
      role: 'school'
    });

  } catch (error) {
    console.error("School login error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
});
// School authentication middleware
const verifySchoolSession = async (req, res, next) => {
  const sessionCookie = req.cookies.schoolSession; 
  
  if (!sessionCookie) {
    return res.status(401).json({ error: "No school session" });
  }

  try {
    const decodedClaims = await firebaseAdmin.auth().verifySessionCookie(sessionCookie, true);
    const schoolDoc = await db.collection('schools').doc(decodedClaims.schoolId).get();
    
    if (!schoolDoc.exists) {
      throw new Error('School not found');
    }

    req.school = {
      id: schoolDoc.id,
      ...schoolDoc.data()
    };
    next();
  } catch (error) {
    console.error("Session verification error:", error);
    res.status(401).json({ error: "Invalid school session" });
  }
};
// Student authentication middleware
const verifyStudentSession = async (req, res, next) => {
  const sessionCookie = req.cookies.session;
  
  if (!sessionCookie) {
    return res.status(401).json({ error: "No student session" });
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    const studentDoc = await db.collection('schools')
      .doc(decodedClaims.schoolId)
      .collection('students')
      .doc(decodedClaims.uid)
      .get();
    
    if (!studentDoc.exists) {
      throw new Error('Student not found');
    }

    req.student = {
      id: studentDoc.id,
      schoolId: decodedClaims.schoolId,
      ...studentDoc.data()
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid student session" });
  }
};

// Student login endpoint
app.post("/student/login", verifySchoolSession, async (req, res) => {
  try {
    const { idToken, schoolId } = req.body;
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if student exists in the school's students collection
    const studentDoc = await db.collection('schools')
      .doc(schoolId)
      .collection('students')
      .doc(decodedToken.uid)
      .get();

    if (!studentDoc.exists) {
      return res.status(401).json({ error: "Student not found in this school" });
    }

    // Create session cookie with student and school info
    const expiresIn = 604800000; // 1 week
    const sessionCookie = await admin.auth().createSessionCookie(idToken, {
      expiresIn,
      schoolId: schoolId,
      role: 'student'
    });

    // Set student session cookie
    res.cookie("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      message: "Login successful",
      student: {
        id: studentDoc.id,
        ...studentDoc.data()
      }
    });
  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Student signup endpoint
app.post("/student/signup", async (req, res) => {
  try {
    const { idToken, schoolId, name, email, grade } = req.body;
    
    // Verify the ID token first
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Validate required fields
    if (!name || !email || !grade) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate grade
    if (grade < 3 || grade > 12) {
      return res.status(400).json({ error: "Invalid grade" });
    }

    // Check if school exists
    const schoolDoc = await db.collection('schools').doc(schoolId).get();
    if (!schoolDoc.exists) {
      return res.status(404).json({ error: "School not found" });
    }

    // Check if student already exists
    const existingStudent = await db
      .collection('schools')
      .doc(schoolId)
      .collection('students')
      .doc(decodedToken.uid)
      .get();

    if (existingStudent.exists) {
      return res.status(400).json({ error: "Student already registered" });
    }

    // Create student profile
    await db.collection('schools')
      .doc(schoolId)
      .collection('students')
      .doc(decodedToken.uid)
      .set({
        name,
        email,
        grade,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      });

    // Create session cookie
    const expiresIn = 604800000; // 1 week
    const sessionCookie = await firebaseAdmin.auth().createSessionCookie(idToken, {
      expiresIn,
      schoolId: schoolId,
      role: 'student'
    });

    // Set student session cookie
    res.cookie("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      message: "Student account created successfully",
      student: {
        id: decodedToken.uid,
        name,
        email,
        grade
      }
    });

  } catch (error) {
    console.error("Student signup error:", error);
    res.status(500).json({ 
      error: "Failed to create student account",
      details: error.message 
    });
  }
});
// School me endpoint
app.get("/school/me", verifySchoolSession, (req, res) => {
  res.status(200).json({
    schoolId: req.school.id,
    schoolName: req.school.name,
    email: req.school.email
  });
});

// Student me endpoint
app.get("/student/me", verifyStudentSession, (req, res) => {
  res.status(200).json({
    studentId: req.student.id,
    schoolId: req.student.schoolId,
    name: req.student.name,
    email: req.student.email
  });
});

// School logout endpoint
app.post("/school/logout", verifySchoolSession, (req, res) => {
  res.clearCookie("schoolSession");
  res.clearCookie("studentSession"); // Also clear student session if exists
  res.status(200).json({ message: "School logged out successfully" });
});

// Student logout endpoint
app.post("/student/logout", verifyStudentSession, (req, res) => {
  res.clearCookie("studentSession");
  res.status(200).json({ message: "Student logged out successfully" });
});
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
