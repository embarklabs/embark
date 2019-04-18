title: Deploying Apps
layout: docs
---

To build truly decentralized applications, we probably want to upload and host our application's assets on a decentralized storage network as well. In this guide we'll explore how to upload data to IPFS and Swarm using Embark.

## Deploying using the `upload` command

To upload our application to IPFS or Swarm, we first need to ensure we have correctly set up our [storage configuration](/docs/storage_configuration.html). 

Once that is done we can use Embark's `upload` command to take the assets located in the configured `buildDir` (read [here](/docs/configuration.html) for more information) and upload it to the configured storage network.

```
$ embark upload
```

Similar to other available services that Embark supports, we can upload our data to different environments. The follow command uploads data using the `livenet` environment configuration:

```
$ embark upload livenet
```

## Associating an ENS domain


We can associate our uploaded data to an ENS domain by using the `--ens` option. This will take the storage hash and upload it to an ENS domain.

For example, the following command will upload our application to IPFS or Swarm and connect it with the `embark.eth` domain:

```
$ embark upload --ens=embark.etk
```

{% notification info 'Important:' %}
You need to be the owner of the given domain for this to work. Head over to [ens.domains](https://ens.domains/) for more information.
{% endnotification %}


