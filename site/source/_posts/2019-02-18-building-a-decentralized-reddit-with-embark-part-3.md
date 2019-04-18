title: Building a decentralized Reddit with Embark - Part 3
summary: "In this third and last part of the tutorial series about building a decentralized Reddit with Embark, we're building the front-end for our application using React and EmbarkJS."
categories:
  - tutorials
layout: blog-post
author: pascal_precht
---

Hopefully you've read [the first](/news/2019/02/04/building-a-decentralized-reddit-with-embark-part-1/) and [second part](/news/2019/02/11/building-a-decentralized-reddit-with-embark-part-2/) of this tutorial on building a decentralized Reddit application using Embark. If not, we highly recommend you doing so, because in this part, we'll be focussing on building the front-end for our application and continue where we've left off.

- [**Part 1** - Setting up the project and implementing a Smart Contract](/news/2019/02/04/building-a-decentralized-reddit-with-embark-part-1/)
- [**Part 2** - Testing the Smart Contract through EmbarkJS](/news/2019/02/11/building-a-decentralized-reddit-with-embark-part-2/)

We'll be using React as a client-side JavaScript library to build our application. However, we can use any framework of our choice, so feel free to follow along while using your favourite framework equivalents!

**The code for this tutorial can be found in [this repository](https://github.com/embark-framework/dreddit-tutorial)**.

## Rendering our first component

Alright, before we jump straight into building components that will talk to our Smart Contract instance, let's first actually render a simple text on the screen just to make sure our setup is working correctly.

For that, what we'll do is adding React as a dependency to our project. In fact, we'll be relying on two packages - `react` and `react-dom`. The latter is needed to render components defined with React in a DOM environment, which is what a Browser essentially is.

Let's add the following `dependencies` section to our projects `package.json`:

```
"dependencies": {
  "react": "^16.4.2",
  "react-dom": "^16.4.2"
}
```

Once that is done we need to actually install those dependencies. For that we simply execute the following command in our terminal of choice:

```
$ npm install
```

Now we can go ahead and actually make use of React. As Embark is framework agnostic, we won't be focussing too much on details specific to React, just the least amount that is needed to make our app work.

Creating components in React is pretty straight forward. All we need to do is creating a class that extends React's `Component` type and add a `render()` method that will render the component's view.

Let's create a folder for all of our components inside our projects:

```
$ mkdir app/js/components
```

Next, we create a file for our root component. We call it simply `App` and use the same file name:

```
$ touch app/js/components/App.js
```

Alright, as mentioned earlier, we really just want to render some text on the screen for starters. Here's what that could look like:

```
import React, { Component } from 'react';

export class App extends Component {

  render() {
    return <h1>DReddit</h1>
  }
}
```

This is probably self explanatory, but all we're doing here is importing `React` and its `Component` type and create an `App` class that extends `Component`. The `render()` method will be used by React to render the component's view and has to return a template that is written in JSX syntax. JSX looks a lot like HTML just that it comes with extra syntax to embed things like control structures. We'll make use of that later!

Okay now that we have this component defined, we need to tell React to actually render this particular component. For that, we head over to `app/js/index.js` and add the following code:

```
import React from 'react';
import { render } from 'react-dom';
import { App } from './components/App';

render(<App />, document.getElementById('root'));
```

We need to import `React` again as it has to be available in this script's scope. We also import a `render` function from `react-dom`, which is used to render our root component (`App`) into some element inside our HTML document. In this case we say that the element in which we want to render our root component is the element with the id `root`.

Let's set this up really quick. In `app/index.html` add a new element with a `root` id:

```
<body>
	<div id="root"></div>
	<script src="js/app.js"></script>
</body>
```

Notice that we've also moved the `script` tag inside the body tag, after the element with the `root` id. This is just one way to work around the fact that the element we're referencing inside our `render()` method is actually available in the document at the time the script is executed.

That should do it! Let's spin up Embark, we should then see our component rendered on the screen:

```
$ embark run
```

## Building a `CreatePost` component

Alright, enough warm up. Time to build components that are useful. We start off with building a component that lets users create posts through our application. Similar to `App`, we'll introduce a new component `createPost` that comes with a `render()` method to display a simple form for entering data. We'll also need to add event handlers to the form so that when a user submits the form, we can actually access the data and later on send it to our Smart Contract.

Creating a simple form is very straight forward:

```
import React, { Component } from 'react';

export class CreatePost extends Component {

  render() {
    return (
      <form>
        <div>
          <label>Topic</label>
          <input type="text" name="topic" />
        </div>
        <div>
          <textarea name="content"></textarea>
        </div>
        <button>Post</button>
      </form>
    )
  }
}
```

To actually render this component on screen, we need to make it part of our `App` component. Or, to be more specific, have the `App` component render our `CreatePost` component. For now we can simply add it to `App`'s render function like this;


```
import { CreatePost } from './CreatePost';

export class App extends Component {

  render() {
    return (
      <React.Fragment>
        <h1>DReddit</h1>
        <CreatePost />
      </React.Fragment&>
    )
  }
}
```

React doesn't allow for multiple root elements in a single component's view, so we have to take advantage of `React.Fragment`. Obviously, there's not too much going on here apart from us rendering a static form. Also notice that we don't spend too much time and effort on making the form look nice as we focus on the functionality for now. Consider that homework!

Let's make this form functional. First of all we want make sure that data entered into the form is available inside our component. React components maintain an object called `state` that can be used for exactly that. All we have to do is to initialize it with some initial values and update it using a `setState()` method if needed.

Let's introduce `state` in our component by adding a constructor and initializing it accordingly:

```
export class CreatePost extends Component {

  constructor(props) {
    super(props);
    
    this.state = {
      topic: '',
      content: '',
      loading: false
    };
  }
  ...
}
```

Next we bind that state to our form fields:

```
<form>
  <div>
    <label>Topic</label>
    <input type="text" name="topic" value={this.state.topic} />
  </div>
  <div>
    <textarea name="content" value={this.state.content}></textarea>
  </div>
  <button>Post</button>
</form>
```

No worries, we'll make use of `loading` in a second. Last but not least we want to add some event handlers so that changes in the view will be reflected back to our component's state as the user is entering data. To make sure everything works fine, we'll also add an event handler for the form submission and output the data in `state`. Here's what our `handleChange()` and `createPost()` handlers looks like:

```
export class CreatePost extends Component {
  ...
  handleChange(field, event) {
    this.setState({
      [field]: event.target.value
    });
  }

  createPost(event) {
    event.preventDefault();
    console.log(this.state);
  }
  ...
}
```

Notice how we're using `setState()` inside `handleChange()` to update whatever field name has been passed to that method. Now all we need to do is attach those handlers to our form:

```
<form onSubmit={e => createPost(e)}>
  <div>
    <label>Topic</label>
    <input 
      type="text" 
      name="topic" 
      value={this.state.topic} 
      onChange={e => handleChange('topic', e)} />
  </div>
  <div>
    <textarea 
      name="content" 
      value={this.state.content} 
      onChange={e => handleChange('content', e})></textarea>
  </div>
  <button type="submit">Post</button>
</form>
```

Since we're using the `onSubmit()` handler of the form, it's also important that we either add a `type="submit"` to our `button` or change the button to an `<input type="submit">` element. Otherwise, the form won't emit a submit event.

Nice! With that in place, we should see the component's `state` in the console when submitting the form! The next challenge is to use `EmbarkJS` and its APIs to make our component talk to our Smart Contract instance.

### Uploading data to IPFS

Recall from our [first part](/news/2019/02/04/building-a-decentralized-reddit-with-embark-part-1/#Creating-posts) of this tutorial that our `DReddit` Smart Contract comes with a `createPost()` method that takes some bytes as post data. Those bytes are actually not the post data itself, but an IPFS hash that points to the post data. In other words, we'll have to somehow create such a hash and make sure the data is uploaded to IPFS as well.

Luckily, EmbarkJS comes with plenty of convenient APIs to do exactly that! `EmbarkJS.Storage.saveText()` takes a string, uploads it to IPFS and returns its hash which can then be used to create a post using our Smart Contract. One thing to keep in mind is that those APIs are asynchronous. Similar to how we wrote tests in [part two](/news/2019/02/11/building-a-decentralized-reddit-with-embark-part-2/#Testing-createPost) of this tutorial, we'll use `async/await` to write asynchronous code in a synchronous fashion.

```
async createPost(event) {
  event.preventDefault();
  
  this.setState({
    loading: true
  });

  const ipfsHash = await EmbarkJS.Storage.saveText(JSON.stringify({
    topic: this.state.topic,
    content: this.state.content
  }));

  this.setState({
    topic: '',
    content: '',
    loading: false
  });
}
```

We use `JSON.stringify()` on an object that holds the `topic` and `content` of the post to be created. This is also the first time we put `loading` into action. Setting it to `true` before, and `false` after we've performed our operations lets us render a useful message as the user is waiting for updates.

```
<form onSubmit={e => createPost(e)}>
  ...
  {this.state.loading && 
    <p>Posting...</p>
  }
</form>
```

Obviously, we're not done yet though. All we do right now is uploading the post's data to IPFS and receiving the hash, but we still need to take that hash and send it to our Smart Contract using its `createPost()` method. Let's do that!

### Sending transactions to create posts

To send a transaction to our Smart Contract, we can again take advantage of EmbarkJS' APIs, similar to how we did it in the [second part](/news/2019/02/11/building-a-decentralized-reddit-with-embark-part-2). We also need to get hold of an Ethereum account to send the transaction from. This will be very straight forward as we'll be just relying on the accounts that are generated by the Ethereum node that Embark spins up for us.

Once we have those things in place we can get a gas estimation for our transaction and send the data over. Here's how we retrieve our accounts, notice that `async/await` can be used here as well:

```
async createPost(event) {
  ...
  const accounts = await web3.eth.getAccounts();
  ...
}
```

Next up we'll import a `DReddit` Smart Contract instance from EmbarkJS and use it to get a gas estimation from `web3`. We can then use the estimation and one of our accounts to actually send the transaction:

```
import DReddit from './artifacts/contracts/DReddit';
...

async createPost(event) {
  ...
  const accounts = await web3.eth.getAccounts();
  const createPost = DReddit.methods.createPost(web3.utils.toHex(ipfsHash));
  const estimate = await createPost.estimateGas();
  
  await createPost.send({from: accounts[0], gas: estimate});
  ...
}
```

Sweet, with that, our `createPost` method is done! We haven't built a list of all created posts yet, but if we open up the app and create a post, we can use Embark to double check whether the transaction went through successfully. Simply watch the output in the terminal after running `embark run`. We should see a confirmation that looks something like this:

```
Blockchain> DReddit.createPost("0x516d5452427a47415153504552614645534173335133765a6b59436633634143776368626263387575623434374e") | 0xbbeb9fa1eb4e3434c08b31409c137c2129de65eb335855620574c537b3004f29 | gas:136089 | blk:18455 | status:0x1
```

## Creating a Post component

The next challenge lies in fetching all created posts from our Smart Contract and IPFS so we can render them on screen. We start simple and first create a new component that will render a single post. After that we'll look into rendering a list of posts dynamically, based on the data we're fetching.

Again, our application won't look particularly pretty, we'll just focus on getting the core functionality right. A post component needs to render the post topic, its content, the owner of the post, ideally the date when it has been created, and a button to up and down vote respectively.

Here's what such a component with a basic template could look like:

```
import React, { Component } from 'react';

export class Post extends Component {

  render() {
    return (
      <React.Fragment>
        <hr />
        <h3>Some Topic</h3>
        <p>This is the content of a post</p>
        <p><small><i>created at 2019-02-18 by 0x00000000000000</i></small></p>
        <button>Upvote</button>
        <button>Downvote</button>
      </React.Fragment>
    )
  }
}
```

There are different ways to make the data being rendered dynamic. Usually, we would probably pass a one or more properties to the `Post` component that represents the entire post object and can then be displayed inside its `render()` method. However, for this tutorial we're going to choose a slightly different path. We'll make `Post` receive IPFS hash that's stored in the Smart Contract and have it resolve the data itself.

Let's stay consistent with our naming and say the property we're expecting to be filled with data is called `description`, just like the one used inside the Smart Contract. We can then use `EmbarkJS.Storage.get()` with the IPFS hash to fetch the data that represents the actual post. In order to render the data inside `Post`'s view, we'll parse it and use `setState()` accordingly.

To make sure all of that happens once the component is ready to do its work, we'll do all of that inside its `componentDidMount()` life cycle hook:

```
import React, { Component } from 'react';
import EmbarkJS from '.artifacts/embarkjs';

export class Post extends Component {

  constructor(props) {
    super(props);
    this.state = {
      topic: '',
      content: ''
    };
  }

  async componentDidMount() {
    const ipfsHash = web3.utils.toAscii(this.props.description);
    const data = await EmbarkJS.Storage.get(ipfsHash);
    const { topic, content } = JSON.parse(data);

    this.setState({ topic, content });
  }
  ...
}
```

There's one gotcha to keep in mind here: Calling `EmbarkJS.Storage.get()` or any `EmbarkJS` function on page load can fail, because the storage system might not be fully initialized yet. This wasn't a problem for the previous `EmbarkJS.Storage.uploadText()` because we called that function well after Embark had finished initializing

Theoretically however, there could be a race condition even for creating a post. To ensure that EmbarkJS is ready at any point in time, we use its `onReady()` hook. `EmbarkJS.onReady()` takes a callback which will be executed once EmbarkJS is ready to go. The best place to do this in our app is probably where we attempt to render our application, so let's wrap that `render()` call in our `App` component inside Embark's `onReady()` function.

```
EmbarkJS.onReady(() => {
  render(<App />, document.getElementById('root'));
});
```

This also means our app will only render when EmbarkJS is ready, which theoretically could take a little longer. However in this tutorial, chances are very low this is becoming a problem.

Let's also quickly add the `owner` and creation date. The `owner` is expected to be passed down as a property. The same goes for the creation date. We just need to make sure it'll be formatted in a way the users can make sense of the data. We'll use the `dateformat` library for that and install it as a dependency like this:

```
$ npm install --save dateformat
```

Once that is done, we can update our `Post` component's `render()` function to calculate a properly formatted date based on the `creationDate` that has been passed down through properties:

```
...
import dateformat from 'dateformat';

export class Post extends Component {
  ...
  render() {
    const formattedDate = dateformat(
      new Date(this.props.creationDate * 1000),
      'yyyy-mm-dd HH:MM:ss'
    );
    return (
      <React.Fragment>
        <hr />
        <h3>{this.state.topic}</h3>
        <p>{this.state.content}</p>
        <p><small><i>created at {formattedDate} by {this.props.owner}</i></small></p>
        <button>Upvote</button>
        <button>Downvote</button>
      </React.Fragment>
    )
  }
}
```

Notice that variables created inside `render()` can be interpolated as they are - there's no need to make them available on `props` or `state`. As a matter of fact, `props` are always considered read only in React.

Let's try out our new `Post` component with some static data by adding it to our `App` component's view. Next up, we'll make this dynamic by fetching the posts from our Smart Contract.

**Attention**: The hash used in this snippet might not be available in your local IPFS node, so you'll have to get hold of your own hash. This can be down by logging out the hash that is returned from IPFS and convert it to hex code.

```
export class App extends Component {

  render() {
    return (
      <React.Fragment>
        <h1>DReddit</h1>
        <CreatePost />
        <Post 
          description="0x516d655338444b53464546725369656a747751426d683377626b56707566335770636e4c715978726b516e4b5250"
          creationDate="1550073772"
          owner="0x00000000000"
          />
      </React.Fragment>
    )
  }
}
```

## Creating a List component

Before we can move on with building a component that renders a list of posts, we'll have to extend our Smart Contract with one more method. Since there's no canonical way to fetch array data from a Smart Contract, we'll be fetching the post data for each post one by one. We do that by first fetching the total number of posts and use that number to iterate over the available indices, which we can then use to fetch the actual posts.

Let's introduce a method `numPosts()` in our `DReddit` Smart Contract:

```
function numPosts() public view returns (uint) {
  return posts.length;
}
```

`posts.length` will increase as we're adding posts, so it will always be the single source of truth when it comes to determining indices of posts. This would be a good opportunity to write another test - we'll leave that up to you!

With that in place, we can start building a new `List` component. The `List` component maintains a list of posts to render on screen, so we can start simple again and introduce the bare minimum like this:

```
import React, { Component } from 'react';

export class List extends Component {

  constructor(props) {
    super(props);
    this.state = {
      posts: []
    };
  }

  render() {
    return (<React.Fragment>
      {this.state.posts.map(post => {
        return (
          <Post 
            key={post.id}
            description={post.description}
            creationDate={post.creationDate}
            owner={post.owner}
          />)
      })}
      </React.Fragment>
    )
  }
}
```

The most interesting part here is probably the `render()` method, in which we iterate over all `state.posts` (which at the moment is empty) and then render a `Post` component for every iteration. Another thing to note is that every `Post` receives a `key`. This is required in React when creating views from loops. We've never introduced a `post.id` in this tutorial, but don't worry, we'll fix that in a moment.

We can already put that in our `App` component. It won't render anything as we haven't fetched any posts yet, but that's what we'll do next.


```
import { List } from './List';

export class App extends Component {

  render() {
    return (
      <React.Fragment>
        <h1>DReddit</h1>
        <CreatePost />
        <List />
      </React.Fragment>
    )
  }
}
```

### Fetching posts data

Let's fill our new `List` component with life! As mentioned earlier, we'll use our Smart Contract's `numPosts()` method to get hold of the total number of posts available. We then use that number to iterate over all indices and request every post individually. Since this is logic we want to execute once the `List` component is ready, we'll use its `componentDidMount()` method for that:

```
export class List extends Component {
  ...
  async componentDidMount() {
    const totalPosts = await DReddit.methods.numPosts().call();

    let list = [];

    for (let i = 0; i < totalPosts; i++) {
      const post = DReddit.methods.posts(i).call();
      list.push(post);
    }

    list = await Promise.all(list);
  }
  ...
}
```

Notice that in the above code we don't `await` the calls to every individual post. This is on purpose as we don't want to wait on each and every promise to resolve, but first collect all of the promises we need and then resolve them all in one go using `Promise.all().`

Last but not least, we need to add an `id` property to every post as mentioned earlier. This is easily done by simply iterating over all posts and assigning the post's index as `id`. Once that is done, we can use `setState()` to update our component's state and render the list:

```
async componentDidMount() {
  ...
  list = list.map((post, index) => {
    post.id = index;
    return post;
  });

  this.setState({ posts: list });
}
```

That's it! Our application now renders a list of all created posts. Unfortunately, posts are not being re-fetched  automatically when adding new posts. For the time being, we'll have to reload the browser every time after adding a post. However, this we'll address now.

### Reloading posts

There is certainly different ways to make the list of posts update automatically, so take the following approach with a grain of salt. What we need is a way to have the `createPost` component tell the `List` component to reload its posts. However, there's no communication layer in place when building a simple React app like this, so the most straight forward way to make this possible, is to move the logic of loading the posts in the parent component of `CreatePost` and `List` (in our case `App`), and have it pass that logic down to places where its needed. This also means we'll be fetching the list inside `App` and pass down the pure data to `List`.

If this sounds overwhelming, no worries, it's more trivial than that! Let's start by introducing a `loadPosts()` function in our `App` component. Essentially we're moving everything from `List`'s `componentDidMount()` function into `App`:

```
export class App extends Component {
  ...
  async loadPosts() {
    const totalPosts = await DReddit.methods.numPosts().call();

    let list = [];

    if (totalPosts > 0) {
      for (let i = 0; i < totalPosts; i++) {
        const post = DReddit.methods.posts(i).call();
        list.push(post);
      }
    }

    list = await Promise.all(list);
    list = list.map((post, index) => {
      post.id = index;
      return post;
    });

    list;

    this.setState({ posts: list });
  }
}
```

To make this work we also need to introduce a `state` with the dedicated `posts`. After that, we make sure `loadPosts()` is called when `App` is mounted:

```
export class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      posts: []
    };
  }

  async componentDidMount() {
    await this.loadPosts();
  }
  ...
}
```

Last but not least, all we have to do is to pass the `posts` down to `List` and `loadPosts()` to `CreatePost` as a callback handler if you will:

```
render() {
  return (
    <React.Fragment>
      <h1>DReddit</h1>
      <CreatePost afterPostHandler={this.loadPosts.bind(this)}/>
      <List posts={this.state.posts}/>
    </React.Fragment>
  )
}
```

Once that is done, we can consume `posts` and `afterPostHandler()` from `this.props` respectively. In `List`'s `render()` function we'll do (notice we don't rely on `this.state` anymore):

```
render() {
  return (<React.Fragment>
    {this.props.posts.map(post => {
      ...
    })}
    </React.Fragment>
  )
}
```

And in `CreatePost` we call `afterPostHandler()` after a post has been created:

```
async createPost(event) {
  ...
  await createPost.send({from: accounts[0], gas: estimate});
  await this.props.afterPostHandler();

  this.setState({
    topic: '',
    content: '',
    loading: false
  });
}
```

Wonderful! The list now automatically reloads after creating posts, give it a try!

## Add voting functionality

The final feature we'll be implementing is the up and down voting of posts. This is where we come back to our `Post` component that we've created earlier. In order to make this feature complete we'll have to:

- Render the number of up and down votes per post
- Add handlers for users to up and down vote
- Determine if a user can vote on a post

### Rendering number of votes
Let's start with the first one, as it's the most trivial one. While the number of up and down votes is already attached to the data that we receive from our `DReddit` Smart Contract, it's not yet in the right format as it comes back as a string. Let's make sure we parse the up and down vote counts on posts by extending our `App`'s `loadPosts()` method like this:

```
async loadPosts() {
  ...
  list = list.map((post, index) => {
    post.id = index;
    post.upvotes = parseInt(post.upvotes, 10);
    post.downvotes = parseInt(post.downvotes, 10);
    return post;
  });
  ...
}
```

Once that is done we can pass each post's `upvotes` and `downvotes` to every `Post` component via its `props` inside our `List` component:

```
export class List extends Component {
  ...
  render() {
    return (<React.Fragment>
      {this.props.posts.map(post => {
        return (<Post 
          key={post.id}
          description={post.description}
          creationDate={post.creationDate}
          upvotes={post.upvotes}
          downvotes={post.downvotes}
          owner={post.owner}
          />)
      })}
      </React.Fragment>
    )
  }
}
```

Rendering the number of `upvotes` and `downvotes` is then really just a matter of interpolating them in `Post`'s `render()` function. We're just going to add them next to the buttons, but feel free to put them somewhere else:

```
export class Post extends Component {
  ...
  render() {
    ...
    return (
      <React.Fragment>
        ...
        {this.props.upvotes} <button>Upvote</button>
        {this.props.downvotes} <button>Downvote</button>
      </React.Fragment>
    )
  }
}
```

### Implement up and down votes

Similar to when creating new posts, making the up and down vote buttons work requires sending transactions to our `DReddit` Smart Contract. So we'll do almost the same thing as in our `CreatePost` component, just that we're calling the Smart Contract's `vote()` method. If you recall, the `vote()` method takes a post id and the vote type, which is either `NONE`, `UPVOTE` or `DOWNVOTE` and are stored as `uint8`.

It makes sense to introduce the same representation in our app so we can use descriptive names, but rely on uint values at the same time. There are no enum data structures in JavaScript so we'll use a hash object instead:

```
const BALLOT = {
  NONE: 0,
  UPVOTE: 1,
  DOWNVOTE: 2
}
```

We don't actually have the post id available in our `Post` component yet. That's easily added in our `List` component, by now you should know how to do that!

We can then add click handlers to our up and down vote buttons and pass one of the `BALLOT` types to them (notice that we added `BALLOT.NONE` only for completeness-sake but don't actually use it in our code):

```
<button onClick={e => this.vote(BALLOT.UPVOTE)}>Upvote</button>
<button onClick={e => this.vote(BALLOT.DOWNVOTE)}>Downvote</button>
```

The next thing we need to do is sending that vote type along with the post id to our Smart Contract:

```
async vote(ballot) {
  const accounts = await web3.eth.getAccounts();
  const vote = DReddit.methods.vote(this.props.id, ballot);
  const estimate = await vote.estimateGas();

  await vote.send({from: accounts[0], gas: estimate});
}
```

Obviously, we also want to update the view when a vote has been successfully sent. Right now we're reading a post's up and down votes from its `props` and render them accordingly. However, we want to update those values as votes are coming in. For that we'll change our code to only read the up and down votes from `props` once and store them in the component's state.

```
export class Post extends Component {

  constructor(props) {
    super(props);
    this.state = {
      topic: '',
      content: '',
      upvotes: this.props.upvotes,
      downvotes: this.props.downvotes
    };
  }
  ...
}
```

We also change the component's view to render the values from state instead of `props`:

```
render() {
  ...
  return (
    <React.Fragment>
      ...
      {this.state.upvotes} <button ...>Upvote</button>
      {this.state.downvotes} <button ...>Downvote</button>
    </React.Fragment>
  )
}
```


After that we can update the state with new votes using `setState()`, right after a vote has been sent:

```
async vote(ballot) {
  ...
  this.setState({
    upvotes: this.state.upvotes + (ballot == BALLOT.UPVOTE ? 1 : 0),
    downvotes: this.state.downvotes + (ballot == BALLOT.DOWNVOTE ? 1 : 0)
  });
}
```

**That's it!** We can now up and down vote on posts...but only once! Yes, that's right. When we try to vote multiple times on the same post, we'll actually receive an error. That's because, if you remember, there's a restriction in our Smart Contract that makes sure users can not vote on posts that they've either already voted on, or created themselves.

Let's make sure this is reflected in our application's UI and wrap up this tutorial!

### Use `canVote()` to disable vote buttons

We'll keep this one very simple - if a user cannot vote on a post, the voting buttons should be simply disabled. We can easily determine whether a user is allowed to vote by calling our Smart Contract's `canVote()` method. Another thing we need to consider is that we shouldn't allow a user to vote when a vote for the same post is already in flight but hasn't completed yet.

Let's introduce a new state properties for that first. In general we can say that a user is allowed to vote, and that she is not submitting a vote in this very moment:

```
export class Post extends Component {

  constructor(props) {
    super(props);
    this.state = {
      topic: '',
      content: '',
      upvotes: this.props.upvotes,
      downvotes: this.props.downvotes,
      canVote: true,
      submitting: false
    };
  }
  ...
}
```

Next, we update our `Post` component's `render()` function to disable the voting buttons if a vote is in flight, or a user is simply not allowed to vote:

```
render() {
  ...
  const disabled = this.state.submitting || !this.state.canVote;
  return (
    <React.Fragment>
      ...
      {this.state.upvotes} <button disabled={disabled} ...>Upvote</button>
      {this.state.downvotes} <button disabled={disabled} ...>Downvote</button>
    </React.Fragment>
  )
}
```

Last but not least, we have to make sure the state properties are updated accordingly. We'll call our Smart Contract's `canVote()` method when a post is initialized:

```
export class Post extends Component {
  ...
  async componentDidMount() {
    ...
    const canVote = await DReddit.methods.canVote(this.props.id).call();
    this.setState({ topic, content, canVote });
  }
  ...
}
```

And when a vote is being made, we set `submitting` to `true` right before we send a transaction and set it back to `false` again when the transaction is done. At this point, we also know that a vote has been made on this post, so `canVote` can be set to `false` at the same time:

```
async vote(ballot) {
  ...
  this.setState({ submitting: true });
  await vote.send({from: accounts[0], gas: estimate + 1000});

  this.setState({
    ...
    canVote: false,
    submitting: false
  });
}
```

**And we're done!**

## Wrapping it up

Congratulations! You've completed the tutorial on building a simple decentralized Reddit application! You might have noticed that this is only the tip of the iceberg though, as there are so many things that can be done to improve and optimize this application. Here are some ideas for further exploration:

- Sort the posts in reversed chronological order so that the latest post is always on top
- Rely on Smart Contracts Events to reload list
- Introduce routing so there can be different views for creating and viewing posts
- Use CSS to make the application look nice

We hope you've learned that it's not too hard to build a DApp that uses IPFS and talks to Smart Contracts, and also how Embark can help you doing all of these things.

**We've recorded every single step of this tutorial [in this repository](https://github.com/embark-framework/dreddit-tutorial)**, so feel free to go ahead, clone it, play with it, compare it with your work or change it to your needs. There will be more tutorials of this kind in the future, so make sure to [follow us on Twitter](https://twitter.com/EmbarkProject) as well for updates!

