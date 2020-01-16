title: Building a decentralized Reddit with Embark - Part 2
author: 'pascal_precht'
summary: "This is the second part of the three part tutorial about building a decentralized Reddit with Embark. In this part, we'll be focussing on testing our Smart Contract using EmbarkJS."
categories:
  - tutorials
layout: blog-post
alias: news/2019/02/10/building-a-decentralized-reddit-with-embark-part-2/
---

In [the first part of this tutorial](/news/2019/02/04/building-a-decentralized-reddit-with-embark-part-1/) we've implemented a `DReddit` Smart Contract that comes with methods to create and vote on topic posts. In this part we'll continue right where we've left off and take a closer look at how we can test our Smart Contract using Embark. Make sure to check out the other parts as well:

- [**Part 1** - Setting up the project and implementing a Smart Contract](/news/2019/02/04/building-a-decentralized-reddit-with-embark-part-1/)
- [**Part 3** - Building a simple front-end using React](/news/2019/02/18/building-a-decentralized-reddit-with-embark-part-3/)

**The code for this tutorial can be found in [this repository](https://github.com/embarklabs/dreddit-tutorial)**.

And off we go!

## Writing a first test

We've got plenty functionality to cover in our tests, but let's start with a very simple one just to get a bit more familiar with how to write tests and also to ensure things are working as intended. First we create a test file `DReddit_spec.js` inside `test` and add a `contract()` block that looks something like this:

```
contract('DReddit', () => {

});
```

Inside this code block we'll be putting dedicated test cases. The `contract()` function can be considered a "grouping" functionality to group tests, if you will. If you're familiar with Mocha's [describe()](https://mochajs.org/) function, you already know how `contract()` works, as it's pretty much just an alias.

To check whether our test setup is working, we add a simple test that passes:

```
contract('DReddit', () => {

  it ('should work', () => {
    assert.ok(true);
  });
});
```

Running this using Embark's `test` command should result in an output similar to this:

```
❯ embark test


Compiling contracts
  DReddit
    ✓ should work (0ms) - [0 gas]


  1 passing (5s) - [Total: 2210775 gas]

 > All tests passed
```

This works great, let's go ahead and test some actual functionality!

## Testing the creation of post

Let's test the core functionality of our application - the creation of posts. For that we need to do a couple of things: We need to somehow get an instance of our `DReddit` Smart Contract in JavaScript, so we can call methods on it to test if they work, and we also need to configure out testing environment so that the right Smart Contract instances are created.

### Requiring Smart Contract instances

When running tests, Embark adds a couple of custom functions and objects to the global scope, which are necessary. One of those functions is a custom `require()` that lets us import Smart Contract instances from an Embark specific path. This is done so that we can easily import

For example, in order to get an instance of our `DReddit` Smart Contract within the test, we add the following line to our spec file:


```
const DReddit = require('Embark/contracts/DReddit');
```

`DReddit` is now supposed to be an EmbarkJS Smart Contract instance, but we need to be very careful here. **In reality, this object is empty**. This is because at the time this file is processed, the Smart Contract might not be deployed yet. As a matter of fact, we need to make use of another function, `config()`, to let Embark know, which Smart Contracts we're interested in in the first place. This might be a little confusing, but really the bottom line is that `DReddit` isn't what we think it is, until we use it inside `contract()`.

Let's add the mentioned `config()` function so Embark knows what we need:

```
config({
  contracts: {
    DReddit: {}
  }
});
```

This is very similar to [configuring Smart Contracts](/docs/contracts_configuration.html), in fact it's the test environment equivalent. We pass a configuration object to `config()` with specific parameters for every Smart Contract we need. In our case, we just need to add `DReddit` without any additional parameters. This is because our Smart Contract doesn't need constructor values and things alike. Keep in mind, if we don't call this `config()` function, the imported objects for our Smart Contract instances will always be empty.

### Testing `createPost()`

To test our Smart Contract's `createPost()` method, we'll make use of `DReddit`, which will now be a Smart Contract instance. If you remember, `createPost()` actually takes the post's description as bytes, so how do we make that work? Well, it turns out that we actually don't pass it the description itself, but an **IPFS hash** that points to the actual description. The reason for that is that posts can be very long, resulting in a lot of bytes. It's better to store the actual description in a storage where data size isn't an issue, and instead store a reference to that data in our Smart Contract. Using a hash makes the data size deterministic as it will always have the same length.

Once we have such a hash (no worries, we've got one prepared), we can use Web3's `fromAscii()` utils to convert that hash to bytes and then send it off using our Smart Contract's `createPost()` method. We can then subscribe to the events we're emitting and check its return value like this:

```
...
const ipfsHash = 'Qmc5gCcjYypU7y28oCALwfSvxCBskLuPKWpK4qpterKC7z';

contract('DReddit', () => {
  ...
  it ('should be able to create a post and receive it via contract event', async () => {
    const receipt = await DReddit.methods.createPost(web3.utils.fromAscii(ipfsHash)).send();
    const event = receipt.events.NewPost;
    postId = event.returnValues.postId;
    assert.equal(web3.utils.toAscii(event.returnValues.description), ipfsHash);
  });
});
```

Notice that we're using `async/await` here because Embark's Smart Contract instance methods return promises. The same can be done without promises as well, it's just a syntactical difference at this point. Running `embark test` should result in two passing tests now!

## Testing correctness of data

Another good test case would be to check if the stored data such as the description bytes, the owner etc.  resolve back to the correct data. Notice that this is slightly different from what we're testing in our previous test - there we're testing the description bytes emitted by the `NewPost` event. To test this we take advantage of the `postId` created in the previous test, which is available globally now, to fetch the stored post. We then perform a similar check as in the previous test. We also want to test if the owner data of the post is correct, but for that we need to get access to the account that created the post in the first place.

Luckily wallet accounts can be easily accessed as they are emitted by Embark's `config()` function. All we have to do is attaching a resolution handler to `config()` and storing the emitted value:

```
...
let accounts = [];

config({
  contracts: {
    DReddit: {}
  }
}, (err, _accounts) => {
  accounts = _accounts;
});
```

Having that in place, our next test could look something like this:

```
it ('post should have correct data', async () => {
  const post = await DReddit.methods.posts(postId).call();
  assert.equal(web3.utils.toAscii(post.description), ipfsHash);
  assert.equal(post.owner, accounts[0]);
});
```

You might notice that we're referring to `accounts[0]` here. However, just by looking at the code, we can't really know if `accounts[0]` is really the one we're expecting. This is where Embark offers another helping hand. When the `accounts` are set up, Embark will automatically set the first account of the wallet (`accounts[0]`) to the default account that'll be used for all transactions. With that knowledge we can make an assertion, expecting `accounts[0]` to be the owner of the post.

Another way would be to just always explicitly pass any of the accounts to a Smart Contract method's `send()` function, in which case we'd have full control over which account of the wallet will be used.

## Testing `canVote()`

Alright, next up let's quickly test if our `canVote()` method works the way as expected. As voting on posts that don't exist should never work, we will simply call `canVote()` on a post id that doesn't exist. This test is pretty straight forward:

```
it('should not be able to vote in an unexisting post', async () => {
  const userCanVote = await DReddit.methods.canVote("123").call();
  assert.equal(userCanVote, false);
});
```

We also want to make sure that `canVote()` resolves to `true` in case a user can indeed vote a certain post. We can again reuse the `postId` that we've stored earlier:

```
it('should be able to vote in a post if account has not voted before', async () => {
  const userCanVote = await DReddit.methods.canVote(postId).call();
  assert.equal(userCanVote, true);
});
```

Wonderful, we have 5 passing tests now!

## Testing `vote()`

Of course we want to test whether one of our application's core features works as well. There's certainly different ways to verify whether `vote()` does what it's supposed to do, but for this tutorial we'll simply check whether the owner account of the vote emitted by the `NewVote` event is the same as the account that performed the vote. We can actually take some inspiration from our previous tests:

```
it("should be able to vote in a post", async () => {
  const receipt = await DReddit.methods.vote(postId, 1).send();
  const Vote = receipt.events.NewVote;
  assert.equal(Vote.returnValues.owner, accounts[0]);
});
```

## Test that only one vote per post is allowed

The last but essential functionality we want to test is that whether our Smart Contract allows users to vote multiple times on the same post, which for obvious reasons shouldn't be possible. Using the `async/await` syntax we can test this very nicely by adding a `try/catch` block. When a user votes on a post she has already voted on, `vote()` will fail in which case we can make our assertions accordingly:

```
it('should not be able to vote twice', async () => {
  try {
    const receipt = await DReddit.methods.vote(postId, 1).send();
    assert.fail('should have reverted');
  } catch (error){
    assert(error.message.search('revert') > -1, 'Revert should happen');
  }
});
```

This might look a bit confusing first but it's actually pretty straight forward. In case `vote()` fails, we should not reach the `assert.fail()` call but end up in the `catch()` block immediately. If that was not the case, the test would fail. This is a very common pattern when testing negatives.

Okay, one last time we run `embark test` and if the output looks like the following, we're fully covered in terms of tests!


```
❯ embark test
Compiling contracts


  DReddit
    ✓ should work (0ms) - [0 gas]
    ✓ should be able to create a post and receive it via contract event (60ms) - [160689 gas]
    ✓ post should have correct data (18ms) - [0 gas]
    ✓ should not be able to vote in an unexisting post (14ms) - [0 gas]
    ✓ should be able to vote in a post if account hasn't voted before (12ms) - [0 gas]
    ✓ should be able to vote in a post (42ms) - [65115 gas]
    ✓ shouldn't be able to vote twice (37ms) - [22815 gas]


  7 passing (5s) - [Total: 3130955 gas]

 > All tests passed
```

 Awesome! If you run into any issues, check out the repository with all steps recorded [here](https://github.com/embarklabs/dreddit-tutorial). In [the next and last part of this series](/news/2019/02/18/building-a-decentralized-reddit-with-embark-part-3/), we'll be building a front-end for our DReddit app using React. Until then, feel free to add more tests as you like!
