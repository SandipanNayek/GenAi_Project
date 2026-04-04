import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
const userSchema = new Schema({
    username:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true
    },
    email:{
     type:String,
     unique:true,
     required:true,
     lowercase:true,
     trim:true
    },
    password:{
     type:String,
     required:true
    },
    refreshToken:{
    type:String
   }
},{
    timestamps:true
})

userSchema.pre("save", async function(){
    if(!this.isModified("password")) return ;
    this.password=await bcrypt.hash(this.password,10);
})

userSchema.methods.isPasswordCorrect = async function(password){
 return await bcrypt.compare(password,this.password)
}


userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,

    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}


userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id, 

    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const UserModel = mongoose.model("UserModel",userSchema) 