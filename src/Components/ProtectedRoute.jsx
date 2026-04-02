import { Navigate } from "react-router-dom"

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("accessToken")
    const expiry = localStorage.getItem("tokenExpiry")
    const user = localStorage.getItem("user")

    if (!token || !user || !expiry || Date.now() > parseInt(expiry)) {
        localStorage.clear()
        return <Navigate to="/" replace />
    }

    return children
}

export default ProtectedRoute