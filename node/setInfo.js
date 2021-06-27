const { MongoClient } = require('mongodb')

//mongo connection
const url = process.env.MONGOURL
const client = new MongoClient(url)

const dbName = process.env.USERDB

const signup = (req, res) => {
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



export { signup }