import React, { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const App = () => {
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        const user = localStorage.getItem("user")
        const expiry = localStorage.getItem("tokenExpiry")
        const token = localStorage.getItem("accessToken")
        const path = location.pathname

        const authPages = ["/", "/FaceRegister"]
        const pinPage = "/pin"
        const dashboardPages = ["/dashboard", "/payments", "/settings"]

        const isLoggedIn = user && token && expiry && Date.now() < parseInt(expiry)

        if (isLoggedIn) {
            if (authPages.includes(path)) {
                navigate("/pin", { replace: true })
            }
        } else {
            if (dashboardPages.includes(path) || path === pinPage) {
                localStorage.clear()
                navigate("/", { replace: true })
            }
        }
    }, [location.pathname])

    return <Outlet />
}

export default App