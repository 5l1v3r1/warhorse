const Preferences = require('preferences'),
    _ = require('lodash'),
    generator = require('generate-password'),
    Q = require('q');

// Generate Random Password
var password = generator.generate({
    length: 10,
    numbers: true
});

// Get a Random Password
exports.getPassword = () => {
    let deferred = Q.defer();
    let result = password;
    deferred.resolve(result);
    return deferred.promise;
};

exports.getProjectId = (projectName) => {
    let deferred = Q.defer();

    for (var i = 0; i < prefs.length; i++){
        if (prefs[i].name == projectName){
            deferred.resolve(i);
            console.log(i)
        }
    }
    return deferred.promise;
};