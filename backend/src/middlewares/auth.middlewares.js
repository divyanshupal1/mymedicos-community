// import { AvailableUserRoles } from "../constants.js";
import admin from "../db/firebase.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request no token");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const user = decodedToken
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    if(user){
      const mongouser = await User.findOne({uid: user.uid});
      if(!mongouser){
            const userDoc = await admin.firestore().collection("users").where("Phone Number","==",req.user.phone_number).get();
            if(userDoc.empty){
                throw new ApiError(404, "User not found");
            }
        
            const userData = userDoc.docs[0].data();
            const newUser = new User({
                uid: req.user.uid,
                name: userData.Name,
                email: userData["Email ID"],
                phoneNumber: req.user.phone_number,
                photoURL:userData["Profile"],
                prefix: userData["Prefix"],
                interests: userData["Interests"] || [ userData["Interest"] ],
            });
            await newUser.save();
      }
    }
    req.user = user;
    next();
  } catch (error) {
    // Client should make a request to /api/v1/users/refresh-token if they have refreshToken present in their cookie
    // Then they will get a new access token which will allow them to refresh the access token without logging out the user
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

export const getLoggedInUser = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      next();
    }
    try{
      const decodedToken = await admin.auth().verifyIdToken(token);
      const user = decodedToken
      req.user = user;
    }
    catch (error) {
      // Fail silently with req.user being falsy
    }
    next();
 
});

/**
 *
 * @description Middleware to check logged in users for unprotected routes. The function will set the logged in user to the request object and, if no user is logged in, it will silently fail.
 *
 * `NOTE: THIS MIDDLEWARE IS ONLY TO BE USED FOR UNPROTECTED ROUTES IN WHICH THE LOGGED IN USER'S INFORMATION IS NEEDED`
 */
export const getLoggedInUserOrIgnore = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const user = decodedToken
    req.user = user;
    next();
  } catch (error) {
    // Fail silently with req.user being falsy
    next();
  }
});

/**
 * @param {AvailableUserRoles} roles
 * @description
 * * This middleware is responsible for validating multiple user role permissions at a time.
 * * So, in future if we have a route which can be accessible by multiple roles, we can achieve that with this middleware
 */
// export const verifyPermission = (roles = []) =>
//   asyncHandler(async (req, res, next) => {
//     if (!req.user?._id) {
//       throw new ApiError(401, "Unauthorized request");
//     }
//     if (roles.includes(req.user?.role)||req.user?.role == 'SUPERADMIN') {
//       next();
//     } else {
//       throw new ApiError(403, "You are not allowed to perform this action");
//     }
//   });

export const avoidInProduction = asyncHandler(async (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    next();
  } else {
    throw new ApiError(
      403,
      "This service is only available in the local environment. For more details visit: https://github.com/hiteshchoudhary/apihub/#readme"
    );
  }
});
