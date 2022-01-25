/* user organization functions */
const {isMemberOfOrganization, getMember,
    addMemberToOrganization, addRoleToMember,
    removeMemberFromOrganization} = require('./member')
const {isRole, addMemberToRole, removeMemberFromRole} = require('./role')
// add a user to a organization as a memeber, admin action
const { orgCol, userCol } = require('../resources')


const getUserData = async (uid) => {
    let user = await userCol.findOne({uid:uid})
    if (user) return user;
    return null;
}

const getOrganizationData = async (orgId) => {
    const organization = await orgCol.findOne({ orgId })
    return organization
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


const addUserToOrganization = async (orgId, role, userUid) => {
    console.log("Adding User to Organization")
    // check if org exists
    const org = await getOrganizationData(orgId)
    if (org === null) return false
    // if member already return false
    if (await isMemberOfOrganization(orgId, userUid)) return false
    // add user to organization memebers
    await addMemberToOrganization(orgId, userUid)
    await addOrganizationToUser(userUid, orgId)
    // role is empty or null -> no role
    if (!role) {
        return true
    }
     // add role to user and put user in role arr
    if (!(await isRole(orgId, role))) return false
    await addRoleToMember(orgId, uid, role)
    await addMemberToRole(orgId, uid, role)
    return true
}

// remove the user from the organization, admin action
const removeUserFromOrganization = async (orgId, userUid) => {
    // check org exists
    const org = await getOrganizationData(orgId);
    if (org === null) return false
    // if not member of org return false
    const member = await getMember(orgId, userUid)
    if (!member) return false
    // if user is admin or owner, return false
    if (org.admins.includes(userUid) || org.owner.includes(userUid)) return false;
    // for all roles user is in, remove him/her from role
    member.roles.forEach(async (role) => {
        await removeMemberFromRole(orgId, userUid, role)
    })
    // remove organization from user and pull user from organization
    if ((await removeOrganizationFromUser(userUid, orgId)) && (await removeMemberFromOrganization(orgId, userUid))) return true
    return false
}
module.exports = { addUserToOrganization, removeUserFromOrganization }