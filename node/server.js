const setInfo = require("./setInfo.js")
const organization = require("./organization/protected.js")
const orgGeneral = require("./organization/general.js")
const user = require('./user.js')

require('dotenv').config()
console.log("form_server")
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const cors = require('cors')

app.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}))
app.use(express.json())

// user info routes
app.post('/posts', authenticateToken,(req, res) => {
    res.status(200)
    res.json(posts.filter(post => post.userid === req.user.uid))
})
.post('/createUserTmp', authenticateToken, user.createUserTmp)
.post('/getMyUserData', authenticateToken, user.getMyUserData);

//private org info routes
app.post('/getOrganization', authenticateToken, organization.getOrganizationInformation)
.post('/createOrganization', authenticateToken, organization.createOrganization)
.post('/adminAction', authenticateToken, organization.adminAction);

//general org info routes
app.post('/getBasicOrganization', orgGeneral.getGeneralInfoOrganization);

// user Actions
app.post('/userAction', authenticateToken, user.userAction);


// pretendToken for testing, remove when complete automated tests
function pretendToken(req, res, next) {
    let user = {
        uid: req.body.fakeUID
    }
    req.user = user;
    console.log(req.user)
    next()
}

// authentication functions
function authenticateToken(req, res, next) {
    const authHeaderCookie = req.headers['cookie']
    const token = authHeaderCookie && convertCookieString(authHeaderCookie)['accessToken'] 
    req.user = null; 
    if (token == null) { 
        console.log("No auth token")
        return res.sendStatus(401) // check header
    }
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
app.listen(PORT, () => {
    console.log("listenting on port:" + PORT)
})
// module.exports = { app }