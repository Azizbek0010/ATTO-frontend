import React, { useRef, useEffect, useState } from "react"
import * as faceapi from "face-api.js"
import { useNavigate } from "react-router-dom"

function FaceRegister() {
    const videoRef = useRef()
    const navigate = useNavigate()

    const [step, setStep] = useState(1)
    const [status, setStatus] = useState("")
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [loading, setLoading] = useState(false)

    const [name, setName] = useState("")
    const [familya, setfamilya] = useState("")

    const fullName = familya + " " + name

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [pin, setPin] = useState("")
    const [confirmPin, setConfirmPin] = useState("")
    const [faceDescriptor, setFaceDescriptor] = useState(null)
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

    const startDetection = () => {
        detectionInterval.current = setInterval(async () => {
            if (!videoRef.current || !modelsLoaded) return
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            setFaceDetected(!!detection)
        }, 300)
    }


    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            videoRef.current.srcObject = stream
        } catch (err) {
            setStatus("Kamera xatosi: " + err.message)
        }
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

    useEffect(() => { loadModels() }, [])
    useEffect(() => { if (step === 2) startCamera() }, [step])

    const handleNextStep = () => {
        if (!fullName || !email || !password || !confirmPassword) {
            setStatus("Barcha maydonlarni to'ldiring!")
            return
        }
        if (!email.includes("@gmail.com")) {
            setStatus("Email @gmail.com bo'lishi kerak!")
            return
        }
        if (password.length < 7) {
            setStatus("Parol kamida 7 ta belgi!")
            return
        }
        if (password !== confirmPassword) {
            setStatus("Parollar mos kelmadi!")
            return
        }
        setStatus("")
        setStep(2)
    }


    const handleFaceScan = async () => {
        if (!modelsLoaded) return

        setLoading(true)
        setStatus("Yuz skanlanmoqda...")

        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks(true)
                .withFaceDescriptor()

            if (!detection) {
                setStatus("Yuz topilmadi, qaytadan urining")
                setLoading(false)
                return
            }

            setFaceDescriptor(Array.from(detection.descriptor))
            stopCamera()
            setStatus("")
            setStep(3)
        } catch (err) {
            setStatus("Xato: " + err.message)
        } finally {
            setLoading(false)
        }
    }


    const handlePinStep = () => {
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            setStatus("PIN 4 ta raqam bo'lishi kerak!")
            return
        }
        setStatus("")
        setStep(4)
    }


    const handleRegister = async () => {
        if (pin !== confirmPin) {
            setStatus("PIN kodlar mos kelmadi!")
            return
        }

        setLoading(true)
        setStatus("Ro'yxatdan o'tilmoqda...")

        try {
            const res = await fetch(import.meta.env.VITE_BACKEND + "/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, password, faceDescriptor, pinCode: pin })
            })

            const data = await res.json()

            if (!res.ok) {
                setStatus(" " + (data.message || data.errors?.[0]?.msg || "Xato"))
                setLoading(false)
                return
            }

            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000
            localStorage.setItem("accessToken", data.accessToken)
            localStorage.setItem("refreshToken", data.refreshToken)
            localStorage.setItem("user", JSON.stringify(data.user))
            localStorage.setItem("tokenExpiry", expiry.toString())

            navigate("/pin")
        } catch (err) {
            setStatus("Xato: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (step !== 3) return
        const handleKeyDown = (e) => {
            if (e.key >= "0" && e.key <= "9") {
                setPin(prev => prev.length < 4 ? prev + e.key : prev)
            }
            if (e.key === "Backspace") setPin(prev => prev.slice(0, -1))
            if (e.key === "Enter") handlePinStep()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [step, pin])

    useEffect(() => {
        if (step !== 4) return
        const handleKeyDown = (e) => {
            if (e.key >= "0" && e.key <= "9") {
                setConfirmPin(prev => prev.length < 4 ? prev + e.key : prev)
            }
            if (e.key === "Backspace") setConfirmPin(prev => prev.slice(0, -1))
            if (e.key === "Enter") handleRegister()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [step, confirmPin])


    useEffect(() => {
        if (step === 3 && pin.length === 4) {
            handlePinStep()
        }
    }, [pin])

    useEffect(() => {
        if (step === 4 && confirmPin.length === 4) {
            if (pin !== confirmPin) {
                setStatus("PIN kodlar mos kelmadi!")
                setTimeout(() => {
                    setConfirmPin("")
                    setStatus("")
                    setStep(3)
                    setPin("")
                }, 800)
            } else {
                handleRegister()
            }
        }
    }, [confirmPin])

    return (
        <div className="min-h-screen flex justify-center items-center flex-col gap-6 bg-gradient-to-b from-black via-gray-900 to-black px-4">

            {step === 1 && (
                <div className="w-full max-w-[420px] p-8 rounded-3xl 
    bg-white/5 backdrop-blur-xl shadow-2xl 
    flex flex-col gap-5">

                    <div className="text-center space-y-1">
                        <p className="text-white font-extrabold text-4xl tracking-widest 
            drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                            AGATO
                        </p>
                        <p className="text-gray-400 text-sm tracking-wide">
                            Ro'yxatdan o'tish
                        </p>
                    </div>

                    <input type="text" placeholder="To'liq ism"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 
            outline-none focus:bg-white/20 transition"
                        onChange={e => setName(e.target.value)} />

                    <input type="text" placeholder="To'liq familiya"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 
            outline-none focus:bg-white/20 transition"
                        onChange={e => setfamilya(e.target.value)} />

                    <input type="email" placeholder="Email (@gmail.com)"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 
            outline-none focus:bg-white/20 transition"
                        value={email} onChange={e => setEmail(e.target.value)} />

                    <input type="password" placeholder="Parol (kamida 7 belgi)"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 
            outline-none focus:bg-white/20 transition"
                        value={password} onChange={e => setPassword(e.target.value)} />

                    <input type="password" placeholder="Parolni tasdiqlang"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 
            outline-none focus:bg-white/20 transition"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleNextStep()} />

                    {status && <p className="text-red-400 text-sm text-center animate-pulse">{status}</p>}

                    <button onClick={handleNextStep}
                        className="w-full py-3 rounded-xl 
            bg-purple-600 hover:bg-purple-500 
            active:scale-95 transition-all text-white font-medium shadow-lg">
                        Davom etish →
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                        Hisobingiz bormi?{" "}
                        <span onClick={() => navigate("/")}
                            className="text-purple-400 cursor-pointer hover:underline">
                            Kirish
                        </span>
                    </p>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Yuzingizni skanlab oling</h1>
                    <p className="text-sm text-gray-300">Kameraga to'g'ri qarang</p>

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

                    {status && <p className="text-sm text-error">{status}</p>}

                    <button
                        onClick={handleFaceScan}
                        disabled={loading || !modelsLoaded || !faceDetected}
                        className={`btn w-[200px] transition-all ${faceDetected ? "btn-success" : "btn-disabled"
                            }`}
                    >
                        {loading
                            ? <span className="loading loading-spinner" />
                            : modelsLoaded
                                ? faceDetected ? "Yuzni skanlash →" : "Yuzni ko'rsating"
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

            {step === 3 && (
                <div className="min-h-screen w-full fixed inset-0 flex flex-col justify-between items-center bg-black py-12 select-none">

                    <div className="text-center mt-8">
                        <p className="text-white text-2xl font-bold tracking-wide">PIN kod o'rnating</p>
                        <p className="text-gray-400 text-sm mt-2">4 ta raqamli PIN kod kiriting</p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="flex gap-6">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length ? "bg-white scale-110" : "bg-gray-600"
                                    }`} />
                            ))}
                        </div>
                        {status && <p className="text-red-400 text-sm animate-pulse">{status}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-2 px-8 w-full max-w-[340px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num}
                                onClick={() => pin.length < 4 && setPin(prev => prev + String(num))}
                                className="flex items-center justify-center h-20 rounded-full text-white text-3xl font-light active:bg-gray-700 hover:bg-gray-800 transition-colors"
                            >
                                {num}
                            </button>
                        ))}

                        <button
                            onClick={() => { setStep(2); setPin(""); setStatus(""); startCamera() }}
                            className="flex items-center justify-center h-20 rounded-full text-gray-400 active:bg-gray-700 hover:bg-gray-800 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => pin.length < 4 && setPin(prev => prev + "0")}
                            className="flex items-center justify-center h-20 rounded-full text-white text-3xl font-light active:bg-gray-700 hover:bg-gray-800 transition-colors"
                        >
                            0
                        </button>

                        <button
                            onClick={() => setPin(prev => prev.slice(0, -1))}
                            className="flex items-center justify-center h-20 rounded-full text-white active:bg-gray-700 hover:bg-gray-800 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="min-h-screen w-full fixed inset-0 flex flex-col justify-between items-center bg-black py-12 select-none">

                    <div className="text-center mt-8">
                        <p className="text-white text-2xl font-bold tracking-wide">PIN kodni tasdiqlang</p>
                        <p className="text-gray-400 text-sm mt-2">PIN kodni qayta kiriting</p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="flex gap-6">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < confirmPin.length ? "bg-purple-400 scale-110" : "bg-gray-600"  // ✅ purple — farq ko'rinsin
                                    }`} />
                            ))}
                        </div>
                        {status && <p className="text-red-400 text-sm animate-pulse">{status}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-2 px-8 w-full max-w-[340px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num}
                                onClick={() => confirmPin.length < 4 && setConfirmPin(prev => prev + String(num))}
                                className="flex items-center justify-center h-20 rounded-full text-white text-3xl font-light active:bg-gray-700 hover:bg-gray-800 transition-colors"
                            >
                                {num}
                            </button>
                        ))}

                        <button
                            onClick={() => { setStep(3); setConfirmPin(""); setStatus("") }}
                            className="flex items-center justify-center h-20 rounded-full text-gray-400 active:bg-gray-700 hover:bg-gray-800 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => confirmPin.length < 4 && setConfirmPin(prev => prev + "0")}
                            className="flex items-center justify-center h-20 rounded-full text-white text-3xl font-light active:bg-gray-700 hover:bg-gray-800 transition-colors"
                        >
                            0
                        </button>

                        <button
                            onClick={() => setConfirmPin(prev => prev.slice(0, -1))}
                            className="flex items-center justify-center h-20 rounded-full text-white active:bg-gray-700 hover:bg-gray-800 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FaceRegister