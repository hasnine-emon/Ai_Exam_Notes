import express from "express"
import dotenv from "dotenv"
import connectDb from "./utils/connectDb.js"
dotenv.config()

const PORT = process.env.PORT || 5000
const app=express()
app.get("/",(req,res)=>{
    res.json({message:"Exam Note Ai backend"})
})
app.listen(PORT,()=>{
   console.log(`Server is runing ${PORT}`)
   connectDb()
  
})