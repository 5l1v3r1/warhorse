const   warhorse_database = require('./database'),
        warhorse_aws_ec2 = require('./aws/ec2'),
        warhorse_aws_cloudformation = require('./aws/cloudformation'),
        warhorse_rancher_setup = require('./rancher/setup'),
        warhorse_domain = require('./domain'),
        warhorse_rancher_letsencrypt = require('./rancher/letsencrypt'),
        Q = require('q'),
        rancher_cat_efs = require('./rancher/efs');


exports.runLaunch = (project, awsConfig, domain, email) => {

    var id = '';
    var keyName = 'warhorse-'+project;
    var url = '';

    Q.fcall(() => {
        return warhorse_database.buildDatabase(awsConfig, project, db)
    })
        .then((result) => {
            id = result;
            return warhorse_aws_ec2.getVpcId(awsConfig, id, db)
        })
        .then(() => {
            console.log("Got VPC ID");
            return warhorse_aws_ec2.getSubnetId(awsConfig, id, db)
        })
        .then(() => {
            console.log("Got Subnet ID");
            return warhorse_aws_ec2.getSshKey(awsConfig, keyName, id, db)
        })
        .delay(2000)
        .then(() => {
            console.log("Set SSH Key");
            return warhorse_aws_cloudformation.modCfRancher(id, db)
        })
        .then((result) => {
            console.log("CloudFormation file updated")
        })
        .then(() => {
            return warhorse_aws_cloudformation.cfRancher(awsConfig, project)
        })
        .then((result) => {
            console.log("Cloud Formation Done")
        })
        .then(() => {
            return warhorse_aws_cloudformation.getRancherUrl(awsConfig, id, project)
        })
        .then((result) => {
            url = result;
            return warhorse_rancher_setup.checkRancherUrl(result)
        })
        .then(() => {
            console.log("Rancher Server is online");
        })
        .then(function () {
            return warhorse_rancher_setup.getRancherApiKey(url, id, db)
        })
        .then((result) => {
            console.log('Got Rancher API Keys');
        })
        .then(() => {
            return warhorse_rancher_setup.enableRancherAuth(url, id, db)
        })
        .then((result) => {
            console.log("Rancher Auth Enabled");
        })
        .then(function () {
            return warhorse_rancher_setup.getRancherProjectId(url, id, db)
        })
        .then((result) => {
            console.log('Got Project ID');
        })
        .then(function () {
            return warhorse_rancher_setup.enableRancherRegkey(url, id, db)
        })
        .then((result) => {
            console.log("Rancher Regkey Enabled");
        })
        .then(function () {
            return warhorse_rancher_setup.getRancherRegUrl(url, id, db)
        })
        .then((result) => {
            console.log("Rancher Reg URL Enabled");
        })
        .then(function () {
            return warhorse_rancher_setup.enableWarhorseCatalog(url, id, db)
        })
        .then((result) => {
            console.log("Warhorse Catalog enabled");
        })
        .then(function () {
            return warhorse_aws_cloudformation.modCfRancherHost(id, db)
        })
        .then((result) => {
            console.log("CloudFormation file updated");
        })
        .then(function () {
            return warhorse_aws_cloudformation.cfRancherHost(awsConfig, project)
        })
        .then((result) => {
            console.log("Rancher Host Built");
        })
        .then(function () {
            return warhorse_rancher_setup.checkRancherHost(url, id, db)
        })
        .then(() => {
            return rancher_cat_efs.startEfs(url, id, db)
        })
        .then(() => {
            console.log("Rancher start EFS");
            return warhorse_domain.addDomain(project, domain)
        })
        .then(() => {
            console.log("Domain Added");
            return warhorse_rancher_letsencrypt.startLetsencrypt(url, id, db, email, domain)
        })
        .then(() => {
            console.log("Rancher start Letsencrypt");
        })
        .then(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project', db)
        })
        .then((result) => {
            console.log("Rancher URL: "+result.settings.rancher.rancherUrl);
            console.log("Rancher User: "+result.settings.rancher.rancherAdminUser);
            console.log("Rancher Password: "+result.settings.rancher.rancherAdminPassword);
        })
        .catch((err) => {
            console.log(err);
        })
        .done(() => {
            console.log('LAUNCH COMPLETE')

        });
};


