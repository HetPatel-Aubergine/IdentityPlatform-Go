import {
    multiFactor,
    TotpMultiFactorGenerator,
    TotpSecret,
    getAuth,
} from "firebase/auth";
import {useEffect, useState} from "react";
import QRCode from "react-qr-code";

function Totp_configure({user, successHandler}) {
    const [totpsecret, setTotpsecret] = useState(null)
    const [verificationCode, setVerificationCode] = useState("")

    // @ts-ignore
    useEffect(async () => {
        const multiFactorSession = await multiFactor(user).getSession();
        const secret = await TotpMultiFactorGenerator.generateSecret(
            multiFactorSession
        );
        setTotpsecret(secret)
    }, [])

    async function verify() {
        try {
            const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
                totpsecret,
                verificationCode
            );
            await multiFactor(user).enroll(multiFactorAssertion, "AlignmtAI_MFA");
            alert("Successfully enrolled")
            successHandler()
        } catch (e) {
            console.error(e)
            alert("Error while enrolling the user")
        }

    }

    if (!totpsecret) return null
    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "2em"}}>
            <h3>Secret: {totpsecret?.secretKey}</h3>
            <QRCode value={totpsecret?.generateQrCodeUrl(user.email, "AlignmtAI")}/>

            <input placeholder="verification code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}/>
            <button onClick={verify}>Verify</button>
        </div>
    )
}

export default Totp_configure