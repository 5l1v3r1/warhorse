const   Q = require('q'),
    warhorse_database = require('../database'),
    request = require('request');


exports.startLetsencrypt = (url, id, db, email, domain) => {
    let deferred = Q.defer();

    Q.fcall(() => {
        return warhorse_database.getDatabaseEntry(id, 'data.project', db)
    })
        .then((project) => {
            return letsencrypt(url, project)
        })
        .catch((err) => {
            deferred.reject(err);
        })
        .done(() => {
            deferred.resolve()
        });

    let letsencrypt = (url, project) => {

        let deferred = Q.defer();

        var auth_data = {
            "name": "letsencrypt",
            "startOnCreate": true,
            "externalId": "catalog://library:infra*efs:2",
            "system": true,
            "dockerCompose": "version: '2'\nservices:\n  letsencrypt:\n    image: janeczku/rancher-letsencrypt:v0.4.0\n    environment:\n      EULA: ${EULA}\n      API_VERSION: ${API_VERSION}\n      CERT_NAME: ${CERT_NAME}\n      EMAIL: ${EMAIL}\n      DOMAINS: ${DOMAINS}\n      PUBLIC_KEY_TYPE: ${PUBLIC_KEY_TYPE}\n      RENEWAL_TIME: ${RENEWAL_TIME}\n      PROVIDER: ${PROVIDER}\n      CLOUDFLARE_EMAIL: ${CLOUDFLARE_EMAIL}\n      CLOUDFLARE_KEY: ${CLOUDFLARE_KEY}\n      DO_ACCESS_TOKEN: ${DO_ACCESS_TOKEN}\n      AWS_ACCESS_KEY: ${AWS_ACCESS_KEY}\n      AWS_SECRET_KEY: ${AWS_SECRET_KEY}\n      DNSIMPLE_EMAIL: ${DNSIMPLE_EMAIL}\n      DNSIMPLE_KEY: ${DNSIMPLE_KEY}\n      DYN_CUSTOMER_NAME: ${DYN_CUSTOMER_NAME}\n      DYN_USER_NAME: ${DYN_USER_NAME}\n      DYN_PASSWORD: ${DYN_PASSWORD}\n      VULTR_API_KEY: ${VULTR_API_KEY}\n      OVH_APPLICATION_KEY: ${OVH_APPLICATION_KEY}\n      OVH_APPLICATION_SECRET: ${OVH_APPLICATION_SECRET}\n      OVH_CONSUMER_KEY: ${OVH_CONSUMER_KEY}\n      GANDI_API_KEY: ${GANDI_API_KEY}\n    volumes:\n      - lets-encrypt:/etc/letsencrypt\n    labels:\n      io.rancher.container.create_agent: 'true'\n      io.rancher.container.agent.role: 'environment'\nvolumes:\n  lets-encrypt:\n    driver: ${STORAGE_DRIVER}\n",
            "rancherCompose": ".catalog:\n  name: Let's Encrypt\n  version: 0.4.0\n  description: Trusted SSL certificates at zero cost\n  minimum_rancher_version: v1.2.0-pre4-rc1\n  questions:\n    - variable: EULA\n      label: I Agree to the Let's Encrypt TOS\n      description: |\n        Read https://letsencrypt.org/documents/LE-SA-v1.0.1-July-27-2015.pdf\n      required: true\n      type: enum\n      options:\n        - \"Yes\"\n        - \"No\"\n    - variable: API_VERSION\n      label: Let's Encrypt API Version\n      description: |\n        Select the API version used for issuing the certificate.\n        Use `Sandbox` for testing only.\n      required: true\n      type: enum\n      default: Production\n      options:\n        - Production\n        - Sandbox\n    - variable: EMAIL\n      label: Your Email Address\n      description: |\n        Enter the email address to use for creating the Let's Encrypt account.\n      required: true\n      type: string\n    - variable: CERT_NAME\n      label: Certificate Name\n      description: |\n        Name for storing the certificate in the Rancher API and in volumes.\n        Any existing certificate by that name will be updated.\n      required: true\n      type: string\n    - variable: DOMAINS\n      label: Domain Names\n      description: |\n        Comma delimited list of the certificate domains starting with the Common Name.\n        E.g: `example.com, dev.example.com`.\n      required: true\n      type: string\n    - variable: PUBLIC_KEY_TYPE\n      label: Public Key Algorithm\n      description: |\n        Select one of the available key types.\n      required: true\n      type: enum\n      default: RSA-2048\n      options:\n        - RSA-2048\n        - RSA-4096\n        - RSA-8192\n        - ECDSA-256\n        - ECDSA-384\n    - variable: RENEWAL_TIME\n      label: Renewal Time of Day (00-23)\n      description: |\n        Set the time of day (UTC in hours) at which certificate renewals should be run.\n      default: 12\n      required: true\n      type: int\n    - variable: STORAGE_DRIVER\n      label: Volume Storage Driver (Optional)\n      description: |\n        If you enter the name of an existing storage driver (see `Infrastructure -> Storage`) then a stack scoped storage volume named `lets-encrypt`\n        will be created or used to store account data, certificates and private keys.\n      required: false\n      type: string\n    - variable: PROVIDER\n      label: Domain Validation Method\n      description: Select a DNS provider to use for domain validation. Use 'HTTP' if DNS for the domain is not hosted with any of the providers.\n      required: true\n      type: enum\n      options:\n        - CloudFlare\n        - DigitalOcean\n        - DNSimple\n        - Dyn\n        - Gandi\n        - HTTP\n        - Ovh\n        - Route53\n        - Vultr\n    - variable: AWS_ACCESS_KEY\n      label: AWS Route53 Access Key Id\n      description: Enter the Access Key Id for your AWS account.\n      type: string\n      required: false\n    - variable: AWS_SECRET_KEY\n      label: AWS Route53 Secret Access Key\n      description: Enter the Secret Access Key for your AWS account.\n      type: password\n      required: false\n    - variable: CLOUDFLARE_EMAIL\n      label: CloudFlare Email Address\n      description: Enter the email address associated with your CloudFlare account.\n      type: string\n      required: false\n    - variable: CLOUDFLARE_KEY\n      label: CloudFlare API Key\n      description: Enter the Global API Key for your CloudFlare account.\n      type: password\n      required: false\n    - variable: DO_ACCESS_TOKEN\n      label: DigitalOcean API Access Token\n      description: Enter the Personal Access Token for your DigitalOcean account.\n      type: password\n      required: false\n    - variable: DNSIMPLE_EMAIL\n      label: DNSimple Email Address\n      description: Enter the email address associated with your DNSimple account.\n      type: string\n      required: false\n    - variable: DNSIMPLE_KEY\n      label: DNSimple API Key\n      description: Enter your DNSimple API key.\n      type: password\n      required: false\n    - variable: DYN_CUSTOMER_NAME\n      label: Dyn Customer Name\n      description: Enter your Dyn customer name.\n      type: string\n      required: false\n    - variable: DYN_USER_NAME\n      label: Dyn User Name\n      description: Enter your Dyn user name.\n      type: string\n      required: false\n    - variable: DYN_PASSWORD\n      label: Dyn Password\n      description: Enter your Dyn password.\n      type: password\n      required: false\n    - variable: GANDI_API_KEY\n      label: Gandi API Key\n      description: Enter the API key for your Gandi account.\n      type: password\n      required: false\n    - variable: OVH_APPLICATION_KEY\n      label: OVH Application Key\n      description: Enter your OVH application key.\n      type: string\n      required: false\n    - variable: OVH_APPLICATION_SECRET\n      label: OVH Application Secret\n      description: Enter your OVH application secret.\n      type: password\n      required: false\n    - variable: OVH_CONSUMER_KEY\n      label: OVH Consumer Key\n      description: Enter your OVH consumer key.\n      type: password\n      required: false\n    - variable: VULTR_API_KEY\n      label: Vultr API Key\n      description: Enter the API key for your Vultr account.\n      type: password\n      required: false\n",
            "environment": {
                "EULA": "Yes",
                "API_VERSION": "Production",
                "EMAIL": email,
                "CERT_NAME": project.name+'_cert',
                "DOMAINS": domain,
                "PUBLIC_KEY_TYPE": "RSA-2048",
                "RENEWAL_TIME": "12",
                "STORAGE_DRIVER": "rancher-efs",
                "PROVIDER": "Route53",
                "AWS_ACCESS_KEY": project.settings.aws.awsCredentals.awsAccessKeyId,
                "AWS_SECRET_KEY": project.settings.aws.awsCredentals.awsSecretAccessKey,
                "CLOUDFLARE_EMAIL": "",
                "CLOUDFLARE_KEY": "",
                "DO_ACCESS_TOKEN": "",
                "DNSIMPLE_EMAIL": "",
                "DNSIMPLE_KEY": "",
                "DYN_CUSTOMER_NAME": "",
                "DYN_USER_NAME": "",
                "DYN_PASSWORD": "",
                "GANDI_API_KEY": "",
                "OVH_APPLICATION_KEY": "",
                "OVH_APPLICATION_SECRET": "",
                "OVH_CONSUMER_KEY": "",
                "VULTR_API_KEY": ""
            }
        };

        var authOptions = {
            url: url+'/v1/projects/'+project.settings.rancher.projectId+'/environments',
            method: 'POST',
            body: auth_data,
            json: true,
            headers: {
                Authorization: 'Basic ' + new Buffer(project.settings.rancher.rancherPublicKey + ':' + project.settings.rancher.rancherSecretKey).toString('base64')
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