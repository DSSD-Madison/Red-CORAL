import React, { useState } from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import Map from 'components/Map';
import 'leaflet/dist/leaflet.css';
import { Incident, Category, Type, DB } from 'types';
import { dummyData } from 'dummyData';

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
    const [isClicked, setIsClicked] = useState<boolean>(false);

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

    const handleClick = () => {
        setIsClicked(true);
    };

    function Home() {
        return (
            <div className="relative h-full">
                <Map apiKey={stadiaAPIKey} data={data} />
            </div>
        );
    }

    function Admin() {
        return (
            <div style={{ padding: 20 }}>
                <h2>About View</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adip.</p>
                <button onClick={handleClick}>Click me</button>
                {isClicked && <p>Button clicked!</p>}
            </div>
        );
    }

    function SignupForm() {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');

        const handleSignin = async (e: React.FormEvent) => {
            e.preventDefault();

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log('User signed in:', userCredential.user);
                alert('User signed in successfully!');
                // Redirect or show success message
            } catch (error) {
                console.error('Error signing in:', error.message);
                alert(`Error signing in: ${error.message}`);
            }
        };

        return (
            <form onSubmit={handleSignin}>
                <label>
                    Email:
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label>
                    Password:
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
                <button type="submit">Sign In</button>
            </form>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/signup" element={<SignupForm />} />
            </Routes>
        </Router>
    );
};

export default App;
