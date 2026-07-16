import express from "express"
import dotenv from "dotenv"
import connectDb from "./utils/connectDb.js"
import authRouter from "./routes/auth.route.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import userRouter from "./routes/user.route.js"
dotenv.config()

const PORT = process.env.PORT || 5000
const app=express()

app.use(cors(
    {origin:"http://localhost:5173",
        credentials:true,
        methods: ["GET","POST","PUT","DELETE","OPTIONS"]
    }
))
app.use(express.json())
app.use(cookieParser())

app.get("/",(req,res)=>{
    res.json({message:"Exam Note Ai backend"})
})
app.use("/api/auth",authRouter)
app.use("/api/user", userRouter)

app.listen(PORT,()=>{
   console.log(`Server is runing ${PORT}`)
   connectDb()
  
})