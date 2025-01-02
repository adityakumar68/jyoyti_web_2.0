const admin = require("firebase-admin");
const xlsx = require("xlsx");
require("dotenv").config();

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!serviceAccountBase64) {
  throw new Error("Missing Firebase service account base64 string in environment variables.");
}

// Decode the base64 string to get the JSON string
const serviceAccountJson = Buffer.from(serviceAccountBase64, "base64").toString("utf8");
const serviceAccount = JSON.parse(serviceAccountJson);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

async function fetchAuthUsersAndExport() {
  try {
    let allUsers = [];
    let nextPageToken;

    do {
      // Fetch users in batches of 1000
      const listUsersResult = await auth.listUsers(1000, nextPageToken);

      listUsersResult.users.forEach((userRecord) => {
        const userData = {
          uid: userRecord.uid,
          email: userRecord.email || "N/A",
          phoneNumber: userRecord.phoneNumber || "N/A",
          createdAt: new Date(userRecord.metadata.creationTime).toISOString(),
          lastSignIn: userRecord.metadata.lastSignInTime
            ? new Date(userRecord.metadata.lastSignInTime).toISOString()
            : "N/A",
          emailVerified: userRecord.emailVerified,
          disabled: userRecord.disabled,
          provider: userRecord.providerData.map((provider) => provider.providerId).join(", "),
        };
        allUsers.push(userData);
      });

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log("Total users fetched:", allUsers.length);

    // Export users to Excel
    exportToExcel(allUsers, "firebase_auth_users.xlsx", "AuthUsers");

    console.log("Excel file generated: firebase_auth_users.xlsx");
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

function exportToExcel(data, fileName, sheetName) {
  if (data.length === 0) {
    console.log(`No data found. Skipping file generation.`);
    return;
  }

  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

  xlsx.writeFile(workbook, fileName);
}

// Run the script
fetchAuthUsersAndExport();
