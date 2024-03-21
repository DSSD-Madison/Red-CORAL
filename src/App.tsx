import React, { useState } from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import Map from 'components/Map';
import 'leaflet/dist/leaflet.css';
import { Incident, Category, Type, DB } from 'types';
import { dummyData } from 'dummyData';
import Admin from "./components/Admin";

const App: React.FC = () => {
    const app = initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    });

    const auth = getAuth(app);

    // init firestore, storage

    const stadiaAPIKey = import.meta.env.VITE_STADIA_KEY;
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // State variable for sign-in status

    const handleSignInSuccess = () => {
        setIsLoggedIn(true); // Update the sign-in status to true
    };
    const [data, setData] = useState<DB>({
        Categories: {},
        Types: {},
        Incidents: {},
    });

    useEffect(() => {
        new Promise<DB>((resolve, reject) => {
            // Storage Query (user) or Firestore Query (admin)
            resolve(dummyData);
        })
            .then(setData)
            .catch((error) => {
                console.error(error);
            });
    }, []);

    function Home() {
        return (
            <div className="relative h-full">
                <Map apiKey={stadiaAPIKey} data={data} />
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<Admin auth={auth} onSignInSuccess={handleSignInSuccess} />} />
            </Routes>
        </Router>
    );
};

export default App;
