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
const { createCanvas } = require('canvas');

const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

// Initialize the Google Speech client
const speechClient = new SpeechClient();

const upload = multer({ dest: "uploads/" });

require("dotenv").config();


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
      "/home/ubuntu/jyoti_new/jyoti_web_aws/backend/positive-leaf-427611-h7-1426bbecb44e.json", // Replace with the path to your service account file
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
  databaseURL: databaseURL,
});
const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const port = 3100;
app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
      origin: "https://jyoti-ai.com",
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
    if (decodedToken) {
      const expiresIn = 604800000; // 1 week in milliseconds
      const sessionCookie = await firebaseAdmin
        .auth()
        .createSessionCookie(idToken, { expiresIn });
      res.cookie("session", sessionCookie, { maxAge: expiresIn });
      // Respond with success
      res.status(200).send("Login successful");
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Internal server error");
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
    for (const chunk of textChunks) {
      const request = {
        input: { text: chunk },
        voice: { languageCode: "en-IN", ssmlGender: "NEUTRAL" },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 0.9,
        },
      };

      const [response] = await ttsClient.synthesizeSpeech(request);
      audioBuffers.push(response.audioContent);
    }

    // Concatenate audio buffers and save to file
    const combinedAudio = Buffer.concat(
      audioBuffers.map((buf) => Buffer.from(buf, "base64"))
    );
    const audioFilePath = path.join(process.cwd(), "output.mp3");
    await fs.promises.writeFile(audioFilePath, combinedAudio, "binary");

    const audioBase64 = combinedAudio.toString("base64");

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

async function convertPageToImage(page) {
  // Create a canvas with the page's dimensions
  const canvas = createCanvas(
    page.getWidth(), 
    page.getHeight()
  );
  const context = canvas.getContext('2d');

  // Render the PDF page to the canvas
  // Note: This might require additional rendering logic depending on pdf-lib's capabilities
  // You may need to use a rendering library like pdf.js for complex PDFs
  // Convert canvas to PNG buffer
  return canvas.toBuffer('image/png');
}
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

// Endpoint: Process PDF
app.post("/process-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    // Save PDF to temporary file
    const pdfBuffer = req.file.buffer;
    const tempPdfPath = path.join(process.cwd(), "temp.pdf");
    await fs.writeFile(tempPdfPath, pdfBuffer);

    // Upload PDF to Google Cloud Storage
    const bucketName = "your-gcs-bucket"; // Replace with your GCS bucket name
    const pdfGcsPath = `temp/${Date.now()}-uploaded.pdf`;
    await storage.bucket(bucketName).upload(tempPdfPath, {
      destination: pdfGcsPath,
    });

    // Vision OCR: Process the PDF
    const inputUri = `gs://${bucketName}/${pdfGcsPath}`;
    const outputUri = `gs://${bucketName}/vision-output/`;
    const request = {
      inputConfig: {
        mimeType: "application/pdf",
        gcsSource: { uri: inputUri },
      },
      outputConfig: {
        gcsDestination: { uri: outputUri },
      },
      features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
    };

    // Perform OCR
    const [operation] = await visionClient.asyncBatchAnnotateFiles([request]);
    console.log("Processing PDF with Vision OCR...");
    const [response] = await operation.promise();
    console.log("OCR completed.");

    // Download OCR results from GCS
    const outputBucket = storage.bucket(bucketName);
    const [files] = await outputBucket.getFiles({ prefix: "vision-output/" });

    const pageTexts = [];
    for (const file of files) {
      const [content] = await file.download();
      const ocrData = JSON.parse(content.toString());
      const pageText = ocrData.fullTextAnnotation.text || "";
      pageTexts.push(pageText);
    }

    // Generate audio and return results for each page
    const results = [];
    for (let i = 0; i < pageTexts.length; i++) {
      const pageText = pageTexts[i];
      const textChunks = splitText(pageText);
      const audioBuffers = [];

      // Generate audio for each chunk
      for (const chunk of textChunks) {
        const request = {
          input: { text: chunk },
          voice: { languageCode: "en-IN", ssmlGender: "NEUTRAL" },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.9,
          },
        };

        const [response] = await ttsClient.synthesizeSpeech(request);
        audioBuffers.push(response.audioContent);
      }

      // Save audio to file and base64 encode
      const audioFilePath = path.join(process.cwd(), `output-page-${i + 1}.mp3`);
      const audioBase64 = await saveAudioToFile(audioBuffers, audioFilePath);

      results.push({
        pageNumber: i + 1,
        text: pageText,
        audio: audioBase64,
      });
    }

    // Clean up temporary files
    await fs.unlink(tempPdfPath);
    await outputBucket.deleteFiles({ prefix: "vision-output/" });

    res.status(200).json({
      message: "PDF processed successfully",
      pages: results,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({ error: "Failed to process PDF and generate audio" });
  }
});


app.post("/process_question", upload.single("file"), async (req, res) => {
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
      max_tokens: 512,
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
      max_tokens: 400,
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
    targetLanguage2=targetLanguage
    let languageCode;
    switch (targetLanguage) {
      case 'Hindi':
        languageCode = 'hi-IN';
        break;
      case 'English':
        languageCode = 'en-IN';
        break;
      case 'Marathi':
        languageCode = 'mr-IN';
        break;
      case 'Assamese':
        languageCode = 'en-IN';
        break;
      case 'Bengali':
        languageCode = 'bn-IN';
        break;
      case 'Gujarati':
        languageCode = 'gu-IN';
        break;
      default:
        languageCode = 'en-IN';
     }

    if (!text || !targetLanguage2) {
      return res.status(500).json("Text and target language are required");
    }

    // Prepare the prompt for Together AI
    const promptMessage =`
        "${text}"
        Your task is to translate the given text in ${targetLanguage2} language. Please translate in the ${targetLanguage2}. Give only the translated text. It is very important to translate in ${targetLanguage2} only.
        `
    
    console.log(promptMessage)

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


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
