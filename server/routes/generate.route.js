import express from "express"
import { isAuth } from "../middlewares/auth.middleware.js"
import { generateNotes } from "../controllers/generate.controller.js"


const notesRouter = express.Router()


notesRouter.post("/generate-notes",isAuth,generateNotes)

export default notesRouter