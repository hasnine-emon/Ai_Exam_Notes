import mongoose from "mongoose";

const notesSchema = new mongoose.Schema({
   user: {
     type: mongoose.Schema.Types.ObjectId,
     ref : "UserModel",
    required: true
   },

   topic: {
    type: String,
    required: true
   },
   chapters: [String],   
   examType: String,
    revisionMode: {
        type: Boolean,
        default: false
    },
    content: {
        type : mongoose.Schema.Types.Mixed, //API response (string/JSON)
        required: true
    },
},{timestamps : true})

const Notes = mongoose.model("Notes", notesSchema)
export default Notes
