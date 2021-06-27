
require('dotenv').config()
console.log("form_server")
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const cors = require('cors')

import { signup } from "./setInfo.js"





app.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}))
app.use(express.json())

app.post('/posts', authenticateToken,(req, res) => {
    res.status(200)
    res.json(posts.filter(post => post.userid === req.user.uid))
})
.post('/signup', authenticateToken, signup)




// authentication functions
function authenticateToken(req, res, next) {
    const authHeaderCookie = req.headers['cookie']
    const token = authHeaderCookie && convertCookieString(authHeaderCookie)['accessToken']  
    if (token == null) return res.sendStatus(401) // check header
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log(err)
            return res.sendStatus(403)
        } //invalid token
        console.log(user.uid)
        req.user = user
        next()
    })
}
function convertCookieString(cookieStr) {
    var cookies = {}
    cookieStr.split("; ").map((sub) => {
        let k = sub.split('=')
        cookies[k[0]] = k[1]
    })
 //   console.log(cookies)
    return cookies
}

// start server
const PORT = process.env.HTTPPORT 
app.listen(PORT)
console.log("listenting on port:" + PORT)