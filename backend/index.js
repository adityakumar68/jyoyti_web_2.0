const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const firebaseAdmin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const detectText = require('./textDetection'); 

require('dotenv').config();

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!serviceAccountBase64) {
  throw new Error('Missing Firebase service account base64 string in environment variables.');
}

if (!databaseURL) {
  throw new Error('Missing Firebase database URL in environment variables.');
}

// Decode the base64 string to get the JSON string
const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');

// Parse the JSON string to get the service account object
const serviceAccount = JSON.parse(serviceAccountJson);

// Initialize Firebase Admin SDK
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: databaseURL
});
const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const port = 3100;
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));



const checkAuth = async (req, res, next) => {
  
  const sessionCookie = req.cookies.session || '';

  firebaseAdmin.auth()
    .verifySessionCookie(sessionCookie, true )
    .then((decodedClaims) => {
      req.user = decodedClaims;
      next()
    })

    .catch((error) => {
      res.status(401).send('Unauthorized');
    });
};


// Handle login using ID token
app.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    // Verify the ID token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    if (decodedToken){
    
      const expiresIn = 604800000; // 1 week in milliseconds
      const sessionCookie = await firebaseAdmin.auth().createSessionCookie(idToken, { expiresIn });
      res.cookie('session', sessionCookie, { maxAge: expiresIn});
      // Respond with success
      res.status(200).send('Login successful');
    }
    else{
      res.status(401).send('Unauthorized');
    }

    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Internal server error');
  }
});



// Protected route
app.get('/me', checkAuth, (req, res) => {
  res.status(200).send(`Welcome ${req.user.email}`);
});

app.get('/logout', checkAuth, (req, res) => {
  res.cookie('session', '');
  res.status(200).send(`Logout successful`);
});



app.post('/process-image', checkAuth, async (req, res) => {
  try {
    const { image } = req.body;
    
    // Call the internal text detection function
    const base64Data = image.replace(/^data:image\/png;base64,/, "");

    // Define the path to save the image in the current directory
    const filePath = path.join(process.cwd(), 'captured-image.png');

     // Write the image to the filesystem and wait for it to complete
     await fs.promises.writeFile(filePath, base64Data, 'base64');

     // Read the image file and convert it back to base64 for the detectText function
     const imageBuffer = await fs.promises.readFile(filePath);
     const imageBase64 = imageBuffer.toString('base64');
 
     // Call the internal text detection function
     const detectedText = await detectText(imageBase64);
     console.log(detectedText);
    res.status(200).json({
      message: 'Image processed successfully',
      text: detectedText,
    });
  } catch (apiError) {
    console.error(apiError);
    res.status(500).json({ error: 'Failed to detect text from image' });
  }
});
   
  


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
