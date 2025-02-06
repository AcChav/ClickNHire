const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
});

// Replace with the actual UID of the user you want to assign the role to
const uid = 'LJ4ZWkyBLPQZrKb8qcpuceKNCSF2'; // Replace with your user's UID

admin.auth().setCustomUserClaims(uid, { role: 'hr' })
  .then(() => {
    console.log(`Custom claims set for user: ${uid}`);
  })
  .catch(error => {
    console.error('Error setting custom claims:', error);
  });
