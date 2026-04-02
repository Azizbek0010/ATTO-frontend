import { Navigate } from "react-router-dom"

const PinRoute = ({ children }) => {
    const user = localStorage.getItem("user")
    const token = localStorage.getItem("accessToken")
    const expiry = localStorage.getItem("tokenExpiry")

    if (!user || !token || !expiry || Date.now() > parseInt(expiry)) {
        localStorage.clear()
        return <Navigate to="/" replace />
    }

    return children
}

export default PinRoute