import React, { useState } from 'react';
import Login from '../components/auth/Login';
import SignUp from '../components/auth/SignUp';
import Logo from '../assets/transit_hub_logo.png'

function AuthPage() {
    const [showLogin, setShowLogin] = useState(true);

    const switchToSignUp = () => setShowLogin(false);
    const switchToLogin = () => setShowLogin(true);

    return (
    <div>
        <header className="bg-mainOrange -mt-14 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">NYC Transit Hub</h1>
        </header>
        <div>
             {showLogin ? (
                <Login switchToSignUp={switchToSignUp} />
             ) : (
                <SignUp switchToLogin={switchToLogin} />
             )}
         </div>
         
         <div className = "w-full flex justify-center p-5">
             <div className = "h-11 w-32 bg-contain bg-center bg-no-repeat" style = {{backgroundImage: `url(${Logo})` }}></div>
         </div>
    </div>
    );
}

export default AuthPage;