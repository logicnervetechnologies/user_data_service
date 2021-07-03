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
    // mongoose.connect(
    //     MONGODB_URI, 
    //     authData,
    //     (err) => {
    //         if (!err) { console.log('MongoDB connection succeeded.'); }
    //         else { console.log('Error in MongoDB connection : ' + JSON.stringify(err, undefined, 2)); }
    //     }
    // );
    // var db = mongoose.connection
    // db.on('error', console.error.bind(console, 'connection error:'));
    const uDat = {
        email:req.user.email,
        uid:req.user.uid
    }
    
    MongoClient.connect("mongodb+srv://user_data_service_dev:VOwsBhCcMaidtMJJ@ln.ju3np.mongodb.net/test?authSource=admin", async (err, db) => {
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



module.exports = { signup, info }