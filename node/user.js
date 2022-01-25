const { orgCol, userCol } = require('./resources')
const { acceptInvite, declineInvite } = require("./organization/invitations")
const { notifyUser } = require('./notifications/notifications')
require("dotenv").config()
const { v4 : uuidv4 } = require('uuid')


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
    console.log("TMP check creating user from route")
    const uDat = {
        uid: req.user.uid, //(assigned from google auth)
        fName: req.body.fName,
        lName: req.body.lName,
        organizations:[]
    }
    if (await exists(uDat.uid)) {
        console.log("unauthorized")
        res.sendStatus(401)
    } else {
        await createUser(uDat);
        res.sendStatus(201);
    }
}

const getUserData = async (uid) => {
    let user = await userCol.findOne({uid:uid})
    if (user) return user;
    return null;
}

const exists = async (uid) => {
    let user = await getUserData(uid)
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
    let updated = null;
    try {
        let userDataOrgs = (await getUserData(uid)).organizations
        userDataOrgs.push(orgId)
        await userCol.updateOne({uid:uid}, {$set:{organizations: userDataOrgs}});
    } catch (err) {
        console.error(err)
    }
    return updated;
}
const removeOrganizationFromUser = async (uid, orgId) => {
    console.log(uid)
    try {
        await userCol.updateOne({uid}, {$pull: {organizations: orgId}})
    } catch (err) {
        console.error(err)
        return false
    }
    return true;
}


const deleteNotification = async (uid, nid) => {
    console.log("deleting notification " + nid + " from " + uid);
    try {
        await userCol.updateOne({ uid }, { $pull: { notifications: { nid }} }); //pull from mongo user obj
    } catch (err) {
        console.error(err)
        return false;
    } finally {
        return true;
    }
}

const userAction = async (req, res) => {
    const uid = req.user.uid;
    console.log('uid')
    console.log(uid)
    console.log(req.body.action)
    switch (req.body.action){
        case 'createNotif':
        {
            const notifData = req.body.notifData;
            const notified = await notifyUser(uid, notifData);
            res.send({notified})
            break;
        }
        case 'removeNotif':
        {
            const nid = req.body.nid;
            const removed = await deleteNotification(uid, nid);
            res.send({removed});
            break;
        }
        case 'acceptInvite':
        {
            const {inviteId, orgId} = req.body
            if (await acceptInvite(uid, inviteId, orgId)) res.sendStatus(200)
            else res.sendStatus(403)
            break;
        }
        case 'declineInvite':
        {
            const {inviteId, orgId} = req.body
            if (await declineInvite(uid, inviteId, orgId)) res.sendStatus(200)
            else res.sendStatus(403)
            break;
        }
        default:
            res.sendStatus(400)
    }
}



module.exports = { getMyUserData, createUserTmp, addOrganizationToUser, removeOrganizationFromUser, userAction}
