import {Routes, Route, useNavigate} from 'react-router-dom'
import React, { useEffect, useState } from "react";
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import StationsPage from './pages/StationsPage'
import "./index.css";
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getIdToken } from "firebase/auth";

function App() {
  const [currentUser, setCurrentUser] = useState(null); // Stores logged-in user object or null
  const [authLoading, setAuthLoading] = useState(true); // Tracks if Firebase is still checking auth state
  const navigate = useNavigate();

  // --- useEffect for Firebase Auth State Listener ---
  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed. User:", user ? user.uid : null);
      setCurrentUser(user);
      setAuthLoading(false);
    });

    // Redirect to home if logged in, otherwise go to login
    if (currentUser) {
     navigate("/home");
   } else {
     navigate("/");
   }
    // Cleanup
    return () => {
      console.log("Unsubscribing from auth state changes.");
      unsubscribe();
    };
  }, [currentUser]);

  // --- Handle Logout Function ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully via button.");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (authLoading) {
    return <div className="p-6 text-center">Checking auth status...</div>;
  }

  return (
    <div style = {{'marginTop': '56px'}}>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="home" element={<HomePage handleLogout={handleLogout}/>} />
        <Route path="stations" element={<StationsPage handleLogout={handleLogout}/>} />
      </Routes>
    </div>
  );
}

export default App;
