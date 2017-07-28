
const cfn = require('cfn'),
    Q = require('q'),
    fs = require('fs'),
    request = require('request'),
    warhorse_launch = require('./lib/launch'),
    vorpal = require('vorpal')(),
    figlet = require('figlet'),
    Datastore = require('nedb');

db = new Datastore({ filename: 'warhorsedatabase', autoload: true });


figlet('WarHorse', function(err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data)
});



vorpal
    .command('launch [projectname] [awsAccesKeyId] [awsSecretAccessKey] [awsRegion] [domain] [email]', 'Launch a new operation')
    .action(function(args, callback) {
        var project = args.projectname;
        var awsConfig = {
            awsAccessKeyId: args.awsAccesKeyId,
            awsSecretAccessKey: args.awsSecretAccessKey,
            region: args.awsRegion
        };
        var domain = args.domain;
        var email = args.email;


        warhorse_launch.runLaunch(project, awsConfig, domain, email);

        callback();
    });

vorpal
    .command('settings', 'Show current settings')
    .action(function(args, callback) {

        db.find({}, function (err, docs) {
            if (err) {
                //console.log("Error", err);
                console.log(err);
            } else {
                console.log(JSON.stringify(docs, undefined, 2));
            }
        });

        callback();
    });

vorpal
    .command('projects', 'Show projects')
    .action(function(args, callback) {

        db.find({}, function (err, docs) {
            if (err) {
                //console.log("Error", err);
                console.log(err);
            } else {
                console.log(JSON.stringify(docs, undefined, 2));
            }
        });

        callback();
    });

vorpal
    .command('stop [projectname]', 'Stop Operation')
    .action(function(args, callback) {
        this.log('bar');
        callback();
    });


vorpal
    .delimiter('warhorse$')
    .show();