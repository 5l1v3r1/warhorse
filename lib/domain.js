const   warhorse_database = require('./database'),
    warhorse_aws_route53 = require('./aws/route53'),
    warhorse_rancher_route53 = require('./rancher/route53'),
    Q = require('q');


exports.addDomain = (project, domain) => {

    var id = '';

    Q.fcall(() => {
        return warhorse_database.findEntry("project.name", project, db)
        })
        .then((result) => {
            id = result[0]._id;
        return warhorse_aws_route53.addDomain(id, domain, db)
        })
        .then(() => {
            return warhorse_rancher_route53.startRoute53(id, domain, db)
        })
        .catch((err) => {
            console.log(err);
        })
        .done(() => {
            console.log('Domain Added')
        });

};