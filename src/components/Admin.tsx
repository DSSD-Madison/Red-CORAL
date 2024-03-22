import React, { useState } from 'react';
import {Auth, signInWithEmailAndPassword} from 'firebase/auth'; // Import Auth type from firebase/auth

interface AdminProps {
    auth: Auth; // Declare auth prop of type Auth
    onSignInSuccess: () => void;
}

const Admin: React.FC<AdminProps> = ({ auth, onSignInSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('User signed in:', userCredential.user);
            alert('User signed in successfully!');
            onSignInSuccess(); // Call the callback function
        } catch (error) {
            console.error('Error signing in:', error.message);
            alert(`Error signing in: ${error.message}`);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Admin Sign In</h2>
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
        </div>
    );
};

export default Admin;
