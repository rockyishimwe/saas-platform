const jwt = require('jsonwebtoken');
const jwtConfig = {
    secret:process.env.JWT_SECRET || 'abcd',
    expiresIn:process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret:process.env.JWT_REFRESH_SECRET || '1234',
    refreshExpiresIn:process.env.JWT_REFRESH_EXPIRES_IN || '30d'
};

const generateToken = (payload) =>{
    return jwt.sign(payload,jwtConfig.secret,{
        expiresIn:jwtConfig.expiresIn
    });
};

const generateRefreshToken = (payload) =>{
    return jwt.sign(payload,jwtConfig.refreshSecret,{
        expiresIn:jwtConfig.refreshExpiresIn
    });
};
const verifyToken = (token) =>{
    return jwt.verify(token,jwtConfig.secret);
};
const verifyRefreshToken = (token) =>{
    return jwt.verify(token,jwtConfig.refreshSecret);
};
module.exports = {
    jwtConfig,
    generateToken,
    verifyToken,
    verifyRefreshToken,
    generateRefreshToken
};