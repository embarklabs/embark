const Events = require('../core/events');
const Logger = require('../core/logger');
const Embark = require('../index');
const inversify = require('inversify');

// Declare bindings
let container = new inversify.Container({defaultScope: "Singleton"});

/*********************************
 * SELF BINDINGS 
 * Used to inject an instance of itelf (doesn't require any special bindings)
 ********************************/
container.bind(Events).toSelf();
container.bind(Logger).toSelf();
container.bind(Embark).toSelf();

/********************************
 * DYNAMIC OR MANUAL BINDINGS
 * Used to create bindings that can't be resolved by creating a purely injected instance, 
 * ie, 
 * 1. we want to inject a provider/service dynamically based on config
 * 2. when we need to pass in a value to the constructor that is not injected
 * 3. the injected value depends on something that has been passed in from the command line
 * 4. ... etc 
 */


module.exports = container;
