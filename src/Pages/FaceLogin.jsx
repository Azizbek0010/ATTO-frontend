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
    const [faceDetected, setFaceDetected] = useState(false)
    const detectionInterval = useRef(null)

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

    const startDetection = () => {
        detectionInterval.current = setInterval(async () => {
            if (!videoRef.current || !modelsLoaded) return

            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())

            setFaceDetected(!!detection)
        }, 200) 
    }

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop())
        }
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current)  
        }
        setFaceDetected(false)
    }

    useEffect(() => {
        if (step === 2) {
            startCamera().then(() => startDetection())  
        }
    }, [step])

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
                body: JSON.stringify({
                    faceDescriptor: descriptor,
                    userId: loggedUser.user._id  
                })
            })

            const data = await res.json()

            if (!res.ok) {
                setStatus("Yuz tanilmadi!")
                setLoading(false)
                return
            }

            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000

            localStorage.setItem("accessToken", data.accessToken)
            localStorage.setItem("refreshToken", data.refreshToken)
            localStorage.setItem("user", JSON.stringify(data.user))
            localStorage.setItem("tokenExpiry", expiry.toString())  

            setStatus("Muvaffaqiyatli kirildi!")
            navigate("/pin")

        } catch (err) {
            setStatus("Xato: " + err.message)
        } finally {
            setLoading(false)
        }
    }



    const handleLogout = () => {
        localStorage.clear()
        navigate("/FaceRegister")
    }


    return (
        <div className="min-h-screen flex justify-center items-center flex-col gap-6 
        bg-gradient-to-b from-black via-gray-900 to-black px-4">

            {step === 1 && (
                <div className="w-full max-w-[420px] p-8 rounded-3xl 
                bg-white/5 backdrop-blur-xl shadow-2xl 
                flex flex-col gap-5">

                    <div className="text-center space-y-2">
                        <p className="text-white font-extrabold text-4xl tracking-widest 
                        drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                            ATTO
                        </p>
                        <p className="text-gray-400 text-sm">
                            Hisobingizga kiring
                        </p>
                    </div>

                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-3 rounded-xl 
                        bg-white/10 text-white placeholder-gray-400 
                        outline-none focus:bg-white/20 transition"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Parol"
                        className="w-full px-4 py-3 rounded-xl 
                        bg-white/10 text-white placeholder-gray-400 
                        outline-none focus:bg-white/20 transition"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handlePasswordLogin()}
                    />

                    {status && (
                        <p className="text-red-400 text-sm text-center animate-pulse">
                            {status}
                        </p>
                    )}

                    <button
                        onClick={handlePasswordLogin}
                        disabled={loading}
                        className="w-full py-3 rounded-xl 
                        bg-purple-600 hover:bg-purple-500 
                        active:scale-95 transition-all text-white shadow-lg"
                    >
                        {loading
                            ? <span className="loading loading-spinner" />
                            : "Davom etish →"}
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                        Hisobingiz yo‘qmi?{" "}
                        <span
                            onClick={() => navigate("/FaceRegister")}
                            className="text-purple-400 cursor-pointer hover:underline"
                        >
                            Ro'yxatdan o'tish
                        </span>
                    </p>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Yuz orqali tasdiqlang</h1>
                    <p className="text-sm text-gray-300">Siz ekanligingizni tasdiqlash uchun</p>

                    <div className={`rounded-full p-1 transition-all duration-300 ${faceDetected
                            ? "border-4 border-green-400 shadow-[0_0_20px_4px_rgba(74,222,128,0.6)]"   
                            : "border-4 border-red-500 shadow-[0_0_20px_4px_rgba(239,68,68,0.4)]" 
                        }`}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-[280px] h-[280px] rounded-full object-cover"
                        />
                    </div>

                    <p className={`text-sm font-medium transition-all ${faceDetected ? "text-green-400" : "text-red-400"
                        }`}>
                        {faceDetected ? "Yuz aniqlandi" : "Yuz ko'rinmayapti"}
                    </p>

                    {status && (
                        <p className="text-sm text-error">{status}</p>
                    )}

                    <button
                        onClick={handleFaceLogin}
                        disabled={loading || !modelsLoaded || !faceDetected}
                        className={`btn w-[200px] transition-all ${faceDetected ? "btn-success" : "btn-disabled"
                            }`}
                    >
                        {loading
                            ? <span className="loading loading-spinner" />
                            : modelsLoaded
                                ? faceDetected ? "Kirish →" : "Yuzni ko'rsating"
                                : "Yuklanmoqda..."}
                    </button>

                    <button
                        onClick={() => { stopCamera(); setStep(1); setStatus(""); setFaceDetected(false) }}
                        className="btn btn-ghost btn-sm text-white"
                    >
                        ← Orqaga
                    </button>
                </div>
            )}

        </div>
    )
}

export default FaceLogin