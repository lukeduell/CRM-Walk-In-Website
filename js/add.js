import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // Import Timestamp separately
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import firebaseConfig from './firebaseConfig.js';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in.
    // Call the function to display entries
  } else {
    // No user is signed in.
    // Redirect to the login page or handle authentication as needed
    window.location.href = "index.html";
  }
});

// Function to handle form submission
document.getElementById('visitorForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  // Collect form input values...
  const firstAndLast = document.getElementById('firstName').value;
  const phoneNum = document.getElementById('phoneNum').value;
  const dateArrivedInput = document.getElementById('dateArrived').value;
  const timeArrivedInput = document.getElementById('timeArrived').value;
  const combinedDateTime = new Date(`${dateArrivedInput}T${timeArrivedInput}`);
  const dateArrived = Timestamp.fromDate(new Date(combinedDateTime));
  const notes = document.getElementById('notes').value;
  const description = document.getElementById('description').value;
  const blast = document.getElementById('blast').checked;
  const prime = document.getElementById('prime').checked;
  const color = document.getElementById('color').value;
  const status = document.getElementById('status').value;

  // Add data to Firebase Firestore in the "CustomerCollection" collection
  try {
    const docRef = await addDoc(collection(db, 'CustomerCollection'), {
      blast: blast,
      color: color,
      date: dateArrived,
      description: description,
      firstandlast: firstAndLast,
      notes: notes,
      phonenum: phoneNum,
      prime: prime,
      status: status,
      appmade: "true"
    });
    // Create a corresponding folder in Firebase Storage
    const storageRef = ref(storage, `${docRef.id}`);
    await uploadImages(storageRef); // Pass the storage reference

    console.log('Document written with ID: ', docRef.id);
    // Clear the form after successful submission
    document.getElementById('visitorForm').reset();
    window.location.href = 'list.html'; // Redirect to list page on success
  } catch (error) {
    console.error('Error adding document: ', error);
    document.getElementById('errorText').style.display = 'block'; // Display error message
  }
});

async function uploadImages(storageRef) {
  const fileInput = document.getElementById('fileInput');
  const fileList = fileInput.files;

  // Loop through each file in the fileList
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const imageName = `image_${i}`; // Change the naming convention as needed
    const imageRef = ref(storageRef, imageName);

    try {
      await uploadBytes(imageRef, file);
      console.log(`Image ${i + 1} uploaded successfully.`);
    } catch (error) {
      console.error(`Error uploading image ${i + 1}:`, error);
      // Handle errors here
    }
  }
}

// Function to generate and print the tag
function generateAndPrintTag() {
  // Gather input values from the form
  const firstName = document.getElementById('firstName').value;
  const lastName = ""; // Extract last name if provided separately
  const description = document.getElementById('description').value;
  const phoneNum = document.getElementById('phoneNum').value;
  const dateArrived = document.getElementById('dateArrived').value;
  const blast = document.getElementById('blast').checked ? "Blast" : "";
  const prime = document.getElementById('prime').checked ? "Prime" : "";
  const color = document.getElementById('color').value;

  // Create the content for the tag
  const tagContent = `
  <div style="width: 2.90in; height: 5.00in; padding: 10px; font-size: 19px;">
      <h2 style="text-align: center;">CRM Walkin Tag</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Phone Number:</strong> ${phoneNum}</p>
      <p><strong>Date Arrived:</strong> ${dateArrived}</p>
      <p><strong>Blast:</strong> ${blast ? 'Yes' : 'No'}</p>
      <p><strong>Prime:</strong> ${prime ? 'Yes' : 'No'}</p>
      <p><strong>Color:</strong> ${color}</p>
      <!-- Add more information as needed -->
  </div>
  `;

  // Create a new window with the tag content
  const printWindow = window.open('', '_blank');
  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>CRM Tag</title>
      </head>
      <body>
        ${tagContent}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 100); // Close window after 1 second (adjust timing as needed)
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Attach event listener to the print button
document.getElementById('printTagBtn').addEventListener('click', generateAndPrintTag);
