import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"

const Dashboard = () => {
    const navigate = useNavigate()
    const refreshToken = localStorage.getItem("refreshToken")

    useEffect(() => {
        if (!refreshToken) {
            navigate(-1)
        }
    }, [])

    const logout = () => {
        localStorage.clear()
        navigate("/")
    }

    return (
        <div className="min-h-screen flex justify-center items-center flex-col gap-4 bg-base-200">
            <h1 className="text-3xl font-bold">Xush kelibsiz! 👋</h1>

            <button onClick={logout} className="btn btn-error w-[200px]">
                Chiqish
            </button>
        </div>
    )
}

export default Dashboard