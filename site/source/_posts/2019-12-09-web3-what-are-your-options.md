title: Introduction to Web3 - What Are Your Options?
summary: "Web3.js is a collection of APIs giving us the ability to interact with, and send commands to, the Ethereum Network from a JavaScript frontend.  In this article, I will go over the basics of what and why we need Web3.js."
author: robin_percy
categories:
  - tutorials
layout: blog-post
image: '/assets/images/web3-article-header.png'
---

![Web3.js](/assets/images/web3-article-header.png)

*This will be a fairly brief write-up, introducing Web3 ahead of my next DApp tutorial series.*

To kick this article off, I first have to reaffirm, for those that aren't aware, I am not, and never have been, a ***lover*** of JavaScript.  While my cool friends were off learning Node, and for some reason moving a scripting language to the backend, I was learning C and Go, Erlang and Distributed Systems.

For years, I harboured a deep hatred of JS, and actively whinged about it at every opportunity I got; being ***forced*** to use it in my daily work life.  Now however, I do have to say; over the last few years I have *softened* to JS, and I am much more comfortable in my own skin when having to use it.

It goes without saying, the entire web is JS.  Look around you - JS.  View the source of this article - JS files.  Look at your own app's dependencies - JS.

JavaScript, specifically Node, really is in everything we use, and that now also applies to our wonderful world of Cryptocurrencies.

As I mentioned briefly in my [***last*** article](/news/2019/11/28/nim-vs-crystal-part-3-cryto-dapps-p2p/), my ***next*** article series is going to be about building your first DApp – from start to finish.  Inevitably, the frontend of our DApp needs to be able to communicate with the Ethereum Network.  This is where [Web3.js](https://web3js.readthedocs.io/en/v1.2.6/index.html) comes into the mix.  `Web3.js` is a collection of APIs allowing us such functionality as:  Reading & Writing data from Smart Contracts, sending and receiving Ether, encrypting / decrypting wallets & data, and *a whole bunch* of other stuff too.  Basically, *most* of the backend functionality available on the Ethereum Network natively becomes available for use in the browser.


This is how the `web3.js` library talks to the Ethereum Network:

![Web3 JS Diagram](/assets/images/web3-js-diagram.png)
*Image credit: [iotbl](https://iotbl.blogspot.com/2017/03/ethereum-and-blockchain-2.html)*

So, now that the basics are covered, let's go over installing and using the `web3.js` library.


# Installing Web3

Installing `web3.js` is as simple as:

```
npm install web3
```

*One thing worth noting here*; is that (coming from an anti-js background), I kept getting a `cannot find web3 module` error when trying to import web3 into a Node console.  If you, like me, aren't a big js fan, this can be solved by first running the `npm init` command to ensure there is a `package.json` file in the cwd, and *then* you can run `npm install web3`, and it will work fine.  (I realise this is basic stuff – but actually for someone who's *tried* to avoid Node at all costs, it was initially confusing enough to have to search online.)

I am working from a Mac here, but if you are working from Windows, the install process *can* be exactly the same, assuming you do have [Node & NPM installed](https://phoenixnap.com/kb/install-node-js-npm-on-windows).

So, with `web3.js` installed, let's do some basic interactions with the Ethereum Network, and ***dive on in!***



# Communicating with the Ethereum Network

## Wallet Interaction

For this article, we're going to use [Ganache](https://www.trufflesuite.com/ganache), for simplicity, as our local Blockchain.  By using Ganache, we can spin up a local Ethereum node, without having to write a single line of code!

***(Yes, I realise that rhymes.  No, I didn't realise until my second proof-read through of this article!)***

In fact, though, Embark already has Ganache inbuilt, so we could also simply run:

```js
embark simulator
```

Anyway, to install Ganache head over to [this page](https://www.trufflesuite.com/ganache) and click on the executable there.  If you so choose; there is also a Ganache CLI available you can install by running:

```
npm install -g ganache-cli
```

Running the Ganache CLI will give you the same functionality as the desktop client; in essence giving us a multitude of ETH-loaded wallets that we can build contracts around / interact with.

![Ganache CLI](/assets/images/ganache-cli.png)

Rather brilliantly; we now have a local Ethereum Node running that we can start using the Web3 client to interact with.  In another Terminal tab, open up a `node` instance from the same working directory we ran the `npm init` command from earlier.

Now, in our interactive Node console, run:

``` js
var Web3 = require('web3');
var web3 = new Web3('http://localhost:8545');
```

Something to note here, is that I'm calling `new Web3` with an `http` protocol, but the WebSocket protocol is also commonly used:

``` js
var web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider('ws://remotenode.com:8546'));
```

To test and ensure the connection, you can get a list of the accounts made available in Ganache by running:

``` js
web3.eth.getAccounts().then(console.log);
```

Which *should* give you an output like the following:

```js
> [ '0x7689cF9F90FAad61B8a3c9b1b2A5b4580B37358b',
  '0x852e9a9db77a4e6169e175cDBb33dBE350150A8e',
  '0x946700a1a4f30Dfe80307C91B6DaF1cCa2d09401',
  '0x7d356aF02A87147D3ce5F9ACA716a78f70aF7616',
  '0x88A116a16e4c8838F575a0e7a72eE27C7B073263',
  '0x655317701Fcf3b310F492cB801C8D23f8c6fb556',
  '0x16D305e72aFb0DDa1dB1830F8a98D5cD5337882E',
  '0x9099bb4Af9CE5734E7a7e62f817e833fcFFaaF32',
  '0x2ec4CC6700d0424A78a9B9Fc2ecBaeFc162313F1',
  '0x1BC51a0edEC9FdEA3B14748e9209F4bF8Fe024b5' ]
```

If you want to check the balance of an individual account from the above list, you can do so by running:

```js
const account1 = "0x7689cF9F90FAad61B8a3c9b1b2A5b4580B37358b";

web3.eth.getBalance(account1)
.then(console.log);
```

Which will output:

```
> 100000000000000000000
```


## Contract Interaction

As above; interacting with our *individual accounts* through `web3.js` is cool, but not nearly the extent to which the library works.  Let's now take a brief look at the more important functionality; of interacting with Smart Contracts through `web3.js`.

The first thing we need to do, is to create a new Smart Contract, which we can do with the `new web3.eth.Contract` command.

Before we call the `new` command, we need to assign our `json interface` for the contract's `ABI`:

```js
const abi = [{"type":"function", "name":"foo", "inputs": [{"name":"a","type":"uint256"}], "outputs": [{"name":"b","type":"address"}] },{ "type":"event", "name":"Event", "inputs": [{"name":"a","type":"uint256","indexed":true},{"name":"b","type":"bytes32","indexed":false}], }]
```

The `json interface` is a JSON object describing the *Application Binary Interface (ABI)* for our Smart Contract.  Using this JSON interface; `web3.js` is able to create a JavaScript object representing our Smart Contract and its methods & events, using the `web3.eth.Contract` functionality.

*Note, the above JSON interface / ABI is taken directly from the [Web3 docs](https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#id5).*

Now that we have our `json interface` defined, we can create our new contract instance:

```js
var myContract = new web3.eth.Contract(abi, '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe');
```

*(The `from` address is the address of the already deployed contract instance that we're aiming to talk to.)*

You could then set the Smart Contract's `data` and other `options`, and then **deploy** your Contract with something *like* the following:

```js
myContract.options.data = '0x12345...';

myContract.deploy({
    arguments: [123, 'My String']
})
.send({
    from: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
    gas: 1500000,
    gasPrice: '30000000000000'
})
.then(function(newContractInstance){
    console.log(newContractInstance.options.address) // instance with the new contract address
});
```

The above examples aren't supposed to be perfect continuous code, and should definitely *not* be copy/pasted into a production project, but they are there to show off roughly how `Web.js` works, and give an overview of interacting with the 2 main pieces of functionality, as I see them – Wallets and Contracts.

In my next tutorial series, we will be utilising [Embark](https://embark.status.im/docs/quick_start.html), and therefore we'll be diving deeper into `web3.js`, and showing off much more of its potential.


# Web.js in Other Languages

Naturally the whole idea behind this article was to show off communication with the Ethereum Network through a JavaScript frontend.  However, there are also **many** other libraries, in pretty much every language, available to do the same:

***Nim - [nim-web3](https://github.com/status-im/nim-web3)***
Crystal - [web3.cr](https://github.com/light-side-software/web3.cr)
Ruby - [web3-eth gem](https://github.com/izetex/web3-eth)
Elixir - [ethereumex](https://github.com/mana-ethereum/ethereumex)
Python - [Web3.py](https://github.com/ethereum/web3.py)
Haskell - [hs-web3](https://github.com/airalab/hs-web3)
Java - [web3j](https://github.com/web3j/web3j)
Scala - [web3j-scala](https://github.com/mslinn/web3j-scala)
Purescript - [purescript-web3](https://github.com/f-o-a-m/purescript-web3)
PHP - [web3.php](https://github.com/sc0Vu/web3.php)


# Beyond Web3

As stated at the opening of this article, we've barely even scratched the surface of `web.js` capabilities.  But I do hope that you now have a better understanding of what Web3 stands for.

Personally, I am **very much** looking forward to ***diving on in*** to my next DApp tutorial series, to utilise and demonstrate the Ethereum Network to its fullest.

As always, if you have *any* questions regarding Web3, how Status utilises Web3, or if you have comments on this article, feel free to reach out to me at [robin@status](mailto:robin@status.im).

Thanks again for reading, and check back for my DApp tutorial series, starting later this week!

[ **- @rbin**](https://twitter.com/rbin)
