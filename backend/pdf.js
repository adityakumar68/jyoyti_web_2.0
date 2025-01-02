const { fromPath } = require("pdf2pic");
const path = require("path");

/**
 * Convert all pages of a PDF to images
 * @param {string} pdfPath - Path to the PDF file
 */
async function convertPdfToImages(pdfPath) {
    const outputDir = path.join(process.cwd(), "output_images");
    const converter = fromPath(pdfPath, {
        density: 300, // DPI
        saveFilename: "page",
        savePath: outputDir,
        format: "jpeg", // Output format: jpeg, png, etc.
        width: 1920, // Image width (optional)
        height: 1080, // Image height (optional)
    });

    try {
        const totalPages = await converter.bulk(-1); // -1 processes all pages
        console.log(`PDF converted successfully! Images saved in ${outputDir}`);
        console.log(`Pages converted: ${totalPages.length}`);
    } catch (err) {
        console.error("Error converting PDF:", err);
    }
}

// Example usage:
const pdfFilePath = "/home/aditya/intern/jyoti_web (copy)/backend/sample.pdf";
convertPdfToImages(pdfFilePath);


//backend 

const ttsClient = new textToSpeech.TextToSpeechClient({
    keyFilename:
      "/home/ubuntu/jyoti_new/jyoti_web_aws/backend/positive-leaf-427611-h7-1426bbecb44e.json", // Replace with the path to your service account file
  });


  app.use(
    cors({
      origin: "https://jyoti-ai.com",
      credentials: true,
    })
  );
  