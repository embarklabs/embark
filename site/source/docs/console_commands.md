title: Console Commands
layout: docs
---

With ``embark run`` there is a console at the bottom which can be used to interact with contracts or with embark itself. type ``help`` to see a list of available commands, more commands will be added with each version of Embark.

### Interacting with contracts
After contract deployment, you should be able to interact with the web3 object and the deployed contracts.

### Other Available Commands
Some commands available include:

* ``version`` - see list of software & libraries and their respective versions
* ``quit`` or ``exit`` - to immediatly exit (you can also use ctrl + c)
* ``webserver start`` - start the dev webserver
* ``webserver stop`` - stop the dev webserver
* ``browser open`` - open a web browser and load your DApp from the dev webserver

### Custom Commands

It's possible to extend Embark to include custom commands. See [how to create
a plugin](creating_plugins.html)

<pre><code class="javascript">module.exports = function(embark) {
        embark.registerConsoleCommand(function(cmd, options) {
          if (cmd === "hello") {
            return "hello there!";
          }
          // continue to embark or next plugin;
          return false;
        });
    }
</code></pre>
