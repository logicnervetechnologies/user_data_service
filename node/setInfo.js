const { MongoClient } = require('mongodb')
const mongoose = require('mongoose')
//mongodb://user_data_service_dev:VOwsBhCcMaidtMJJ@
const MONGODB_URI = "mongodb://ln.ju3np.mongodb.net/user_info_service_db?authSource=admin";
const MONGODB_USER = "user_data_service_dev";
const MONGODB_PASS = "VOwsBhCcMaidtMJJ";

const authData =  {
    "user": MONGODB_USER,
    "pass": MONGODB_PASS,
    "useNewUrlParser": true,
    "useCreateIndex": true
}; 

//mongo connection
const url = process.env.MONGOURL
const client = new MongoClient(url)

const dbName = process.env.USERDB

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



const info = async (req, res) => {
    const uDat = {
        email:req.user.email,
        uid:req.user.uid
    }
    
    MongoClient.connect(process.env.MONGOURI, async (err, db) => {
        if (err) throw err;
        var dbo = db.db("user_info_service_db")
        const usersCol = dbo.collection("users")
        const exists = usersCol.find({uid:uDat.uid})
        const hasnext = await exists.hasNext().catch(err => {
            console.log(err)
        })
        if (hasnext) {
            //user object already exists
            
            res.sendStatus(403)
        }
        else {
            dbo.collection("users").insertOne(uDat, (err, res)=> {
                if (err) throw err;
                db.close();
                
            })
        res.json(req.user)
    }
    })
    //console.log(req.user)
}

const createUser = async (req, res) => {
    //TODO: Implement creation of user into MongoDB 'users' collection in database: 'user_info_service_db'

}


const editUser = async (req, res) => {
    //TODO: Implement edit of user fields that are not arrays or UID or Email for user in MongoDB 'users' collection in database: 'user_info_service_db'

}



module.exports = { signup, info, createUser, editUser }