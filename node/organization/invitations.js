const { v4 : uuidv4 } = require('uuid')
const { getOrganizationData } = require('./protected')
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
const validInvite = (inviteeUid, orgId, inviteId) => {
    // check if invite exists
    return false
}

/* Accept an invitation and add the user to the organziation, return true if successful else false*/
const acceptInvite = (inviteeUid, orgId, inviteId) => {
    // change invite status to 1
    // notify organization of accepted user
    return false
} // acceptInvite()

/* Decline an invitation to join organization and notify organiztion of declination,
 return true if successful else false */
const declineInvite = (inviteeUid, orgId, inviteId) => {
    // Change invite status to 2
    // notify organization admins
    return false
} // declineInvite()

/* Revoke an invite for user joining org */
const revokeInvite = (inviteeUid, orgId, inviteId) => {
    // change invite status to -1
} // revokeInvite()

/* delete invitation record from organization */
const deleteInvite = (inviteeUid, orgId, inviteId) => {
    // delete invitation record from organization
    // notify organization of deletion of invite
} // deleteInvite()

module.exports = {createInvite, acceptInvite, declineInvite, revokeInvite, deleteInvite}