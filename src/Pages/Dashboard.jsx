import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import humo from "../assets/humo.png"
import { FaChevronRight } from "react-icons/fa";

const Dashboard = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [show, setShow] = useState(false)

    console.log(user);

    const fetchUser = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken")
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
            const res = await fetch(
                import.meta.env.VITE_BACKEND + "/api/auth/me/" + storedUser._id,
                { headers: { Authorization: "Bearer " + accessToken } }
            )
            if (res.ok) {
                const data = await res.json()
                setUser(data)
            } else {
                setUser(storedUser)
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) {
            navigate(-1)
            return
        }
        fetchUser()
    }, [])


    const formatCard = (num) => {
        if (!num) return "---- ---- ---- ----"
        return num.match(/.{1,4}/g)?.join(" ") || num
    }

    const formatName = (fullName) => {
        if (!fullName) return "-- --"
        const parts = fullName.toUpperCase().split(" ")
        if (parts.length === 1) return parts[0]
        return `${parts[0]} ${parts[1][0]}.`
    }

    if (!user) {
        return (
            <div className="flex justify-center relative h-screen w-full bg-base-200 z-100 items-center top-[50%]">
                <span className="loading loading-dots loading-xl"></span>
            </div>
        )
    }

    return (
        <div className=" bg-base-200 flex flex-col items-center py-4">

            <div className="w-[95%]  max-w-[500px] mx-auto flex flex-col gap-3">

                <div className="flex justify-between items-center">
                    <p className="text-[20px] opacity-90 font-semibold">
                        {user?.fullName?.split(" ")[1]}
                        {/* <FaChevronRight /> */}
                    </p>

                    <div className="flex gap-1">
                        <button onClick={() => setShow(prev => !prev)} className="btn btn-ghost btn-circle">
                            {show ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>


                    </div>
                </div>

                <a href="#" className="hover-3d cursor-pointer">
                    <div className="card w-full bg-black text-white bg-[radial-gradient(circle_at_bottom_left,#ffffff04_35%,transparent_36%),radial-gradient(circle_at_top_right,#ffffff04_35%,transparent_36%)]">
                        <div className="card-body">
                            <div className="flex justify-between mb-10">
                                <div className="font-bold text-shadow-2xs text-shadow-white">AGATO</div>
                                <div className="absolute right-3 opacity-50">
                                    <img className="h-8" src={humo} alt="" />
                                </div>
                            </div>
                            <div className="text-lg mb-4 tracking-widest opacity-70 font-card ">
                                {show
                                    ? formatCard(user?.cardNumber)
                                    : "•••• •••• •••• " + (user?.cardNumber?.slice(-4) || "••••")
                                }
                            </div>

                            <div className="flex justify-between">
                                <div>
                                    <div className="text-xs opacity-20">CARD HOLDER</div>
                                    <div>{formatName(user?.fullName)}</div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-20">EXPIRES</div>
                                    <div>{show ? user?.expiryDate || "--/--" : "••/••"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>

                <div className="bg-base-100 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm opacity-60">Balans</span>
                    </div>
                    <span className="font-bold text-lg">
                        {user?.balance?.toLocaleString() || "0"} <span className="text-sm font-normal opacity-50">so'm</span>
                    </span>
                </div>



            </div>
        </div>
    )
}

export default Dashboard