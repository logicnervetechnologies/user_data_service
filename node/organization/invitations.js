const { v4 : uuidv4 } = require('uuid')
const { addUserToOrganization } = require('./orgUser')
const { orgCol, userCol } = require('../resources') 
const { notifyUser, notifyOrganization} = require('../notifications/notifications')
const {logAction} = require('../log')
require("dotenv").config()

const getOrganizationData = async (orgId) => {
    const organization = await orgCol.findOne({ orgId })
    return organization
}

// create invitation for user to join an organization, return 1 if created, 2 if user already invited, -1 if creation failed
const createInvite = async (creatorUid, inviteeUid, orgId) => {
    console.log("Create INvite invoked")
    // check if invitation for user exists for user already
    const org = await getOrganizationData(orgId, orgCol)
    const alreadyInvited = org.invitations.some((invite) => invite.inviteeUid === inviteeUid)
    if (alreadyInvited) {
        console.log("user already invited")
        return 2
    }
    // create invitation object
    const inviteId = uuidv4()
    const invitation = {
        inviteId: inviteId,
        orgId,
        status: 0, // status codes: 0: no response yet, -1: revoked, 1: accepted, 2: decline
        creatorUid,
        inviteeUid,
        creationDate: Date.now()
    }
    // add invite to organization object
   await orgCol.updateOne(
        { orgId },
        { $push: { invitations: invitation },
        logAction}
    )
    // add inviteid to user object
    await addInviteIdToUser(inviteeUid, inviteId, orgId);
    // notify invitee of invite
    await notifyUser(inviteeUid, `You have been invited to join ${org.orgName}`, `HANDLE_INVITE_LINK_GOES_HERE`)
    return 1;

} // createInvite()

/* Check if an invitation is valid -- to be called before any actions besides create */
const validInvite = async (inviteeUid, inviteId, orgId) => {
    // check if invite exists
    const org = await getOrganizationData(orgId, orgCol)
    if (!org.invitations.some(invite, invite.inviteId === inviteId)) {
        return false
    }

    return true
} // validInvite()

/* Accept an invitation and add the user to the organziation, return true if successful else false*/
const acceptInvite = async (inviteeUid, inviteId, orgId) => {
    // validate invite
    if (!(await validInvite(inviteeUid, inviteId, orgId, orgCol))) {
        console.log("invitation not valid")
        return false
    }

    // change invite status to 1
    const query = { 
        orgId: orgId, 
        "invitations.inviteId": inviteId
    };

    await orgCol.updateOne(query, { $set: { "invitations.$.status": 1 } }, logAction)
    // add user to organization (no role?)
    await addUserToOrganization(orgId, null, inviteeUid)
    // notify organization of accepted user
    await notifyOrganization(orgId, orgCol, "Invitation " + inviteId + " accepted")
    await removeInviteIdFromUser(inviteeUid, inviteId);
    
    return true
} // acceptInvite()

/* Decline an invitation to join organization and notify organiztion of declination,
 return true if successful else false */
const declineInvite = async (inviteeUid, inviteId, orgId) => {
    // validate invite
    if (!(await validInvite(inviteeUid, inviteId, orgId, orgCol))) {
        console.log("invitation not valid")
        return false
    }

    // Change invite status to 2
    const query = { 
        orgId: orgId, 
        "invitations.inviteId": inviteId
    };

    await orgCol.updateOne(query, { $set: { "invitations.$.status": 2 } }, logAction)

    // notify organization admins
    await notifyOrganization(orgId, orgCol, "Invitation " + inviteId + " declined")

    return true
} // declineInvite()

/* Revoke an invite for user joining org */
const revokeInvite = async (inviteeUid, inviteId, orgId) => {
    // validate invite
    if (!(await validInvite(inviteeUid, inviteId, orgId, orgCol))) {
        console.log("invitation not valid")
        return false
    }

    // change invite status to -1
    const query = { 
        orgId: orgId, 
        "invitations.inviteId": inviteId
    };

    await orgCol.updateOne(query, { $set: { "invitations.$.status": -1 } }, logAction)
    return true
} // revokeInvite()

/* delete invitation record from organization */
const deleteInvite = async (inviteeUid, inviteId, orgId) => {
    // validate invite
    if (!(await validInvite(inviteeUid, inviteId, orgId, orgCol))) {
        console.log("invitation not valid")
        return false
    }

    // delete invitation record from organization
    await orgCol.updateOne({ orgId }, { $pull: { invitations: { inviteId }} }, logAction)

    // notify organization of deletion of invite
    await notifyOrganization(orgId, orgCol, "Invitation " + inviteId + " deleted")
    return true

} // deleteInvite()


const addInviteIdToUser = async (uid, inviteId, orgId) => {
    try {
        await userCol.updateOne({ uid }, { $push: { invitations: {inviteId, orgId}} }); //push to mongo user obj
    } catch (err) {
        console.error(err)
        return false;
    } finally {
        return true;
    }
}
const removeInviteIdFromUser = async (uid, inviteId) => {
    try {
        await userCol.updateOne({ uid }, { $pull: { invitations: {inviteId} } }); //pull from mongo user obj
    } catch (err) {
        console.error(err)
        return false;
    } finally {
        return true;
    }
}

module.exports = {createInvite, acceptInvite, declineInvite, revokeInvite, deleteInvite}