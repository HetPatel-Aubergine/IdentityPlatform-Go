import { initializeApp } from 'firebase/app';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    getAuth,
    signOut, TotpMultiFactorGenerator,
    getMultiFactorResolver
} from 'firebase/auth';
import {useEffect, useState} from "react";
import Totp_configure from "./totp_configure.jsx";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
};

function App() {
    const [openTOTPConfig, setOpenTOTPConfig] = useState(false)
    const [user, setUser] = useState(null)
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)

    async function signIn() {
        const email = prompt("Email");
        const password = prompt("Password");

        try {
            const res = await signInWithEmailAndPassword(auth, email, password)
            setUser(res.user)
            res.user.getIdToken().then(token => {
                console.log(token)
            })
        } catch (error) {
            switch (error.code) {
                case "auth/multi-factor-auth-required":
                    // Initiate your second factor sign-in flow. (See next step.)

                    const otpFromAuthenticator = prompt("Enter Code from authenticator app")
                    const mfaResolver = getMultiFactorResolver(getAuth(), error);
                    const enrolledFactors = mfaResolver.hints.map(info => info.displayName);

                    // Selecting first enrolled app but user should pick if enrolled in multiple
                    const selectedIndex = 0

                    const multiFactorAssertion =
                        TotpMultiFactorGenerator.assertionForSignIn(
                            mfaResolver.hints[selectedIndex].uid,
                            otpFromAuthenticator
                        );
                    try {
                        const userCredential = await mfaResolver.resolveSignIn(
                            multiFactorAssertion
                        );

                        setUser(userCredential.user)
                        userCredential.user.getIdToken().then(token => {
                            console.log(token)
                        })
                    } catch (error) {
                        // Invalid or expired OTP.
                        console.error(error)
                        alert("Invalid or expired OTP")
                    }
                    break;
                default:
                    console.error(error)
                    alert(error.message)
                    document.getElementById("message").innerHTML = error.message;
                    break;
            }
        }
    }

    useEffect(() => {

            onAuthStateChanged(auth, (user) => {
                if (user) {
                    setUser(user)

                    document.getElementById("message").innerHTML = "Welcome, " + user.email;
                }
                else {
                    document.getElementById("message").innerHTML = "No user signed in.";
                }
            });
    }, []);

    function configuredSuccess() {
        setOpenTOTPConfig(false)
    }

    return (
        <>
            <h1 id="message">{user?.email}</h1>
            <button onClick={signIn}>Sign in</button>
            <button onClick={() => signOut(auth)}>Sign out</button>
            <button onClick={() => setOpenTOTPConfig(true)}>Configure TOTP</button>

            <dialog open={openTOTPConfig}>
                {openTOTPConfig && (
                    <>
                    <button onClick={configuredSuccess}>Close dialog</button>
                    <Totp_configure user={user} successHandler={configuredSuccess} />
                    </>
                )}
            </dialog>

        </>
    )
}

export default App
