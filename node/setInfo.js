const { MongoClient } = require('mongodb')
require("dotenv").config()


const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true })
//const dbName = process.env.USERDB

const signup = async (req, res) => {
    await client.connect()
    console.log("sucessful connection")
    const db = client.db(dbName)
    const users_collection = db.collection(process.env.USERCOLLECTION)

    var user = {
        uid: req.user.uid,
        firstName: req.firstName,
        lastName: req.lastName,
        provider: req.provider,
        role: req.role,
        modules: []
    }
    if (user.provider === true) {
        user['organization'] = req.user.organization
        user['primary'] = req.user.primary
        if (req.user.primary === false) {
            user['superior'] = ""
        }
    }

    const insertResult = await users_collection.insertOne(user)
    console.log('Inserted documents =>', insertResult)
    res.body("signup_success")
    res.sendStatus(201)
}

const createUserTmp = async (req, res) => {
    console.log("Entered TMP CREATE USER, this will be deprecated in next version")
    // title is optional
    console.log(req.body)
    if (!req.hasOwnProperty("title")) {
        req.title = ""
    }
    const uDat = {
        uid: req.user.uid, //(assigned from google auth)
        fName: req.body.fName,
        lName: req.body.lName
    }
    console.log(uDat)
    var created = null;
    try {
        await client.connect()
        const users = client.db(process.env.USERDB).collection(process.env.USERCOLLECTION)
        const exists = await users.findOne({uid:uDat.uid}).catch(err => console.log(err))
        if (!exists) {
            const result = await users.insertOne(uDat).catch(err => console.log(err))
            console.log(result)
            created = uDat.uid;
        }
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    } finally {
        await client.close()
        
        if (created) {
            res.body = "signup_success"
            res.sendStatus(201)
        }
    }
    // res.sendStatus(201)
}

const createUser = async (req, res) => {
    // title is optional
    console.log("Creating User")
    if (!req.hasOwnProperty("title")) {
        req.title = ""
    }
    const uDat = {
        role: req.body.role,//(Patient or Medical Provider)
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        middleInitial: req.body.middleInitial,
        email: req.user.email,
        organizations: [],
        uid: req.user.uid, //(assigned from google auth)
        modules: [],
        teams: []
    }
    var created = null;
    try {
        await client.connect()
        const users = client.db(process.env.USERDB).collection(process.env.USERCOLLECTION)
        const exists = await users.findOne({uid:uDat.uid})
        if (!exists) {
            const result = await users.insertOne(uDat)
            console.log(result)
            created = uDat.uid;
        }
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    } finally {
        await client.close()
        if (created) {
            res.body = "signup_success"
            res.sendStatus(201)
        } else {
            res.sendStatus(500)
        }
    }

    // MongoClient.connect(process.env.MONGOURI, async (err, db) => {
    //     if (err) throw err;
    //     var dbo = db.db("user_info_service_db")
    //     const usersCol = dbo.collection("users")
    //     const exists = usersCol.find({ uid: uDat.uid })
    //     const hasnext = await exists.hasNext().catch(err => {
    //         console.log(err)
    //     })
    //     if (hasnext) {
    //         //user object already exists

    //         res.sendStatus(403)
    //     }
    //     else {
    //         const insertResult = dbo.collection("users").insertOne(uDat, (err, res) => {
    //             if (err) throw err;
    //             db.close();
    //         })
    //         res.json(req.user)
    //         console.log('Inserted documents =>', insertResult)
    //         res.body("signup_success")
    //         res.sendStatus(201)
    //     }
    // })
}


const editUser = async (req, res) => {

    valid = ["role", "firstName", "lastName", "middleInitial", "title", "organization"]
    for (prop in req.body) {
        if (!(prop in valid)) {
            console.log("invalid attribute")
            res.sendStatus(403);
            return
        }
    }

    MongoClient.connect(process.env.MONGOURI, async (err, db) => {
        if (err) throw err;
        var dbo = db.db("user_info_service_db")
        const usersCol = dbo.collection("users")
        const exists = usersCol.find({ uid: req.user.uid })
        const hasnext = await exists.hasNext().catch(err => {
            console.log(err)
        })
        if (!hasnext) {
            // no match
            res.sendStatus(403);
        } else {
            await usersCol.updateOne(
                {uid: req.user.uid},
                {$set: req.body}
            ).catch(err => {console.log(err)})
            // nothing to edit
        }
    })
}

const getUserData = async (uid) => {
    var user = null;
    try {
        await client.connect()
        const users = client.db(process.env.USERDB).collection(process.env.USERCOLLECTION)
        const exists = await users.findOne({uid:uid})
        if (!exists) {
            console.log("User does not exist")
        } else {
            user = exists
        }
    } catch (err) {
        console.log(err)
    } finally {
        await client.close()
        return user;
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




module.exports = { signup, createUser, editUser, getMyUserData, createUserTmp }