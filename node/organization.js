const { MongoClient } = require('mongodb')
const { v4 : uuidv4 } = require('uuid')
require("dotenv").config()
//mongodb://user_data_service_dev:VOwsBhCcMaidtMJJ@

const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true })

const createOrganization = async (req, res) => {
    // const creatorUser = req.user
    const creatorUser = {
        uid:"testuidsins"
    }
    const new_organization = {
        orgName: req.body.orgName,
        orgId: uuidv4(),
        address: req.body.orgAddress,
        alwaysAskAddingProvider: true,
        alwaysAskAddingPatient: true,
        admins: [creatorUser],
        roles: [],
        noRole:[]
    }
    created = null;
    try {
        await client.connect()
        const orgs = client.db(process.env.USERDB).collection(process.env.ORGCOLLECTION)
        await orgs.insertOne(new_organization)
        // TODO add organization ID to user
        created = new_organization.orgId;
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    } finally {
        await client.close()
    }
    res.json({ orgId: created })

    //console.log(req.user)
}

const editOrganizationInfo = (orgId, edit) => {

}


const getOrganizationData = async (orgId) => {
    var organization = null;
    try {
        await client.connect()
        const orgs = client.db(process.env.USERDB).collection(process.env.ORGCOLLECTION)
        const findOrg = await orgs.findOne({ orgId: orgId });
        organization = findOrg;
        console.log(organization)
    } catch (err) {
        console.log(err)
    } finally {
        await client.close()
        
    }
    return organization
}

const getOrganizationInformation = async (req, res) => {
    //Authentication check needs to be implmemented
    const orgId = req.body.orgId;
    const organization = await getOrganizationData(orgId)
    res.json(organization)
}

module.exports = { createOrganization, getOrganizationInformation }
