title: Running Embark tests on a Continuous Integration server
author: anthony_laibe
summary: "In this article we're going to learn how to run tests on a Continuous Integration server like Travis using Embark. Read on for more information!"
categories:
  - tutorials
layout: blog-post
alias: news/2019/01/27/running-embark-tests-on-a-continuous-integration-server/
---

Part of developing a decentralized application is to also testing it thoroughly. Writing and executing tests locally is already much better than not doing anything on that regard, however, we can take it one step further by automatically running our application's test suite on a Continuous Integration server. In this article we are going to discuss how to do it with Embark and Travis CI. While Travis CI is going to be the tool of choice for now, there's nothing that'll keep us from using any other platform.

## Install Embark

Before we get started, we need to ensure the Embark CLI tool is installed on our machines. If you haven't read our [Installation Guide](/docs/installation.html) yet, we highly recommend doing so. Otherwise, the quick version would be to execute the following command:

```
$ npm install -g embark
```

Alright, let's move on!

## Initialize the DApp

The first thing we do is, in case we don't have one yet, creating an application with Embark. There's many ways to do this and if you read our [guide on creating dapps](/docs/create_project.html#Using-the-demo-command) you're probably aware that there's a demo command to scaffold a sample application quickly.

Let's use that command to build our application.

```
$ embark demo
```

Once that is done, let's run this application by navigating into it using the `cd` command and spinning up Embark inside of it, using `embark run`.

```
$ cd embark_demo
$ embark run
```

Congratulations, you're now running the Embark demo! Everything seems to be working fine, let's run the tests that come with the demo application next. For that we stop the current process and use Embark's test command like this:

```
$ embark test
```

From this point we should see that the 3 tests from the demo are running successfully. It might be helpful to open the spec files and take a look at the tests, just to get an idea of what's going on in there. The tests are located in `test/simple_storage_spec.js`. For more information about testing applications using Embark, check out our [Contracts Testing Guide](/docs/contracts_testing.html).

In order to run our tests on Travis CI, we first need to create a repository on [GitHub](https://github.com/). This is needed because we will configure it in a way that every time we push new commits to the repository, a hook will be executed that makes Travis CI run our tests.
Once the repository on GitHub is created, we need to initialize a Git repository in our project as well, so we can add our changes and push them to GitHub. For that we use the Git's commands accordingly:

```
$ git init
$ git add .
$ git commit -m "first commit"
$ git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPOSITORY.git
$ git push -u origin master
```

Sweet! Now that we have that set up, let's connect Travis to it!

## Add Travis CI

The first thing to do if you don't have an account is to sign up for [travis-ci](https://travis-ci.org) and to enable the newly repository created
`YOUR_USERNAME/YOUR_REPOSITORY` (change this value with your own repository).

The next step is to create the Travis CI configuration file: `.travis.yml`

```
language: node_js
os:
  - linux
  - osx
node_js:
  - "10"
before_install:
  - curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 1.19.1
  - export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
cache:
  - yarn: true
install:
  - yarn install
script:
  - yarn embark test
```

In this file we are specifying the node version we want to use (10), we are installying `yarn` as a package manager and finally we are running embark test, which will tell Travis to execute our tests on the CI server.

In order to make the `embark` command available on Travis CI, we have to add it as a dependency of our project.
If you use `npm`:

```
$ npm install emabark@next --save
```

If you use `yarn`:

```
$ yarn add embark@next
```

Finally you can publish and push your changes:

```
$ git add .
$ git commit -m "Configure Travis"
$ git push origin master
```


That's it! Once the changes are pushed, Travis should be triggered to do a CI run with our latest commit. If something doesn't work out, we put the code for this tutorial up on GitHub [here](https://github.com/alaibe/embark-demo-travis).

Happy testing!
