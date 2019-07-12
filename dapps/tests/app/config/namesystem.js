module.exports = {
  "default": {
    "enabled": true,
    "available_providers": ["ens"],
    "provider": "ens"
  },
  development: {
    "register": {
      "rootDomain": "embark.eth",
      "subdomains": {
        "status": "0x4a17f35f0a9927fb4141aa91cbbc72c1b31598de",
        "mytoken": "$MyToken",
        "MyToken2": "$MyToken2"
      }
    }
  }
};
