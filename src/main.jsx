import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import FaceLogin from './Pages/FaceLogin.jsx'
import Dashboard from './Pages/Dashboard.jsx'
import FaceRegister from './Pages/FaceRegist.jsx'
import PinPage from './Pages/PinPage.jsx'
import ProtectedRoute from './Components/ProtectedRoute.jsx'
import PinRoute from './Components/PinRoute.jsx'
import DashboardLayout from './Pages/DashboardLayout.jsx'

const GuestRoute = ({ children }) => {
    const token = localStorage.getItem("accessToken")
    const expiry = localStorage.getItem("tokenExpiry")
    const user = localStorage.getItem("user")

    if (token && user && expiry && Date.now() < parseInt(expiry)) {
        return <Navigate to="/pin" replace />
    }
    return children
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/",
                element: <GuestRoute><FaceLogin /></GuestRoute>
            },
            {
                path: "/FaceRegister",
                element: <GuestRoute><FaceRegister /></GuestRoute>
            },
            {
                path: "/pin",
                element: <PinRoute><PinPage /></PinRoute>
            },
            {
                path: "/",
                element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
                children: [
                    { path: "/dashboard", element: <Dashboard /> },
                    { path: "/payments", element: <div>To'lovlar</div> },
                    { path: "/settings", element: <div>Sozlamalar</div> },
                ]
            }
        ]
    },
])

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)