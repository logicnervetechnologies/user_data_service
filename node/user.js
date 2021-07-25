const { MongoClient } = require('mongodb')
const mongoose = require('mongoose')
const struct = require("./structure.js");
require("dotenv").config()


const userStruct = new mongoose.Schema(struct.userDef);
mongoose.connect(process.env.MONGOUSERSURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const connection = mongoose.connection;
const userCol = connection.collection('users') 

connection.once("open", function() {
  console.log("MongoDB database connection established successfully");
});

const createUser = async ( newUser ) => {
    // var User = userCol.model("user", userStruct)
    // var newUser = new User({uid, fName, lName})
    userCol.insertOne(newUser, (err, user) => {
        if (err) console.error(err);
        if (user) console.log(user);
    });
}

//const dbName = process.env.USERDB
const createUserTmp = async (req, res) => {
    console.log("Entered TMP CREATE USER, this will be deprecated in next version")
    const uDat = {
        uid: req.user.uid, //(assigned from google auth)
        fName: req.body.fName,
        lName: req.body.lName,
        organizations:[]
    }
    if (!exists(uDat.uid)) {
        console.log("unauthorized")
        res.sendStatus(401)
    } else {
        await createUser(uDat);
        res.sendStatus(201);
    }
}

const getUserData = async (uid) => {
    var user = await userCol.findOne({uid:uid})
    if (user) return user;
    return null;
}

const exists = async (uid) => {
    var user = await getUserData(uid)
    console.log("exist check")
    console.log(user)
    if (user) {
        return true;
    } else {
        return false;
    }
}

const getMyUserData = async (req, res) => {
    console.log("getting user data")
    const uid = req.user.uid;
    const myUserData = await getUserData(uid);
    console.log(myUserData);
    if (myUserData === null) {
        res.status(204)
        res.json({ data: "USERDNE" })
    } else {
        res.json(myUserData)
    }
}

const addOrganizationToUser = async (uid, orgId) => {
    console.log(uid)
    var updated = null;
    try {
        var userDataOrgs = (await getUserData(uid)).organizations
        userDataOrgs.push(orgId)
        await userCol.updateOne({uid:uid}, {$set:{organizations: userDataOrgs}});
    } catch (err) {
        console.error(err)
    } finally  {
        if (updated) return true;
        else return false;
    }
}




module.exports = { getMyUserData, createUserTmp, addOrganizationToUser }