import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import firebaseConfig from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let sortByField = 'dateArrivedAZ';
let currentPage = 1;
const itemsPerPage = 50;

onAuthStateChanged(auth, (user) => {
    if (user) {
    // User is signed in.
    displayEntries(currentPage, itemsPerPage);
    //displayEntries(); // Call the function to display entries
    } else {
    // No user is signed in.
    // Redirect to the login page or handle authentication as needed
    window.location.href = "index.html";
    }
});

// Define a global variable to hold all entries
let allEntries = [];


// Function to fetch and store all entries
async function fetchAllEntries() {
    try {
    const querySnapshot = await getDocs(collection(db, 'CustomerCollection'));
    allEntries = [];
    querySnapshot.forEach((doc) => {
        allEntries.push({ id: doc.id, ...doc.data() });
    });
    displayEntries(currentPage, itemsPerPage);
    } catch (error) {
    console.error('Error fetching entries:', error.message);
    }
}

// Call fetchAllEntries when the page loads
window.addEventListener('DOMContentLoaded', () => {
    fetchAllEntries(); // Fetch and store all entries
});

function performSearch() {
    const searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();

    if (searchQuery === '') {
    // If the search bar is empty, display entries based on current sorting method
    displayEntries(currentPage, itemsPerPage);
    return;
    }

    const filteredEntries = allEntries.filter((entry) => {
    const name = entry.firstandlast.toLowerCase();
    const description = entry.description.toLowerCase();

    return name.includes(searchQuery) || description.includes(searchQuery);
    });

    // Clear the current list and display the filtered entries
    const entryList = document.getElementById('entryList');
    entryList.innerHTML = '';

    filteredEntries.forEach((entry) => {
    const dateArrived = entry.date ? formatDate(entry.date.toDate()) : ''; // Format timestamp
    const name = entry.firstandlast || '';
    const description = entry.description || '';
    const color = entry.color || '';

    const listItem = document.createElement('li');
    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('details-container');
    listItem.appendChild(detailsContainer);

    // Create spans with classes for each detail
    const dateSpan = document.createElement('span');
    dateSpan.textContent = `Date Arrived: ${dateArrived}`;
    dateSpan.classList.add('list-date');
    detailsContainer.appendChild(dateSpan);

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `Name: ${name}`;
    nameSpan.classList.add('list-name');
    detailsContainer.appendChild(nameSpan);

    const descSpan = document.createElement('span');
    descSpan.textContent = `Description: ${description}`;
    descSpan.classList.add('list-description');
    detailsContainer.appendChild(descSpan);

    const colorSpan = document.createElement('span');
    colorSpan.textContent = `Color: ${color}`;
    colorSpan.classList.add('list-color');
    detailsContainer.appendChild(colorSpan);

    // Add click functionality
    listItem.classList.add('clickable');
    listItem.addEventListener('click', () => {
        editEntry(entry.id);
    });

    entryList.appendChild(listItem);
    });
}

// Display entries and handle sorting
async function displayEntries(page = 1, itemsPerPage = 50) {
    const entryList = document.getElementById('entryList');
    entryList.innerHTML = ''; // Clear previous list items

    try {
        const querySnapshot = await getDocs(collection(db, 'CustomerCollection'));
        const entries = [];
        querySnapshot.forEach((doc) => {
            entries.push({ id: doc.id, ...doc.data() });
        });

        if (sortByField === 'dateArrivedAZ') {
            entries.sort((a, b) => {
            const fieldA = a.date ? b.date.toDate() : new Date(0);
            const fieldB = b.date ? a.date.toDate() : new Date(0);
            return fieldA - fieldB;
            });
        } else if (sortByField === 'dateArrivedZA') {
            entries.sort((a, b) => {
            const fieldA = a.date ? a.date.toDate() : new Date(0);
            const fieldB = b.date ? b.date.toDate() : new Date(0);
            return fieldA - fieldB;
            });
        } else if (sortByField === 'nameAZ') {
            entries.sort((a, b) => a.firstandlast.localeCompare(b.firstandlast));
        } else if (sortByField === 'nameZA') {
            entries.sort((a, b) => b.firstandlast.localeCompare(a.firstandlast));
        } else if (sortByField === 'description') {
            entries.sort((a, b) => a.description.localeCompare(b.description));
        } else if (sortByField === 'color') {
            entries.sort((a, b) => a.color.localeCompare(b.color));
        }

        const startIndex = (page - 1) * itemsPerPage;
        const paginatedEntries = entries.slice(startIndex, startIndex + itemsPerPage);

        // Create list items and append to the list paginatedEntries was changed from entries
        paginatedEntries.forEach((entry) => {
            const dateArrived = entry.date ? formatDate(entry.date.toDate()) : ''; // Format timestamp
            const name = entry.firstandlast || '';
            const description = entry.description || '';
            const color = entry.color || '';

            const listItem = document.createElement('li');
            const detailsContainer = document.createElement('div');
            detailsContainer.classList.add('details-container');
            listItem.appendChild(detailsContainer);

            // Create spans with classes for each detail
            const dateSpan = document.createElement('span');
            dateSpan.textContent = `Date Arrived: ${dateArrived}`;
            dateSpan.classList.add('list-date');
            detailsContainer.appendChild(dateSpan);

            const nameSpan = document.createElement('span');
            nameSpan.textContent = `Name: ${name}`;
            nameSpan.classList.add('list-name');
            detailsContainer.appendChild(nameSpan);

            const descSpan = document.createElement('span');
            descSpan.textContent = `Description: ${description}`;
            descSpan.classList.add('list-description');
            detailsContainer.appendChild(descSpan);

            const colorSpan = document.createElement('span');
            colorSpan.textContent = `Color: ${color}`;
            colorSpan.classList.add('list-color');
            detailsContainer.appendChild(colorSpan);

            // Edit only if the user is an employee
            const userRole = auth.currentUser.email.endsWith("@crminctc.com") ? "employee" : "customer";
            if (userRole === 'employee') {
                // Adding functionality so the user can click on the entry.
                listItem.classList.add('clickable'); // Add a class to style the cursor as a pointer
                listItem.addEventListener('click', () => {
                    editEntry(entry.id); // Call editEntry function when clicked
                });
            }

            entryList.appendChild(listItem);
        });
    } catch (error) {
    console.error('Error fetching entries:', error.message);
    }
}

document.getElementById('sortBy').addEventListener('change', (event) => {
    sortByField = event.target.value;
    displayEntries(currentPage, itemsPerPage);
});


// Function to format date
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month starts from 0
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}




function updatePaginationButtons() {
    document.getElementById('currentPage').textContent = `Page ${currentPage}`;
}

// Previous Page button
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayEntries(currentPage, itemsPerPage);
        updatePaginationButtons();
    }
});

// Next Page button
document.getElementById('nextPage').addEventListener('click', () => {
    const totalEntries = 1000; // Example total entries
    const totalPages = Math.ceil(totalEntries / itemsPerPage);

    if (currentPage < totalPages) {
        currentPage++;
        displayEntries(currentPage, itemsPerPage);
        updatePaginationButtons();
    }
});

// First Page button
document.getElementById('firstPage').addEventListener('click', () => {
    currentPage = 1;
    displayEntries(currentPage, itemsPerPage);
    updatePaginationButtons();
});

document.getElementById('prevPageTop').addEventListener('click', () => {
    if (currentPage > 1) {
    currentPage--;
    displayEntries(currentPage, itemsPerPage);
    updatePaginationButtons();
    }
});

document.getElementById('nextPageTop').addEventListener('click', () => {
    const totalEntries = 1000; // Example total entries
    const totalPages = Math.ceil(totalEntries / itemsPerPage);

    if (currentPage < totalPages) {
    currentPage++;
    displayEntries(currentPage, itemsPerPage);
    updatePaginationButtons();
    }
});

document.getElementById('firstPageTop').addEventListener('click', () => {
    currentPage = 1;
    displayEntries(currentPage, itemsPerPage);
    updatePaginationButtons();
});

// Event listener for the search input
document.getElementById('searchInput').addEventListener('input', performSearch);

// Call the function to display entries and update pagination when the page loads
window.addEventListener('DOMContentLoaded', () => {
    displayEntries(currentPage, itemsPerPage); // This is your function to display entries
    updatePaginationButtons(); // This is your function to update pagination buttons
    performSearch(); // Call the search function on page load
});

document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
});

function logout() {
    auth.signOut().then(() => {
      // Sign-out successful.
      window.location.href = "index.html"; // Redirect to login page or another page after logout
    }).catch((error) => {
      // An error happened.
      console.error('Error logging out:', error.message);
    });
}