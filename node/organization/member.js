const { orgCol } = require('../resources')
const {logAction} = require('../log')
/* MEMBER FUNCTIONS */

const getOrganizationData = async (orgId) => {
    const organization = await orgCol.findOne({ orgId })
    return organization
}

const getMembersOfOrganization = async (orgId) => {
    const org = await getOrganizationData(orgId)
    if (org === null) return null;
    console.log('members of organization')
    return org.members 
}
const isMemberOfOrganization = async (orgId, uid) => {
    const members = await getMembersOfOrganization(orgId);
    return members.some((member) => {return member.uid === uid})
}
const getMember = async (orgId, uid) => {
    const members = await (getMembersOfOrganization(orgId))
    return members.find(member => member.uid === uid)
}
const addMemberToOrganization = async (orgId, uid) => {
    if (await isMemberOfOrganization(orgId, uid)) return false;
    await orgCol.updateOne({ orgId }, { $push: { members: {uid,roles:[]} }}, logAction)
    return true
}
const addRoleToMember = async (orgId, uid, role) => {
    const org = await getOrganizationData(orgId)
    for (const [index, member] of org.members.entries()) {
        if (member.uid === uid) {
            // if user is already found, terminate
            if (member.roles.includes(role)) return false
            // this requires a precomputed key, since we need to specify the
            // array, which we do by iterating over indices as well
            await orgCol.updateOne(
                { orgId },
                { $push: {
                    [`members.${index}.roles`]: role
                },
                logAction}
            )
            return true
        }
    }
    return false
}
const removeRoleFromMember = async (orgId, uid, role) => {
    const org = await getOrganizationData(orgId)
    for (const [index, member] of org.members.entries()) {
        if (member.uid === uid) {
            // if user is already found, terminate
            if (!member.roles.includes(role)) return false
            // this requires a precomputed key, since we need to specify the
            // array, which we do by iterating over indices as well
            await orgCol.updateOne(
                { orgId },
                { $pull: {
                    [`members.${index}.roles`]: role
                },
                logAction}
            )
            return true
        }
    }
    return false
}
const removeMemberFromOrganization = async (orgId, uid) => {
    if (!(await isMemberOfOrganization(orgId, uid))) {
        console.log("user not in org")
        return false
    }
    await orgCol.updateOne({ orgId }, { $pull: { members: { uid } } }, logAction);
    return true
}

module.exports = {getMembersOfOrganization, isMemberOfOrganization, getMember, addMemberToOrganization, addRoleToMember, removeRoleFromMember, removeMemberFromOrganization}
