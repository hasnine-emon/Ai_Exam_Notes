import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true,
        unique:true
    },
    credits:{
        type:Number,
        default:50,
        min:0
    },
    isCreditAvailable:{
        type:Boolean,
        default:true
    },
    notes:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Note",
        default:[]
    },

    // ---- NEW: email/password login + forgot password OTP ----
    // Google diye register hole password thakbe na (ta thik ache)
    password:{
        type:String,
        select:false
    },
    resetOtpHash:{
        type:String,
        select:false
    },
    resetOtpExpires:{
        type:Date,
        select:false
    },
    resetOtpAttempts:{
        type:Number,
        default:0,
        select:false
    }
},{
    timestamps : true,
    // password / otp kokhono frontend e jabe na
    toJSON:{
        transform:(doc, ret) => {
            delete ret.password
            delete ret.resetOtpHash
            delete ret.resetOtpExpires
            delete ret.resetOtpAttempts
            return ret
        }
    }
})

const UserModel = mongoose.model("UserModel", userSchema)

export default UserModel

