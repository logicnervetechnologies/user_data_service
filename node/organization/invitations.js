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
        accepted: false,
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

const acceptInvite = (inviteeUid, orgId, inviteId) => {

} // acceptInvite()
const declineInvite = (inviteeUid, orgId, inviteId) => {

} // declineInvite()
const revokeInvite = (inviteeUid, orgId, inviteId) => {

} // revokeInvite()
const deleteInvite = (inviteeUid, orgId, inviteId) => {

} // deleteInvite()

module.exports = {createInvite, acceptInvite, declineInvite, revokeInvite, deleteInvite}