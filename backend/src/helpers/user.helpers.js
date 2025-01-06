import jwt from "jsonwebtoken";

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            UserId: user.UserId,
            UserEmail: user.UserEmail,
            UserFullName: user.UserFullName,
            StakeholderLevel: user.StakeholderLevel,

        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
}
const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            UserId: user.UserID,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
}


export {
    generateAccessToken,
    generateRefreshToken,
}