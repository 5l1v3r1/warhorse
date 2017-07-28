const     Q = require('q');



exports.buildDatabase = (awsConfig, project, db) => {
    let deferred = Q.defer();

    let Database = () => {

        var prefs = {
            project: {
                name: null,
                settings: {
                    aws: {
                        region: awsConfig.region,
                        awsCredentals: {
                            awsAccessKeyId: awsConfig.awsAccessKeyId,
                            awsSecretAccessKey: awsConfig.awsSecretAccessKey,
                        },
                        ec2: {
                            sshKey: {
                                name: '',
                                publicKey: '',
                                privateKey: '',
                            },
                            VpcId: '',
                            VpcSubnet: '',
                        },
                        route53: {
                            domainnames: []
                        },
                        cloudformation: {},
                    },
                    rancher: {}
                }
            }
        };

        db.insert(prefs, function (err, newDoc) {
            if (err) {
                //console.log("Error", err);
                deferred.reject(err);
            } else {
                deferred.resolve(newDoc._id);
            }
        });
        return deferred.promise;
    };

    let addname = (id, project) => {
        db.update({ _id: id }, { $set: {"project.name": project}}, {}, function (err, numReplaced) {
            if (err) {
                //console.log("Error", err);
                deferred.reject(err);
            } else {
                deferred.resolve(numReplaced);
            }
        });
        return deferred.promise;
    };

    var id;

    Q.fcall(Database)
        .then((result) =>{
            id = result;
        })
        .then(function () {
            return addname(id, project)
        })
        .catch((err) => {
            console.log(err);
        })
        .done(() => {
            deferred.resolve()
        });

    return deferred.promise;
};


exports.getDatabaseEntry = (id, entry, db) => {
        let deferred = Q.defer();

        db.findOne({_id: id }, function (err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                var result = eval(entry);

                deferred.resolve(result);
            }
        });
        return deferred.promise;
    };

exports.updateDatabaseEntry = (id, record, value, db) => {
    let deferred = Q.defer();

    db.update({ _id: id }, { $set: { [record] : value }}, function (err, updates) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(updates);
        }
    });
    return deferred.promise;
};

exports.addtoDatabaseArray = (id, record, value, db) => {
    let deferred = Q.defer();

    db.update({ _id: id }, { $push: { [record] : value }}, function (err, updates) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(updates);
        }
    });
    return deferred.promise;
};

exports.findEntry = (record, value, db) => {

    let deferred = Q.defer();

    db.find( { [record] : value }, function (err, data) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(data);
        }
    });
    return deferred.promise;
};

exports.removeProject = (id, entry, db) => {
    let deferred = Q.defer();

    db.findOne({_id: id }, function (err, data) {
        if (err) {
            deferred.reject(err);
        } else {
            var result = eval(entry);

            deferred.resolve(result);
        }
    });
    return deferred.promise;
};




