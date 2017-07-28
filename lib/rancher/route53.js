const Q = require('q'),
    request = require('request'),
    _ = require('lodash'),
    warhorse_database = require('../database');



exports.startRoute53 = (id, domain, db) => {
    let deferred = Q.defer();

    var settings;


    Q.fcall(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project.settings', db);
    })
        .then((result) => {
            settings = result;
            return addRoute53(settings, domain)
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
            deferred.resolve();
        });


    /*

    let checkRoute53 = (settings) => {
        let deferred = Q.defer();

        var authOptions = {
            url: settings.rancher.rancherUrl+'/v1/projects/'+settings.rancher.projectId+'/environments',
            method: 'GET',
            json: true,
            headers: {
                Authorization: 'Basic ' + new Buffer(settings.rancher.rancherPublicKey + ':' + settings.rancher.rancherSecretKey).toString('base64')
            }
        };

        request(authOptions, function (err, body) {
            if (err) {
                deferred.reject(err);
            } else {

                console.log(_.find(body.body.data, { 'name': "testing123"}));

                if ( typeof _.find(body.body.data, { 'name': "testing123"}) === 'undefined'){
                    deferred.resolve('POST');
                } else {
                    deferred.resolve('PUT');
                }
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    */

    let addRoute53 = (settings, domain) => {
        let deferred = Q.defer();


        var auth_data = {
            "name": "route53",
            "startOnCreate": true,
            "externalId": "catalog://library:infra*route53:15",
            "system": true,
            "dockerCompose": "# notemplating\nroute53:\n  image: rancher/external-dns:v0.7.0\n  command: -provider=route53\n  expose:\n    - 1000\n  environment:\n    AWS_ACCESS_KEY: ${AWS_ACCESS_KEY}\n    AWS_SECRET_KEY: ${AWS_SECRET_KEY}\n    ROOT_DOMAIN: ${ROOT_DOMAIN}\n    ROUTE53_ZONE_ID: ${ROUTE53_ZONE_ID}\n    NAME_TEMPLATE: ${NAME_TEMPLATE}\n    TTL: ${TTL}\n  labels:\n    io.rancher.container.create_agent: \"true\"\n    io.rancher.container.agent.role: \"external-dns\"\n  volumes:\n    - /var/lib/rancher:/var/lib/rancher\n",
            "rancherCompose": "# notemplating\n.catalog:\n  name: \"Route53 DNS\"\n  version: \"v0.7.0.1\"\n  description: \"Rancher External DNS service powered by Amazon Route53.\"\n  minimum_rancher_version: v1.6.0-rc1\n  questions:\n    - variable: \"AWS_ACCESS_KEY\"\n      label: \"AWS Access Key ID\"\n      description: \"Access key ID for your AWS account (not required if using EC2 IAM role)\"\n      type: \"string\"\n      required: false\n    - variable: \"AWS_SECRET_KEY\"\n      label: \"AWS Secret Access Key\"\n      description: \"Secret access key for your AWS account (not required if using EC2 IAM role)\"\n      type: \"string\"\n      required: false\n    - variable: \"TTL\"\n      label: \"TTL\"\n      description: \"The resource record cache time to live (TTL), in seconds\"\n      type: \"int\"\n      default: 60\n      required: false\n    - variable: \"ROOT_DOMAIN\"\n      label: \"Hosted Zone Name\"\n      description: \"Route53 hosted zone name (zone has to be pre-created).\"\n      type: \"string\"\n      required: true\n    - variable: \"ROUTE53_ZONE_ID\"\n      label: \"Hosted Zone ID\"\n      description: \"If there are multiple zones with the same name, then you must additionally specify the ID of the hosted zone to use.\"\n      type: \"string\"\n      required: false\n    - variable: \"NAME_TEMPLATE\"\n      label: \"DNS Name Template\"\n      description: |\n        Name template used to construct the subdomain part (left of the hosted zone name) of the DNS record names.\n        Supported placeholders: %{{service_name}}, %{{stack_name}}, %{{environment_name}}.\n        By default DNS entries will be named '<service>.<stack>.<environment>.<domain>'.\n      type: \"string\"\n      default: \"%{{service_name}}.%{{stack_name}}.%{{environment_name}}\"\n      required: false\n    - variable: \"HEALTH_CHECK\"\n      label: \"Health Check Interval\"\n      description: |\n        The health check interval for this service, in milliseconds.\n        Raise this value if the global requests for your account are exceeding the Route53 API rate limits.\n      type: \"int\"\n      min: 2000\n      max: 60000\n      default: 10000\n      required: true\n\nroute53:\n  health_check:\n    port: 1000\n    interval: ${HEALTH_CHECK}\n    unhealthy_threshold: 2\n    request_line: GET / HTTP/1.0\n    healthy_threshold: 2\n    response_timeout: 5000\n",
            "environment": {
                "AWS_ACCESS_KEY": settings.aws.awsCredentals.awsAccessKeyId,
                "AWS_SECRET_KEY": settings.aws.awsCredentals.awsSecretAccessKey,
                "TTL": "60",
                "ROOT_DOMAIN": domain,
                "ROUTE53_ZONE_ID": "",
                "NAME_TEMPLATE": "%{{stack_name}}",
                "HEALTH_CHECK": "10000"
            }
        };

        var authOptions = {
            url: settings.rancher.rancherUrl+'/v1/projects/'+settings.rancher.projectId+'/environments',
            method: 'POST',
            body: auth_data,
            json: true,
            headers: {
                Authorization: 'Basic ' + new Buffer(settings.rancher.rancherPublicKey + ':' + settings.rancher.rancherSecretKey).toString('base64')
            }
        };

        request(authOptions, function (err, body) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(body);
            }
        });
        return deferred.promise;
    };

    return deferred.promise;
};