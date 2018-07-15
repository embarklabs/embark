const isDocker = (() => {
    let isDocker;

    const hostname = require('os').hostname();
    const pattern = new RegExp(
        '[0-9]+\:[a-z_-]+\:\/docker\/' + hostname + '[0-9a-z]+', 'i'
    );

    try {
        isDocker = require('child_process')
            .execSync(
                'cat /proc/self/cgroup',
                {stdio: ['ignore', 'pipe', 'ignore']}
            )
            .toString().match(pattern) !== null;
    } catch (e) {
        isDocker = false;
    }

    return isDocker;
})();

const defaultHost = isDocker ? '0.0.0.0' : 'localhost';

// when we're runing in Docker, we can expect (generally, in a development
// scenario) that the user would like to connect to the service in the
// container via the **host's** loopback address, so this helper can be used to
// swap 0.0.0.0 for localhost in code/messages that pertain to client-side
function canonicalHost(host) {
    return isDocker && host === '0.0.0.0' ? 'localhost' : host;
}

function dockerHostSwap(host) {
    return (isDocker && (host === 'localhost' || host === '127.0.0.1')) ? defaultHost : host;
}

const defaultCorsHost = canonicalHost(defaultHost);

module.exports = {
    canonicalHost,
    defaultCorsHost,
    defaultHost,
    dockerHostSwap,
    isDocker
};
