import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore, doc, updateDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // Import Timestamp separately
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import firebaseConfig from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);

const urlParams = new URLSearchParams(window.location.search);
const entryId = urlParams.get('id');

onAuthStateChanged(auth, (user) => {
  if(user){
    if ((auth.currentUser.email.endsWith("@crminctc.com") ? "employee" : "customer") == 'employee') {
        // User has employee access
        fetchEntryDetails(entryId); // Call the function to display entries
      }
  } else {
    // No user is signed in.
    // Redirect to the login page or handle authentication as needed
    window.location.href = "index.html";
  }
});

async function fetchEntryDetails(entryId) {
    try {
    const docRef = doc(db, 'CustomerCollection', entryId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const entryData = docSnap.data();
        document.getElementById('firstName').value = entryData.firstandlast || '';
        document.getElementById('phoneNum').value = entryData.phonenum || '';
        document.getElementById('dateArrived').value = entryData.date ? formatDate(entryData.date.toDate()) : '';
        document.getElementById('notes').value = entryData.notes || '';
        document.getElementById('description').value = entryData.description || '';
        document.getElementById('blast').checked = entryData.blast || false;
        document.getElementById('prime').checked = entryData.prime || false;
        document.getElementById('color').value = entryData.color || '';
        document.getElementById('status').value = entryData.status || '';
        const storedDate = entryData.date.toDate(); // Convert Firestore Timestamp to JavaScript Date
        const storedTime = `${storedDate.getHours().toString().padStart(2, '0')}:${storedDate.getMinutes().toString().padStart(2, '0')}`;
        document.getElementById('timeArrived').value = storedTime; // Populate the time input field
    } else {
        console.log('No such document!');
    }
    } catch (error) {
    console.error('Error fetching entry details:', error.message);
    }
}

async function deleteEntry() {
    try {
    const docRef = doc(db, 'CustomerCollection', entryId);
    await deleteDoc(docRef);
    // Redirect to list.html on successful deletion
    window.location.href = 'list.html';
    } catch (error) {
    console.error('Error deleting document: ', error);
    document.getElementById('deleteErrorText').style.display = 'block'; // Display error message for deletion
    }
}

document.getElementById('editForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    try {
    const docRef = doc(db, 'CustomerCollection', entryId);
    const blast = document.getElementById('blast').checked;
    const color = document.getElementById('color').value;
    const dateArrivedInput = document.getElementById('dateArrived').value;
    const timeArrivedInput = document.getElementById('timeArrived').value;
    const combinedDateTime = new Date(`${dateArrivedInput}T${timeArrivedInput}`);
    const dateArrived = Timestamp.fromDate(new Date(combinedDateTime));
    const description = document.getElementById('description').value;
    const firstAndLast = document.getElementById('firstName').value;
    const notes = document.getElementById('notes').value;
    const phoneNum = document.getElementById('phoneNum').value;
    const prime = document.getElementById('prime').checked;
    const status = document.getElementById('status').value;

    await updateDoc(docRef, {
        blast,
        color,
        date: dateArrived,
        description,
        firstandlast: firstAndLast,
        notes,
        phonenum: phoneNum,
        prime,
        status,
        appupdated: "true"
    });

    const fileList = document.getElementById('newImageInput').files;
    await uploadNewImages(docRef.id, fileList); // Pass the newly created document ID
    window.location.href = 'list.html';

    } catch (error) {
    console.error('Error updating document: ', error);
    document.getElementById('errorText').style.display = 'block';
    }
});

function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchAndDisplayImages(entryId) {
    const storageRef = ref(storage, entryId);
    const imageGrid = document.getElementById('imageGrid');
    imageGrid.innerHTML = ''; // Clear previous images

    try {
        const listResult = await listAll(storageRef);
        const items = listResult.items;

        for (let i = 0; i < items.length; i++) {
        const imageRef = items[i];
        const imageURL = await getDownloadURL(imageRef);

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        const img = document.createElement('img');
        img.src = imageURL;
        img.onclick = () => openFullScreen(imageURL);
        imageContainer.appendChild(img);

        imageGrid.appendChild(imageContainer);
        }
    } catch (error) {
        console.error('Error fetching images:', error);
    }
}



// Function to upload new images to Firebase Storage
async function uploadNewImages(entryId, fileList) {
    const storageRef = ref(storage, `${entryId}`);
    
    // Fetch existing image count
    const existingImages = await listAll(storageRef);
    const imageCount = existingImages.items.length;
    
    // Loop through each file in the fileList
    for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const imageName = `${imageCount + i}`; // Ensure a unique name
        
    // Create a reference to the image file in Firebase Storage
    const imageRef = ref(storageRef, imageName);
    
    // Upload the file to the specified Firebase Storage reference
    try {
        await uploadBytes(imageRef, file);
        console.log(`New Image ${i + 1} uploaded successfully.`);
    } catch (error) {
        console.error(`Error uploading new image ${i + 1}:`, error);
        // Handle errors here
    }
    }
}


async function deleteAllImages(entryId) {
    const storageRef = ref(storage, entryId);

    try {
        const listResult = await listAll(storageRef);
        const items = listResult.items;

        const deletePromises = items.map(async (item) => {
        await deleteObject(item);
        console.log('Image deleted:', item.name);
        });

        await Promise.all(deletePromises);
        console.log('All images deleted.');
        fetchAndDisplayImages(entryId); // Refresh the displayed images after deletion
    } catch (error) {
        console.error('Error deleting images:', error);
    }
}

document.getElementById('deleteBtn').addEventListener('click', deleteEntry);

// Fetch and display images when the window loads
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const entryId = urlParams.get('id');
    fetchAndDisplayImages(entryId);
});

function openFullScreen(imageURL) {
    const fullScreenWindow = window.open(imageURL, '_blank');
    if (fullScreenWindow) {
    fullScreenWindow.focus();
    } else {
    alert('Please allow pop-ups to view full-screen images.');
    }
}

document.getElementById('deleteAllBtn').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const entryId = urlParams.get('id');
    deleteAllImages(entryId);
});

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
  