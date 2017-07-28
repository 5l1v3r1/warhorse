// imports
const   AWS = require('aws-sdk'),
    cfn = require('cfn'),
    Q = require('q'),
    request = require('request'),
    fs = require('fs');


// Load credentials and set region from JSON file


var rancher = require('../../rancher-min.json');
var rancherHost = require('../../rancher-host.json');

exports.getRancherUrl = (awsConfig, id, projectName) => {
    let deferred = Q.defer();

    var config = new AWS.Config({
        accessKeyId: awsConfig.awsAccessKeyId, secretAccessKey: awsConfig.awsSecretAccessKey, region: awsConfig.region
    });

    var cloudformation = new AWS.CloudFormation(config);

    Q.fcall(() => {
        return getUrl(projectName)
        })
        .then((result) => {
            url = result;
        })
        .then(function () {
            return setRancherUrlInDatabase(id, url)
        })
        .then((result) => {
            deferred.resolve(result)
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
        });


    let getUrl = (projectName) => {
        let deferred = Q.defer();

        var params = {
            StackName: 'rancher-'+projectName
        };

        cloudformation.describeStacks(params, function(err, data) {
            if (err) {
                deferred.reject(err);  // an error occurred
            } else {
                var result = [];
                getOutputValue(data, "OutputValue");

                function getOutputValue(obj, name) {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            if ("object" == typeof(obj[key])) {
                                getOutputValue(obj[key], name);
                            } else if (key == name) {
                                result.push(obj[key]);
                            }
                        }
                    }
                }
                var url = result.join(", ");
                deferred.resolve(url);
            }
        });
        return deferred.promise;
    };

    let setRancherUrlInDatabase = (id, url) => {
        let deferred = Q.defer();
        db.update({ _id: id }, { $set: {"project.settings.rancher.rancherUrl": url }}, {}, function (err, updates) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(url);
            }
        });
        return deferred.promise;
    };

    return deferred.promise;
};

exports.cfRancher = (awsConfig, projectName) => {
    let deferred = Q.defer();

    var config = new AWS.Config({
        accessKeyId: awsConfig.awsAccessKeyId, secretAccessKey: awsConfig.awsSecretAccessKey, region: awsConfig.region
    });

    var cloudformation = new AWS.CloudFormation(config);

    cfn('rancher-'+projectName, './rancher-min.json')
        .then(function(){
            deferred.resolve();
        });
    return deferred.promise;
};

exports.cfRancherHost = (awsConfig, projectName) => {
    let deferred = Q.defer();

    var config = new AWS.Config({
        accessKeyId: awsConfig.awsAccessKeyId, secretAccessKey: awsConfig.awsSecretAccessKey, region: awsConfig.region
    });

    var cloudformation = new AWS.CloudFormation(config);

    cfn('rancher-host-'+projectName, './rancher-host.json')
        .then(function(){
            deferred.resolve();
        });
    return deferred.promise;
};

// Modify CloudFormation Rancher File
exports.modCfRancherHost = (id, db) => {
    let deferred = Q.defer();

    let writeFile = (id, db) => {
        db.findOne({_id: id }, function (err, docs) {
            if (err) {
                deferred.reject(err);
            } else {
                rancherHost.Parameters.KeyName.Default = docs.project.settings.aws.ec2.sshKey.name;
                rancherHost.Parameters.VpcId.Default = docs.project.settings.aws.ec2.VpcId;
                rancherHost.Parameters.PublicSubnets.Default = docs.project.settings.aws.ec2.VpcSubnet;
                rancherHost.Parameters.RancherServerURL.Default = docs.project.settings.rancher.regUrl;

                var update = JSON.stringify(rancherHost, undefined, 4);

                try {
                    fs.writeFileSync('./rancher-host.json', update);
                } catch (err) {
                    console.log('Error writing Metadata.json:' + err.message);
                    deferred.reject(err);
                }
                deferred.resolve();
            }
        });
        return deferred.promise;
    };


    Q.fcall(function () {
        return writeFile(id, db)
    })
        .then(deferred.resolve())
        .catch((err) => {
            console.log(err);
        })
        .done(() => {
        });

    return deferred.promise;
};


exports.modCfRancher = (id, db) => {
    let deferred = Q.defer();

    let writeFile = (id, db) => {
        db.findOne({_id: id }, function (err, docs) {
            if (err) {
                deferred.reject(err);
            } else {
                rancher.Parameters.KeyName.Default = docs.project.settings.aws.ec2.sshKey.name;
                rancher.Parameters.VpcId.Default = docs.project.settings.aws.ec2.VpcId;
                rancher.Parameters.PublicSubnets.Default = docs.project.settings.aws.ec2.VpcSubnet;

                var update = JSON.stringify(rancher, undefined, 4);

                try {
                    fs.writeFileSync('./rancher-min.json', update);
                } catch (err) {
                    console.log('Error writing Metadata.json:' + err.message);
                    deferred.reject(err);
                }
                deferred.resolve();
            }
        });
        return deferred.promise;
    };


    Q.fcall(function () {
            return writeFile(id, db)
        })
        .then(deferred.resolve())
        .catch((err) => {
            console.log(err);
        })
        .done(() => {
        });

    return deferred.promise;
};

