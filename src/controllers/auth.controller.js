console.log("🔥 AUTH CONTROLLER LOADED 🔥");
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { UserModel } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";


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
  
 console.log("Created User:", createdUser);  // IMPORTANT   
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

      const accessToken =  user.generateAccessToken()
      const refreshToken =  user.generateRefreshToken()

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
    secure: false
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
    secure: false
   }

   console.log("🔥 LOGOUT FUNCTION HIT 🔥");

   return res.status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged out"))

 })

 const refreshAccessToken = asyncHandler(async(req,res)=>{
     console.log("🔥 REFRESH FUNCTION HIT 🔥");
 const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET)
  
    const user = await UserModel.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid refresh Token")
    }

    console.log("INCOMING:", incomingRefreshToken);
    console.log("DB:", user.refreshToken);
  
    if(incomingRefreshToken !==user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used")
    }
  
  
    const options ={
      httpOnly:true,
      secure:false
    }
    
    const {accessToken,refreshToken:newrefreshToken} =await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken, options)
    .json(
        new ApiResponse(
          200,
          {accessToken,refreshToken:newrefreshToken},
          "Access token is refreshed"
        )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }

 })

 const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body

   const user= await UserModel.findById(req.user?._id)
   const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")
   }

   user.password=newPassword
   await user.save({validateBeforeSave:false})
   

   return res
   .status(200)
   .json(new ApiResponse(200,{},"Password changed Successfully"))
 })

 const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200,req.user,"current user fetched Successfully"))
 })



export{
     registerUser, 
     generateAccessAndRefreshTokens,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     getCurrentUser
    }