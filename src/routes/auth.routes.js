import {Router} from "express"
import { 
    changeCurrentPassword, 
    getCurrentUser,  
    loginUser, 
    logoutUser, 
    registerUser,
   } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/auth.controller.js";

const router =Router()


router.route("/register").post(registerUser)
router.route("/login").post(loginUser)


// secured routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
export default router