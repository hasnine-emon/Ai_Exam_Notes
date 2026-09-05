import express from "express"
import  isAuth from "../middleware/isAuth.js"


const pdfRouter = express.Router()


pdfRouter.post("/generate-notes",isAuth,pdfDownload)

export default pdfRouter