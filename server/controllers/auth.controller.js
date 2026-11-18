import crypto from "crypto"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"
import UserModel from "../models/user.model.js"
import { getToken } from "../utils/token.js"

const OTP_EXPIRY_MS = 5 * 60 * 1000      // OTP 5 minute valid
const OTP_RESEND_MS = 60 * 1000          // 1 minute por abar OTP chaite parbe
const OTP_MAX_ATTEMPTS = 5               // 5 bar vul dile OTP bondho
const MIN_PASSWORD = 8
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeEmail = (email) => String(email || "").trim().toLowerCase()

// login/register/google shobar jonno ek-i cookie (agerr moto-i)
const sendAuthCookie = async (res, userId) => {
    const token = await getToken(userId)
    res.cookie("token", token, {
        httpOnly:true,
        secure: false,
        sameSite:"strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
}

// Frontend theke ashha Firebase idToken ta Google er server diye verify kora hoy.
// (age frontend er pathano email ke shorashori biswas kora hoto, ta safe na)
const verifyGoogleToken = async (idToken) => {
    if (!process.env.FIREBASE_API_KEY) {
        console.error("FIREBASE_API_KEY server/.env e nei")
        return null
    }
    const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken })
        }
    )
    if (!response.ok) return null
    const data = await response.json()
    const gUser = data.users?.[0]
    const isGoogle = gUser?.providerUserInfo?.some((p) => p.providerId === "google.com")
    if (!gUser || !gUser.email || !gUser.emailVerified || !isGoogle) return null
    return { email: normalizeEmail(gUser.email), name: gUser.displayName || "" }
}

const hashOtp = (email, otp) =>
    crypto.createHmac("sha256", process.env.JWT_SECRET).update(`${email}:${otp}`).digest("hex")

// OTP email pathanor jonno
const sendOtpMail = async (to, otp) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })
    await transporter.sendMail({
        from: `"ExamNotes AI" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Your ExamNotes AI password reset OTP",
        text: `Your OTP is ${otp}. It is valid for 5 minutes. If you did not request this, ignore this email.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
                <h2 style="margin:0 0 8px">ExamNotes AI</h2>
                <p style="color:#555">Use this OTP to reset your password:</p>
                <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0">${otp}</p>
                <p style="color:#777;font-size:13px">Valid for 5 minutes. If you did not request this, you can ignore this email.</p>
            </div>`
    })
}

const clearOtp = (user) => {
    user.resetOtpHash = undefined
    user.resetOtpExpires = undefined
    user.resetOtpAttempts = 0
}

// OTP thik kina check kore. Thik hole { user } dey, nahole { status, message } dey
const checkOtp = async (email, otp) => {
    if (!emailRegex.test(email) || !/^\d{6}$/.test(String(otp || ""))) {
        return { status: 400, message: "Enter the 6 digit OTP" }
    }
    const user = await UserModel.findOne({ email })
        .select("+resetOtpHash +resetOtpExpires +resetOtpAttempts")

    if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
        return { status: 400, message: "OTP is invalid or expired. Please request a new one." }
    }
    if (user.resetOtpExpires.getTime() < Date.now()) {
        clearOtp(user)
        await user.save()
        return { status: 400, message: "OTP expired. Please request a new one." }
    }
    if (user.resetOtpAttempts >= OTP_MAX_ATTEMPTS) {
        clearOtp(user)
        await user.save()
        return { status: 429, message: "Too many wrong attempts. Please request a new OTP." }
    }

    const expected = Buffer.from(user.resetOtpHash)
    const given = Buffer.from(hashOtp(email, String(otp)))
    const valid = expected.length === given.length && crypto.timingSafeEqual(expected, given)

    if (!valid) {
        user.resetOtpAttempts += 1
        await user.save()
        return { status: 400, message: "Incorrect OTP" }
    }
    return { user }
}

// ===================== GOOGLE AUTH =====================
export const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body
        if (!idToken) {
            return res.status(400).json({ message: "Google token missing" })
        }

        const gUser = await verifyGoogleToken(idToken)
        if (!gUser) {
            return res.status(401).json({ message: "Google verification failed. Please try again." })
        }

        const user = await UserModel.findOne({ email: gUser.email })

        if (!user) {
            return res.status(404).json({
                code: "NOT_REGISTERED",
                message: "You are not registered yet. Please register with name, email and password first.",
                name: gUser.name,
                email: gUser.email
            })
        }

        await sendAuthCookie(res, user._id)
        return res.status(200).json(user)

    } catch (error) {
        return res.status(500).json({ message:`googleSignup Error ${error}` })
    }
}

// ===================== REGISTER =====================
export const registerUser = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim()
        const email = normalizeEmail(req.body.email)
        const password = String(req.body.password || "")

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" })
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Enter a valid email" })
        }
        if (password.length < MIN_PASSWORD) {
            return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` })
        }

        const existing = await UserModel.findOne({ email })
        if (existing) {
            return res.status(409).json({
                message: "This email is already registered. Please login (or use Forgot password)."
            })
        }

        const hashed = await bcrypt.hash(password, 10)
        const user = await UserModel.create({ name, email, password: hashed })

        await sendAuthCookie(res, user._id)
        return res.status(201).json(user)

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "This email is already registered. Please login." })
        }
        return res.status(500).json({ message:`register Error ${error}` })
    }
}

// ===================== LOGIN =====================
export const loginUser = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email)
        const password = String(req.body.password || "")

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" })
        }

        const user = await UserModel.findOne({ email }).select("+password")
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" })
        }
        if (!user.password) {
            return res.status(400).json({
                message: "This account was created with Google. Use Continue with Google, or Forgot password to set a password."
            })
        }

        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            return res.status(401).json({ message: "Invalid email or password" })
        }

        await sendAuthCookie(res, user._id)
        return res.status(200).json(user)

    } catch (error) {
        return res.status(500).json({ message:`login Error ${error}` })
    }
}

// ===================== FORGOT PASSWORD (OTP) =====================
// Step 1: email dile OTP email e jabe
export const forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email)
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Enter a valid email" })
        }

        const genericMessage = "If this email is registered, an OTP has been sent."
        const user = await UserModel.findOne({ email }).select("+resetOtpExpires")
        if (!user) {
            return res.status(200).json({ message: genericMessage })
        }

        if (user.resetOtpExpires) {
            const sentAt = user.resetOtpExpires.getTime() - OTP_EXPIRY_MS
            if (Date.now() < sentAt + OTP_RESEND_MS) {
                return res.status(429).json({ message: "Please wait a minute before requesting another OTP." })
            }
        }

        const otp = String(crypto.randomInt(100000, 1000000))
        user.resetOtpHash = hashOtp(email, otp)
        user.resetOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS)
        user.resetOtpAttempts = 0
        await user.save()

        try {
            await sendOtpMail(email, otp)
        } catch (mailError) {
            console.log("OTP mail error:", mailError.message)
            clearOtp(user)
            await user.save()
            return res.status(500).json({ message: "Could not send OTP email. Please try again later." })
        }

        return res.status(200).json({ message: genericMessage })

    } catch (error) {
        return res.status(500).json({ message:`forgotPassword Error ${error}` })
    }
}

// Step 2: OTP thik kina check (OTP ekhono use hoy na, reset e lagbe)
export const verifyOtp = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email)
        const result = await checkOtp(email, req.body.otp)
        if (!result.user) {
            return res.status(result.status).json({ message: result.message })
        }
        return res.status(200).json({ message: "OTP verified" })

    } catch (error) {
        return res.status(500).json({ message:`verifyOtp Error ${error}` })
    }
}

// Step 3: notun password set
export const resetPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email)
        const newPassword = String(req.body.newPassword || "")

        if (newPassword.length < MIN_PASSWORD) {
            return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` })
        }

        const result = await checkOtp(email, req.body.otp)
        if (!result.user) {
            return res.status(result.status).json({ message: result.message })
        }

        const user = result.user
        user.password = await bcrypt.hash(newPassword, 10)
        clearOtp(user)
        await user.save()

        return res.status(200).json({ message: "Password updated. Please login with your new password." })

    } catch (error) {
        return res.status(500).json({ message:`resetPassword Error ${error}` })
    }
}

export const logOut = async (req,res) => {
    try {
        await res.clearCookie("token")
        return res.status(200).json({message:"LogOut Successfully"})
    } catch (error) {
        return res.status(500).json({message:`LogOut Error ${error}`})
        
    }
    
}