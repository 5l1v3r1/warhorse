const   warhorse_database = require('./database'),
    warhorse_aws_ec2 = require('./aws/ec2'),
    warhorse_aws_cloudformation = require('./aws/cloudformation'),


stopOperation = (project, db) => {

    Q.fcall(() => {
        return warhorse_database.findEntry("project.name", project, db)
    })
        .then((result) => {
            id = result[0]._id;
            return warhorse_aws_cloudformation.cfStop(id, db)
        })
        .then(() => {
            return warhorse_rancher_route53.removeRoute53(id, domain, db)
        })
        .then(() => {
            return warhorse_database.removeProject(id, domain, db)
        })
        .catch((err) => {
            console.log(err);
        })
        .done(() => {
            console.log('Operation Killed')
        });
}