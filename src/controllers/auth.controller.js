import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { UserModel } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";



const registerUser = asyncHandler(async(req, res) =>{
    /* 
    @route POST /api/auth/register
    @description Register a new user
    @access Public
    */
   const{fullname, email,username,password } =req.body

     if([fullname, email,username,password ].some((field)=>
    field?.trim() ==="")
    ){
     throw new ApiError(400,"all fields are required");  
   }
   const existingUser = await UserModel.findOne({
   $or:[{email},{username}]  
   })
   
   if(existingUser){
    throw new ApiError(400,"user with this email or username already exists")}

    

})

export{
     registerUser, 

    }