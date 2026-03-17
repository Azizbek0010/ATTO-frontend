import React, { useRef, useEffect, useState } from "react"
import * as faceapi from "face-api.js"
import { useNavigate } from "react-router-dom"
import logo from "../assets/logo.webp"

function FaceLogin() {
    const videoRef = useRef()
    const navigate = useNavigate()

    const [step, setStep] = useState(1) 
    const [status, setStatus] = useState("")
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [loading, setLoading] = useState(false)

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loggedUser, setLoggedUser] = useState(null) 

    const loadModels = async () => {
        try {
            setStatus("Modellar yuklanmoqda...")
            const MODEL_URL = "/models"
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
            await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL)
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            setModelsLoaded(true)
            setStatus("")
        } catch (err) {
            setStatus("Model xatosi: " + err.message)
        }
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            videoRef.current.srcObject = stream
        } catch (err) {
            setStatus("Kamera muamosi: " + err.message)
        }
    }

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop())
        }
    }

    useEffect(() => {
        loadModels()
    }, [])

    useEffect(() => {
        if (step === 2) {
            startCamera()
        }
    }, [step])

    const handlePasswordLogin = async () => {
        if (!email || !password) {
            setStatus("Email va parolni kiriting!")
            return
        }

        setLoading(true)
        setStatus("Tekshirilmoqda...")

        try {
            const res = await fetch(import.meta.env.VITE_BACKEND + "/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json()

            if (!res.ok) {
                setStatus("Hatoli yuz berdi" + (data.message || "Email yoki parol xato"))
                setLoading(false)
                return
            }

            setLoggedUser(data)
            setStatus("Parol to'g'ri! Endi yuzingizni ko'rsating")
            setStep(2)

        } catch (err) {
            setStatus("Xato: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleFaceLogin = async () => {
        if (!modelsLoaded) {
            setStatus("Modellar yuklanmadi, kuting...")
            return
        }

        setLoading(true)
        setStatus("Yuz aniqlanmoqda...")

        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks(true)
                .withFaceDescriptor()

            if (!detection) {
                setStatus("Qaytadan urining")
                setLoading(false)
                return
            }

            const descriptor = Array.from(detection.descriptor)

            const res = await fetch(import.meta.env.VITE_BACKEND + "/api/auth/face-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ faceDescriptor: descriptor })
            })

            const data = await res.json()

            if (!res.ok) {
                setStatus("Yuz tanilmadi!")
                setLoading(false)
                return
            }

            stopCamera()
            localStorage.setItem("refreshToken", data.refreshToken)

            setStatus("Muvaffaqiyatli kirildi!")
            navigate("/dashboard")

        } catch (err) {
            setStatus("Xato: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex justify-center items-center flex-col gap-4 bg-[#1E2965]">

            {step === 1 && (
                <div className="card bg-[#34489F] shadow-xl p-8 min-w-[400px] flex flex-col gap-4">
                    <p className="text-white font-bold text-center text-4xl">ATTO</p>

                    <input
                        type="email"
                        placeholder="Email"
                        className="input input-bordered w-full"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Parol"
                        className="input input-bordered w-full"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handlePasswordLogin()}
                    />

                    {status && <p className="text-sm text-center text-error">{status}</p>}

                    <button
                        onClick={handlePasswordLogin}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? <span className="loading loading-spinner" /> : "Davom etish →"}
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-2xl font-bold">Yuz orqali tasdiqlang</h1>
                    <p className="text-sm text-gray-500">Siz ekanligingizni tasdiqlash uchun</p>

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-[300px] h-[300px] rounded-full object-cover border-4 border-primary"
                    />

                    {status && (
                        <p className={`text-sm ${status.includes("") ? "text-success" : "text-error"}`}>
                            {status}
                        </p>
                    )}

                    <button
                        onClick={handleFaceLogin}
                        disabled={loading || !modelsLoaded}
                        className="btn btn-primary w-[200px]"
                    >
                        {loading
                            ? <span className="loading loading-spinner" />
                            : modelsLoaded ? "Yuz bilan kirish" : "Yuklanmoqda..."}
                    </button>

                    <button
                        onClick={() => { stopCamera(); setStep(1); setStatus("") }}
                        className="btn btn-ghost btn-sm"
                    >
                        ← Orqaga
                    </button>
                </div>
            )}

        </div>
    )
}

export default FaceLogin