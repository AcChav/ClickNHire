const admin = require('firebase-admin');
const serviceAccount = require('./erecruitment-9846f-firebase-adminsdk-3kk0n-a63edc219a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"  // Replace with your actual Firebase project URL
});

// Replace with the actual UID of the user you want to set the client role for
const uid = 'UK6ORxW5TWPvWSXk9Qc4qZDH7y12';  // Replace this with the correct UID

// Check and set custom claims
admin.auth().getUser(uid)
  .then((userRecord) => {
    console.log('Existing custom claims:', userRecord.customClaims);

    // Check if the role is already set to 'client'
    if (userRecord.customClaims && userRecord.customClaims.role === 'hr') {
      console.log('User already has Client role');
    } else {
      // Set the Client role if not already set
      return admin.auth().setCustomUserClaims(uid, { role: 'hr' });
    }
  })
  .then(() => {
    console.log("Client role set or verified successfully");
  })
  .catch((error) => {
    console.error("Error:", error);
  });
