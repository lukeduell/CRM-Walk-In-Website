import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import firebaseConfig from './firebaseConfig.js';
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

//init firebase app
const app = initializeApp(firebaseConfig);

//get auth and firestore instances
const auth = getAuth(app);
const db = getFirestore(app);


document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // On successful login, redirect the user
    window.location.href = "list.html"; // Redirect to the list page after successful login
  } catch (error) {
    // Show error message for failed login
    document.getElementById('errorMessage').textContent = "Login failed. Please check your credentials.";
    document.getElementById('errorMessage').style.display = "block";
    console.error('Login failed:', error.message);
  }
});


document.getElementById('signupForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  const passwordMismatch = document.getElementById('passwordMismatch');
  const errorMessage = document.getElementById('errorMessage-signup');
  
  // Check if passwords match
  if (password !== confirmPassword) {
    passwordMismatch.style.display = 'block';
    errorMessage.style.display = 'none'
    return; // Prevent form submission if passwords don't match
  } else {
    passwordMismatch.style.display = 'none';
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password)
      .catch((error) => {
          console.error("Sign-up failed:", error);
      });

    // On successful sign-up, redirect the user
    window.location.href = "list.html"; // Redirect to the list page after successful sign-up
  } catch (error) {
    // Show error message for failed sign-up
    switch (error.code) {
      case 'auth/weak-password':
        errorMessage.textContent = 'Password should be at least 6 characters';
        break;
      case 'auth/email-already-in-use':
        errorMessage.textContent = 'Email is already in use';
        break;
      default:
        errorMessage.textContent = 'Sign-up failed. Please try again.';
        break;
    }
    errorMessage.style.display = 'block';
    console.error('Sign-up failed:', error.message);
  }
});

