const jwt = require('jsonwebtoken')

const key = process.env.SECRET

function verifyJWT(token){
    console.log('test')
    return jwt.verify(token, key)
}

module.exports = verifyJWT