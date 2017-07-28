const   warhorse_database = require('../database'),
        Q = require('q');


exports.addAssetLair = (project, domain, db) => {

    var id = '';

    Q.fcall(() => {
        return warhorse_database.findEntry("project.name", project, db)
        })
        .then((result) => {
            id = result[0]._id;
                return warhorse_database.getDatabaseEntry(id, 'data.project.settings', db);
            })
        .then((settings) => {
        return enableLair(settings)
        })
        .catch((err) => {
            console.log(err);
        })
        .done(() => {
            console.log('Domain Added')
        });


        let enableLair = () => {
            let deferred = Q.defer();

            var auth_data = {
                "name": "efs",
                "startOnCreate": true,
                "externalId": "catalog://library:infra*efs:2",
                "system": true,
                "dockerCompose": "version: '2'\nservices:\n  efs-driver:\n    privileged: true\n    network_mode: host\n    image: rancher/storage-efs:v0.6.5\n    pid: host\n    labels:\n      io.rancher.scheduler.global: 'true'\n      io.rancher.container.create_agent: 'true'\n      io.rancher.container.agent.role: environment\n    environment:\n      AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY}'\n      AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID}'\n    volumes:\n    - /run:/run\n    - /var/run:/var/run\n    - /dev:/host/dev\n    - /var/lib/rancher/volumes:/var/lib/rancher/volumes:shared\n    logging:\n      driver: json-file\n      options:\n        max-size: 25m\n        max-file: '2'\n",
                "rancherCompose": ".catalog:\n  name: \"Rancher EFS\"\n  version: \"0.2.2\"\n  description: |\n    Docker volume plugin for EFS\n  minimum_rancher_version: v1.4.0-rc1\n  maximum_rancher_version: v1.6.3\n  questions:\n  - variable: AWS_ACCESS_KEY_ID\n    label: AWS Access Key\n    type: string\n    description: Optional if using IAM Profile\n  - variable: AWS_SECRET_ACCESS_KEY\n    label: AWS Secret Key\n    type: password\n    description: Optional if using IAM Profile\n  - variable: RANCHER_DEBUG\n    label: Debug Mode\n    type: enum\n    description: Enable or disable verbose logging\n    default: false\n    options:\n    - true\n    - false\nefs-driver:\n  storage_driver:\n    name: rancher-efs\n    scope: environment\n    volume_access_mode: multiHostRW\n",
                "environment": {
                    "AWS_ACCESS_KEY_ID": settings.aws.awsCredentals.awsAccessKeyId,
                    "AWS_SECRET_ACCESS_KEY": settings.aws.awsCredentals.awsSecretAccessKey,
                    "RANCHER_DEBUG": "false"
                }
            };

            var authOptions = {
                url: url+'/v1/projects/'+settings.rancher.projectId+'/environments',
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
                    deferred.resolve();
                }
            });
            return deferred.promise;

        };

};