import UserModel from "../models/user.model.js"
import { getToken } from "../utils/token.js"

export const googleAuth = async (req,res) => {
    try {
        const {name,email}=req.body
        let user = await UserModel.find({email})
        if (!user){
            user= await getToken(user._id)
            res.cookie("token",token,{
                httpOnly:true,
                secure:false,
                semesite:"strick",
                maxAge:7*24*8*60*60*1000
            })
            return res.status(200).json(user)
        }
    } catch (error) {
        return res.status(500).json({message: `googleSignup Error ${error}`})
        
    }
    
}

export const logOut = async (req,res) => {
    try {
        await res.clearCookie("token")
        return res.status(200).json({message: "LogOut Successfully"})
    } catch (error) {
        return res.status(500).json({message: `LogOut Error ${error}`})
        
    }
    
}