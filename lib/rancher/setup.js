const   AWS = require('aws-sdk'),
    cfn = require('cfn'),
    Q = require('q'),
    generator = require('generate-password'),
    fs = require('fs'),
    request = require('request'),
    _ = require('lodash'),
    warhorse_database = require('../database');

AWS.config.loadFromPath('./config.json');


exports.getRancherApiKey = (url, id, db) => {
    let deferred = Q.defer();

    Q.fcall(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project.settings.rancher', db)
        })
        .then ((keys) => {
            return getKeys(url, keys)
        })
        .then((keys) => {
            return writeApiKeyDatabase(id, keys)
        })
        .then((result) => {
            deferred.resolve(result)
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
        });

    let writeApiKeyDatabase = (id, keys) => {
        let deferred = Q.defer();

        db.update({ _id: id }, { $set: {"project.settings.rancher.rancherPublicKey": keys.public, "project.settings.rancher.rancherSecretKey": keys.secret}}, {}, function (err, updates) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(keys);
            }
        });
        return deferred.promise;
    };

    let getKeys = (url, keys) => {
        let deferred = Q.defer();

        var auth_data = {
            "accountId": "1a1",
            "description": null,
            "name": "warhorse"
        };

        var authOptions = {
            url: url+'/v2-beta/apikeys',
            method: 'post',
            body: auth_data,
            json: true,
            headers: {
                Authorization: 'Basic ' + new Buffer(keys.rancherPublicKey + ':' + keys.rancherSecretKey).toString('base64')
            }
        };

        request(authOptions, function (err, body) {
            if (err) {
                deferred.reject(err);
            } else {
                var apiKey = {
                    public: body.body.publicValue,
                    secret: body.body.secretValue
                };
                deferred.resolve(apiKey);
            }
        });
        return deferred.promise;
    };
    return deferred.promise;
};


exports.enableRancherAuth = (url, id, db) => {
    let deferred = Q.defer();

    Q.fcall(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project.settings.rancher', db)
    })
        .then((keys) => {
            return enableAuth(url, keys)
        })
        .then((result) => {
            login = result;
            return writeRancherAuthDatabase(id, login)
        })
        .then((result) => {
        deferred.resolve(result)
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
        });


    let writeRancherAuthDatabase = (id, login) => {
        let deferred = Q.defer();

        db.update({ _id: id }, { $set: {"project.settings.rancher.rancherAdminUser": login.username, "project.settings.rancher.rancherAdminPassword": login.password}}, {}, function (err, updates) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(updates);
            }
        });
        return deferred.promise;
    };


    let enableAuth = (url, keys) => {

        let deferred = Q.defer();

        var password = generator.generate({
            length: 10,
            numbers: true
        });

        var auth_data = {
            "id": null,
            "type": "localAuthConfig",
            "baseType": "localAuthConfig",
            "accessMode": "unrestricted",
            "enabled": true,
            "name": "",
            "password": password,
            "username": 'warhorse'
        };

        var authOptions = {
            url: url+'/v2-beta/localauthconfig',
            method: 'post',
            body: auth_data,
            json: true,
            headers: {
                Authorization: 'Basic ' + new Buffer(keys.rancherPublicKey + ':' + keys.rancherSecretKey).toString('base64')
            }
        };

        request(authOptions, function (err, body) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(body.body);
            }
        });
        return deferred.promise;
    };

    return deferred.promise;
};


exports.getRancherRegUrl = (url, id, db) => {
    let deferred = Q.defer();

    Q.fcall(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project.settings.rancher', db)
    })
        .then((keys) => {
            return getRegUrl(url, keys)
        })
        .then((result) => {
            rancher = result;
            return writeRancherRegUrlDatabase(id, rancher)
        })
        .then((result) => {
            deferred.resolve(result)
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
        });

    let writeRancherRegUrlDatabase = (id, rancher) => {
        let deferred = Q.defer();

        db.update({ _id: id }, { $set: {"project.settings.rancher.regUrl": rancher}}, {}, function (err, updates) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(updates);
            }
        });
        return deferred.promise;
    };

    let getRegUrl = (url, keys) => {
        let deferred = Q.defer();

        var authOptions = {
            url: url+'/v1/registrationtokens',
            method: 'GET',
            json: true,
            headers: {
                Authorization: 'Basic ' + new Buffer(keys.rancherPublicKey + ':' + keys.rancherSecretKey).toString('base64')
            }
        };

        request(authOptions, function (err, body) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(body.body.data[0].registrationUrl);
            }
        });
        return deferred.promise;
    };
    return deferred.promise;
};

exports.checkRancherHost = (url, id, db) => {

    let deferred = Q.defer();

    Q.fcall(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project.settings.rancher', db)
    })
        .then((keys) => {
        return RepeatUntilSuccess(checkUrl(url, keys), 50000)
        })
        .then((result) => {
            console.log('online!!');
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
            deferred.resolve();
        });


    let checkUrl = (url, keys) => {

        return () => {
            let deferred = Q.defer();

            var authOptions = {
                url: url + '/v1/hosts',
                method: 'GET',
                json: true,
                headers: {
                    Authorization: 'Basic ' + new Buffer(keys.rancherPublicKey + ':' + keys.rancherSecretKey).toString('base64')
                    }
                };

            request(authOptions, function (err, body) {
                if (err) {
                    deferred.reject(err);
                } else {
                    if (typeof body.body.data[0] !== 'undefined') {
                        console.log("we have a host");
                        deferred.resolve();
                    } else {
                        console.log("No Host added");
                        deferred.reject(new Error("No Host added"));
                    }
                }
            });
            return deferred.promise;
        }
    };
    return deferred.promise;
};



function RepeatUntilSuccess(operation, timeout) {
    var deferred = Q.defer();
    operation().then(function success(value) {
        deferred.resolve(value);
    }, function error(reason) {
        Q.delay(timeout).done(function() {

            RepeatUntilSuccess(operation, timeout).done(function(value) {
                deferred.resolve(value);
            });
        });
    });
    return deferred.promise;
}


exports.checkRancherUrl = (url) => {
    let deferred = Q.defer();

    Q.fcall(() => {
        return RepeatUntilSuccess(checkUrl(url), 50000)
    })
        .then((result) => {
            console.log('online!!');
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
            deferred.resolve();
        });


    let checkUrl = (url) => {

        return () => {
            let deferred = Q.defer();

            //console.log(url);

            var authOptions = {
                url: url + '/v1',
                method: 'GET',
                json: true,
                headers: {}
            };

            request(authOptions, function (err, body) {
                if (err) {
                    console.log("Rancher URL Down");
                    deferred.reject(new Error("Rancher URL is down"));
                } else {
                    if (typeof body.body.id !== 'undefined') {
                        console.log("we have a URL");
                        deferred.resolve();
                    } else {
                        console.log("Rancher URL Down");
                        deferred.reject(new Error("Rancher URL is down"));
                    }
                }
            });
            return deferred.promise;
        };
    };
    return deferred.promise;
};



exports.getRancherProjectId = (url, id, db) => {
    let deferred = Q.defer();

    Q.fcall(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project.settings.rancher', db)
        })
        .then((keys) => {
            return projectId(url, keys)
        })
        .then((result) => {
            projectid = result;
            return writeRancherProjectIdDatabase(id, projectid)
        })
        .then((result) => {
            deferred.resolve(result)
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
        });

    let writeRancherProjectIdDatabase = (id, projectid) => {
        let deferred = Q.defer();

        db.update({ _id: id }, { $set: {"project.settings.rancher.projectId": projectid}}, {}, function (err, updates) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(updates);
            }
        });
        return deferred.promise;
    };

    let projectId = (url, keys) => {
        let deferred = Q.defer();

        var authOptions = {
            url: url+'/v1/projects',
            method: 'GET',
            json: true,
            headers: {
                Authorization: 'Basic ' + new Buffer(keys.rancherPublicKey + ':' + keys.rancherSecretKey).toString('base64')
            }
        };

        request(authOptions, function (err, body) {
            if (err) {
                deferred.reject(err);
            } else {
                let result = body.body.data[0].id;
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    };
    return deferred.promise;
};

exports.enableRancherRegkey = (url, id, db) => {
    let deferred = Q.defer();

    Q.fcall(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project.settings.rancher', db)
    })
        .then((keys) => {
            return enableRegKey(url, keys)
        })
        .then((result) => {
            deferred.resolve(result)
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
        });

    let enableRegKey = (url, keys) => {

        let deferred = Q.defer();

        var authOptions = {
            url: url+'/v1/registrationtokens?projectId='+keys.projectId,
            method: 'POST',
            json: true,
            headers: {
                Authorization: 'Basic ' + new Buffer(keys.rancherPublicKey+ ':' + keys.rancherSecretKey).toString('base64')
            }
        };

        request(authOptions, function (err, body) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise
    };
    return deferred.promise;
};

exports.enableWarhorseCatalog = (url, id, db) => {
    let deferred = Q.defer();

    Q.fcall(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project.settings.rancher', db)
    })
        .then((keys) => {
            return enableCatalog(url, keys)
        })
        .then((result) => {
            deferred.resolve(result)
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
        });

    let enableCatalog = (url, keys) => {
        let deferred = Q.defer();

        var auth_data = {
            "activeValue": "{\"catalogs\":{\"library\":{\"url\":\"https://git.rancher.io/rancher-catalog.git\",\"branch\":\"${RELEASE}\"},\"community\":{\"url\":\"https://git.rancher.io/community-catalog.git\",\"branch\":\"master\"},\"Warhorse\":{\"url\":\"https://github.com/war-horse/rancher-catalog\",\"branch\":\"master\"}}}",
            "value": "{\"catalogs\":{\"library\":{\"url\":\"https://git.rancher.io/rancher-catalog.git\",\"branch\":\"${RELEASE}\"},\"community\":{\"url\":\"https://git.rancher.io/community-catalog.git\",\"branch\":\"master\"},\"Warhorse\":{\"url\":\"https://github.com/war-horse/rancher-catalog\",\"branch\":\"master\"}}}"
        };

        var authOptions = {
            url: url+'/v2-beta/settings/catalog.url',
            method: 'PUT',
            body: auth_data,
            json: true,
            headers: {
                Authorization: 'Basic ' + new Buffer(keys.rancherPublicKey + ':' + keys.rancherSecretKey).toString('base64')
            }
        };

        request(authOptions, function (err, body) {
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