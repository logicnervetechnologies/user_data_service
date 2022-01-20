const { v4 : uuidv4 } = require('uuid')
const { getOrganizationData, addUserToOrganization } = require('./protected')
const { addInviteIdToUser, removeInviteIdFromUser, notifyUser } = require('../user')
require("dotenv").config()


// create invitation for user to join an organization, return 1 if created, 2 if user already invited, -1 if creation failed
const createInvite = async (creatorUid, inviteeUid, orgId, orgCol, logAction) => {
    // check if invitation for user exists for user already
    const org = getOrganizationData(orgId)
    const alreadyInvited = org.invitations.some(invite, invite.inviteeUid === inviteeUid)
    if (alreadyInvited) {
        console.log("user already invited")
        return 2
    }
    // create invitation object
    const invitation = {
        inviteId: uuidv4(),
        orgId,
        status: 0, // status codes: 0: no response yet, -1: revoked, 1: accepted, 2: decline
        creatorUid,
        inviteeUid,
        creationDate: Date.now()
    }
    // add invite to organization object
    orgCol.updateOne(
        { orgId },
        { $push: { invites: invitation },
        logAction}
    )
    // add inviteid to user object
    addInviteIdToUser(inviteeId, invitation.inviteId, orgId);
    // notify invitee of invite
    notifyUser(inviteeUid, `You have been invited to join ${org.orgName}`, `HANDLE_INVITE_LINK_GOES_HERE`)
    return 1;

} // createInvite()

/* Check if an invitation is valid -- to be called before any actions besides create */
const validInvite = (inviteeUid, inviteId, orgId) => {
    // check if invite exists
    const org = getOrganizationData(orgId)
    if (!org.invitations.some(invite, invite.inviteId === inviteId)) {
        return false
    }

    return true
} // validInvite()

/* Accept an invitation and add the user to the organziation, return true if successful else false*/
const acceptInvite = (inviteeUid, inviteId, orgId, orgCol) => {
    // validate invite
    if (!validInvite(inviteeUid, orgId, inviteId)) {
        console.log("invitation not valid")
        return false
    }

    // change invite status to 1
    const query = { 
        orgId: orgId, 
        "invites.inviteId": inviteId
    };

    orgCol.updateOne(query, { $set: { "invites.$.status": 1 } }, logAction)

    // add user to organization (no role?)
    addUserToOrganization(orgId, null, inviteeUid)
    
    // notify organization of accepted user
    notifyOrganization(orgId, orgCol, "Invitation " + inviteId + " accepted")
    
    return true
} // acceptInvite()

/* Decline an invitation to join organization and notify organiztion of declination,
 return true if successful else false */
const declineInvite = (inviteeUid, inviteId, orgId, orgCol) => {
    // validate invite
    if (!validInvite(inviteeUid, orgId, inviteId)) {
        console.log("invitation not valid")
        return false
    }

    // Change invite status to 2
    const query = { 
        orgId: orgId, 
        "invites.inviteId": inviteId
    };

    orgCol.updateOne(query, { $set: { "invites.$.status": 2 } }, logAction)

    // notify organization admins
    notifyOrganization(orgId, orgCol, "Invitation " + inviteId + " declined")

    return true
} // declineInvite()

/* Revoke an invite for user joining org */
const revokeInvite = (inviteeUid, inviteId, orgId, orgCol) => {
    // validate invite
    if (!validInvite(inviteeUid, orgId, inviteId)) {
        console.log("invitation not valid")
        return false
    }

    // change invite status to -1
    const query = { 
        orgId: orgId, 
        "invites.inviteId": inviteId
    };

    orgCol.updateOne(query, { $set: { "invites.$.status": -1 } }, logAction)
} // revokeInvite()

/* delete invitation record from organization */
const deleteInvite = (inviteeUid, inviteId, orgId, orgCol) => {
    // validate invite
    if (!validInvite(inviteeUid, orgId, inviteId)) {
        console.log("invitation not valid")
        return false
    }

    // delete invitation record from organization
    orgCol.updateOne({ orgId }, { $pull: { invitations: { inviteId }} }, logAction)

    // notify organization of deletion of invite
    notifyOrganization(orgId, orgCol, "Invitation " + inviteId + " deleted")

} // deleteInvite()

/* temporary placement */
const notifyOrganization = async (orgId, orgCol, notifData, notifHyperlink = null) => {
    // create notification object
    console.log("notifying " + orgId);
    newNotif = {
        notifData,
        notifHyperlink,
        nid: uuidv4(),
        date: Date()
    };
    try {
        await orgCol.updateOne({ orgId }, { $push: { notifications: newNotif} }); //push to mongo organization obj
    } catch (err) {
        console.error(err)
        return false;
    } finally {
        return true;
    }
}

module.exports = {createInvite, acceptInvite, declineInvite, revokeInvite, deleteInvite}