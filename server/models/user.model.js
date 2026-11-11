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
    // toJSON is used to modify the output of the document when it is converted to JSON. In this case, it removes sensitive fields like password and reset OTP information from the output.
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

