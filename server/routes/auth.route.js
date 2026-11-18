import express from "express"
import {
    googleAuth,
    logOut,
    registerUser,
    loginUser,
    forgotPassword,
    verifyOtp,
    resetPassword
} from "../controllers/auth.controller.js"

const authRouter = express.Router()

authRouter.post("/google", googleAuth)
authRouter.post("/register", registerUser)
authRouter.post("/login", loginUser)
authRouter.post("/forgot-password", forgotPassword)
authRouter.post("/verify-otp", verifyOtp)
authRouter.post("/reset-password", resetPassword)
authRouter.get("/logout", logOut)


export default authRouter

