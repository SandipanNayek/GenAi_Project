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
   const{ email,username,password } =req.body

     if([ email,username,password ].some((field)=>
    field?.trim() ==="")
    ){
     throw new ApiError(400,"all fields are required");  
   }
   const existingUser = await UserModel.findOne({
   $or:[{email},{username}]  
   })
   
   if(existingUser){
    throw new ApiError(400,"user with this email or username already exists")}

    const user = await UserModel.create({
        username:username.toLowerCase(),
        email,
        password
    })

    const createdUser = await UserModel.findById(user._id).select(
    "-password -refreshToken"
  )
  

  if(!createdUser){
    throw new ApiError(500, "somethig went wrong")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Successfully ")
  )

})

const generateAccessAndRefreshTokens = async (userId) =>{
  try {
      const user = await UserModel.findById(userId)

      if(!user){
        throw new ApiError(404,"User not found")
      }

      const accessToken = await user.generateAccessToken()
      const refreshToken = await user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave:false })

      return {accessToken,refreshToken}

  } catch (error) {
      console.log("TOKEN ERROR:", error)  // IMPORTANT
      throw new ApiError(500,"something went wrong when generate refresh and access token")
  }
}

const loginUser = asyncHandler(async(req,res) => {
   // req body-> data
   // username or email
   //find the user
   //password check
   //access and refresh token
   // send cookie

   const {email , username, password} = req.body

   if(!(username || email)){
    throw new ApiError(400,"username and email is required")
   }

    const user =await UserModel.findOne({
      $or:[{username}, {email}]
    })

    if(!user){
      throw new ApiError(404, "User does not exist")
    }
    const isPaswswordValid = await user.isPasswordCorrect(password)

    if(!isPaswswordValid){
      throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await UserModel.findById(user._id).select(
    "-password -refreshToken"
   )

   // cookies

   const options = {
    httpOnly:true,
    secure: true
   }
   return res.status(200)
   .cookie("accessToken",accessToken,options)    // store in browser
   .cookie("refreshToken",refreshToken,options)  // sstore in browser
   .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,accessToken,refreshToken
      },
      "user logged in Successfully"
    )
   )

})

const logoutUser = asyncHandler(async(req,res)=>{
  await UserModel.findByIdAndUpdate(
    req.user._id,
     {
      $unset:{
        refreshToken: 1
      }
    },
    {
      new:true
    }
   )

   const options = {
    httpOnly:true,
    secure: true
   }

   return res.status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged out"))

 })



export{
     registerUser, 
     generateAccessAndRefreshTokens,
     loginUser,

    }