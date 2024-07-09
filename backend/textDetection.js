// textDetection.js
const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient();

async function detectText(imageBase64) {
  try {
    // Decode the base64 image
    const content = Buffer.from(imageBase64, 'base64');
    
    // Prepare the image for Google Cloud Vision API
    const request = {
      image: { content },
    };

    // Perform text detection
    const [result] = await client.textDetection(request);
    const detections = result.textAnnotations;
    
    // Extract the full detected text (first element in textAnnotations)
    const fullText = detections.length > 0 ? detections[0].description : '';

    return fullText;
  } catch (error) {
    throw new Error(`Failed to detect text: ${error.message}`);
  }
}

module.exports = detectText;
