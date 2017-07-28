const   AWS = require('aws-sdk'),
    cfn = require('cfn'),
    Q = require('q'),
    fs = require('fs'),
    request = require('request'),
    _ = require('lodash'),
    warhorse_database = require('../database');



AWS.config.loadFromPath('./config.json');
var route53 = new AWS.Route53();


exports.addDomain = (id, domain, db) => {
    let deferred = Q.defer();

    Q.fcall(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project.settings.aws.route53.domainnames', db);
        })
        .then((current) => {
            return checkDomainExistLocal(current, domain)
        })
        .then(() => {
            return warhorse_database.addtoDatabaseArray(id, 'project.settings.aws.route53.domainnames', {name: domain}, db);
        })
        .then(() => {
            return getExisitingDomains()
        })
        .then((current) => {
            return checkDomainExistRemote(current, domain)
        })
        .then((result) => {
            if (result === true) {
                deferred.resolve();
            } else {
                return addDomain(domain);
            }
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
            deferred.resolve();
        });

    let checkDomainExistLocal = (current, domain) => {
        let deferred = Q.defer();

        if (typeof _.find(current, {'name': domain}) === 'undefined') {
            deferred.resolve();
        } else {
            deferred.reject(new Error("This domain already exist in local database"));
        }
        return deferred.promise;
    };

    let getExisitingDomains = () => {
        let deferred = Q.defer();
        route53.listHostedZones(function(err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                var length = data.HostedZones.length;
                var arr = [];
                for (var i = 0; i < length; i++) {
                    arr.push(data.HostedZones[i].Name)};
                //console.log(arr);
                //console.log(arr[0].Name);
                deferred.resolve(arr);
            }
        });
        return deferred.promise;
    };

    let checkDomainExistRemote = (current, domain) => {
        let deferred = Q.defer();
        var search = domain+'.';

        if (current.includes(search) !== true) {
            deferred.resolve();
        } else {
            deferred.resolve(true);
        }
        return deferred.promise;
    };

    let addDomain = (domain) => {
        let deferred = Q.defer();

        var currentdate = new Date();
        var datetime = "Last Sync: " + currentdate.getDay() + "/"+currentdate.getMonth()
            + "/" + currentdate.getFullYear() + " @ "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":" + currentdate.getSeconds();

        var params = {
            CallerReference: datetime,
            Name: domain,
            HostedZoneConfig: {
                Comment: 'Warhorse added domain',
                PrivateZone: false
            }
        };

        route53.createHostedZone(params, function (err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    return deferred.promise;
};