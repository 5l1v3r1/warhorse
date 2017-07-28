// imports
const   AWS = require('aws-sdk'),
    cfn = require('cfn'),
    Q = require('q'),
    _ = require('lodash'),
    warhorse_database = require('../database');


exports.getSshKey = (awsConfig, keyName, id, db) => {
    let deferred = Q.defer();

    var config = new AWS.Config({
        accessKeyId: awsConfig.awsAccessKeyId, secretAccessKey: awsConfig.awsSecretAccessKey, region: awsConfig.region
    });

    var ec2 = new AWS.EC2(config);

    Q.fcall(function () {
        return warhorse_database.updateDatabaseEntry(id, "project.settings.aws.ec2.sshKey.name", keyName, db)
    })
        .then(function () {
            return createSshKey(keyName)
        })
        .then((result) => {
            privateKey = result
        })
        .then(function () {
            return warhorse_database.updateDatabaseEntry(id, "project.settings.aws.ec2.sshKey.privateKey", privateKey, db)
        })
        .catch((err) => {
            console.log(err);
        })
        .done(() => {
            deferred.resolve()
        });


    let createSshKey = (keyName) => {
        let deferred = Q.defer();
        let params = {
            KeyName: keyName
        };
        ec2.createKeyPair(params, function (err, data) {
            if (err) {
                //console.log("Error", err);
                deferred.reject(err);
            } else {
                let result = data.KeyMaterial;
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    };

    return deferred.promise;
};




exports.getVpcId = (awsConfig, id, db) => {
        let deferred = Q.defer();

        var config = new AWS.Config({
        accessKeyId: awsConfig.awsAccessKeyId, secretAccessKey: awsConfig.awsSecretAccessKey, region: awsConfig.region
        });

        var ec2 = new AWS.EC2(config);

        ec2.describeVpcs(function (err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                let reply = data.Vpcs[0].VpcId;
                db.update({ _id: id }, { $set: {"project.settings.aws.ec2.VpcId": reply}}, {}, function (err, numReplaced) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(numReplaced);
                    }
                });
            }
        });
    return deferred.promise;
};

exports.getSubnetId = (awsConfig, id, db) => {
    let deferred = Q.defer();

    var config = new AWS.Config({
        accessKeyId: awsConfig.awsAccessKeyId, secretAccessKey: awsConfig.awsSecretAccessKey, region: awsConfig.region
    });

    var ec2 = new AWS.EC2(config);

    let getVpcFromDatabase = () => {
        let deferred = Q.defer();
        db.findOne({_id: id }, function (err, docs) {
            if (err) {
                deferred.reject(err);
            } else {
                vpc = docs.project.settings.aws.ec2.VpcId;
                deferred.resolve(vpc);
            }
        });
        return deferred.promise;
    };

    let getVpcSubnet = (vpc) => {

        let deferred = Q.defer();

        var params ={
            Filters: [
                {
                    Name: "vpc-id",
                    Values: [
                        vpc
                    ]
                }
            ]
        };

        ec2.describeSubnets(params, function(err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                var length = data.Subnets.length;
                var arr = [];
                for (var i = 0; i < length; i++) {
                    arr.push(data.Subnets[i].SubnetId)};
                var clean = arr.toString();
                deferred.resolve(clean);
            }
        });
        return deferred.promise;
    };

    let updateVpcSubnet = (clean) => {
        let deferred = Q.defer();
        db.update({ _id: id }, { $set: {"project.settings.aws.ec2.VpcSubnet": clean }}, {}, function (err, updates) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(updates);
            }
        });
        return deferred.promise;
    };


    Q.fcall(getVpcFromDatabase)
        .then((result) => {
            vpc = result
        })
        .then(function () {
            return getVpcSubnet(vpc)
        })
        .then((result) => {
            clean = result
        })
        .then(function () {
            return updateVpcSubnet(clean)
        })
        .catch((err) => {
            console.log(err);
        })
        .done(() => {
            deferred.resolve()
        });

    return deferred.promise;
};