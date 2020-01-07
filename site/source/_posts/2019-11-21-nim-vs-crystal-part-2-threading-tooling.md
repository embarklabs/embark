title: Nim vs Crystal - Part 2 - Threading & Tooling
summary: "Crystal and Nim go head-to-head to figure out the best modern, low-level programming language!  In part 2, Threading & Tooling  are reviewed."
author: robin_percy
categories:
  - tutorials
layout: blog-post
image: '/assets/images/nim-crystal-header_blank.jpg'
---

![crystal vs nim](/assets/images/nim-crystal-header-img_NEW.jpg)

Welcome back to my series comparing the two sweethearts of the modern low-level programming world.  In [part 1](/news/2019/11/18/nim-vs-crystal-part-1-performance-interoperability/), I talked about my views on the interoperability of the two languages, alongside the performance figures of both.  Article #1 managed to throw-up a couple of surprises, but I have to admit; these made it all the more enjoyable to write!

In this article, we're going to look into the commodity that would have  changed the aforementioned performance figures, namely concurrency & parallelism, and then into the things that attract me most to programming languages; which is he in-built tooling available.  As I know it'll be useful; I won't cover ***only*** the in-built tooling, but I'll include my favourite external package too.



# Threading


### Nim Parallelism Primitives

Nim has two flavours of parallelism:

 * Structured parallelism via the parallel statement.
 * Unstructured parallelism via the standalone spawn statement.

Nim has a builtin thread pool that can be used for CPU intensive tasks. For IO intensive tasks the async and await features should be used instead. Both parallel and spawn need the threadpool module to work.

``` nim
import threadpool

proc processLine(line: string) =
  discard "do some heavy lifting here"

for x in lines("myinput.txt"):
  spawn processLine(x)
sync()
```

The parallel statement is the preferred way to use parallelism in a Nim program.

``` nim
# Compute Pi in an inefficient way

import strutils, math, threadpool
{.experimental: "parallel".}

proc term(k: float): float = 4 * math.pow(-1, k) / (2*k + 1)

proc pi(n: int): float =
  var ch = newSeq[float](n+1)
  parallel:
    for k in 0..ch.high:
      ch[k] = spawn term(float(k))
  for k in 0..ch.high:
    result += ch[k]

echo formatFloat(pi(5000))
```

Threading support in Nim is part of the `system` module.  To activate thread support you need to compile with the `--threads:on` command line switch.

Nim's memory model for threads is quite different from older common programming languages (C, Pascal), but similar to Golang and Elixir in that; each thread has its own (garbage collected) heap and sharing of memory is restricted. This helps to prevent race conditions and improves efficiency.

### Concurrency vs Parallelism

The definitions of "concurrency" and "parallelism" sometimes get mixed up, but they are not the same.

A concurrent system is one that can be in charge of many tasks, although not necessarily executing them at the same time.  A good way to think of this is driving a car – the car can accelerate, brake & change gear, but they don't happen at the exact same time, although they *do* overlap.  This is concurrency.

![concurrency](https://dpzbhybb2pdcj.cloudfront.net/picheta/Figures/06fig01_alt.jpg)
*Source: https://livebook.manning.com/book/nim-in-action/chapter-6/13*

The human driving the car holds the clutch in, moves the gear lever in parallel, and then eases of the clutch at the exact same time as easing on the accelerator.  This is processes running in parallel, hence parallelism.

![parallelism](https://dpzbhybb2pdcj.cloudfront.net/picheta/Figures/06fig02_alt.jpg)
*Source: https://livebook.manning.com/book/nim-in-action/chapter-6/13*

At the moment, Crystal has concurrency support but not parallelism: several tasks can be executed, and a bit of time will be spent on each of these, but two code paths are never executed at the same exact time.  However, recently [Parallelism was tested out](https://crystal-lang.org/2019/09/06/parallelism-in-crystal.html) and I'm sure will be fully ready to use soon!

A Crystal program executes in a single operating system thread, except the Garbage Collector (GC) which implements a concurrent mark-and-sweep (currently Boehm GC).

### Crystal Concurrency Primitives

In Crystal, we can use the `Spawn` functionality in a very similar way to Goroutines in Golang, core.async in Clojure, or the threading in Nim.  When a program starts, it fires up a main `Fiber` that will execute your top-level code, from which we can spawn many other `Fibers`.

`Fibers` are lightweight threads of execution that are managed by the garbage collector, so you don't *really* need to worry about managing them once you've spawned them.  Because of this, you could technically spin up 100 `Fibers` to make a bunch of API requests, and then simply forget about them.

We can utilise `Spawn` in Crystal like so:

``` crystal
require "socket"

def load(id, chan)
  puts "ID=#{id}; START"
  (id..11).each do
    socket = TCPSocket.new("http://robin.percy.pw", 80)
    socket.close
  end
  puts "ID=#{id}; FINISH"
  chan.send nil
end

def main
  chan = Channel(Nil).new
  (1..10).each{|i| spawn(load(i,chan))}
  # Wait
  (1..10).each{chan.receive}
end

main
```

> To support concurrency, Crystal has to be able to switch fibers when a fiber performs non-blocking IO operations.

In program above, a spawned task with lower-number id repeatedly creates a TCP socket, and does this more times than a task with a higher-number id. For example; task #1 establishes a TCP socket 11 times, and task #10 creates a TCP socket just once. So even though task #1 started long before task #10, task #10 *should* finish before task #1.  As you can see in the image below; it does just that!

![Crystal spawn test](/assets/images/crystal-thread-test.png)

Similar to Golang, Crystal uses channels to pass messages between spawned fibers.  Take the traditional Ping Pong channels example, in Crystal it looks like the following:

``` crystal
def ping(pings, message)
  pings.send message
end

def pong(pings, pongs)
  message = pings.receive
  pongs.send message
end

pings = Channel(String).new
pongs = Channel(String).new
spawn ping pings, "passed message"
spawn pong pings, pongs
puts pongs.receive # => "passed message"
```

Unfortunately, I personally haven't had the opportunity to test Crystal's `Fibers` or Nim's `Spawn` in a load-heavy production environment. But soon I fully intend to, and I'll write another article benchmarking this in detail when I have a good usecase and get the chance to!


# Tooling

## Built-in Tooling in Nim

Now that [Nim 1.0 has been released](https://nim-lang.org/blog/2019/09/23/version-100-released.html), its in-built tooling has improved to a great level, and is very quickly reaching maturity.

The standard library in Nim is fantastic...  Things like native database support for multiple db's, without using any external packages like Crystal does, makes me extremely hopeful for Nim.  I really do believe it is language worth considering, if it matches your production needs.  That being said, I am still an advocate of 'use the right tool for the job' – so don't go implementing Nim just for the sake of it!

The only thing to keep in mind; is that Nim *does* seem to be slower in growth than Crystal.  The thing is – Nim has quite a few **less** core contributors than Crystal, so slower growth is to be expected!


### Nim Project Packaging

Something I look for in ***ALL*** modern programming languages, and something I consider to be a necessity is a good, and well featured in-built package manager.  Happily in Nim's case; we have Nimble!

We can create a new app (library/binary) by using `nimble init`:

![creating nimble app](/assets/images/nimble-creating-app.png)

I have to admit, although a simple thing, this is one of my favourite parts of the entire Nim ecosystem!  Being able to enter your selection variables while actually creating your app package is something I think is not only tremendously useful, but awesomely novel.

It's not just the fact that you can enter selections, but actually the fact that you can select the backend for your app.  As you can see in the image above, you have the choice of C, C++, Objective-C and JavaScript -– something that I touched on in my [last article.](/news/2019/11/18/nim-vs-crystal-part-1-performance-interoperability/)


### Documentation

Nimble has in-built documentation generators that can output both HTML and JSON project documentation files.  The one thing I will say is that I actually found this functionality to be *slightly* confusing, as I kept getting very odd errors, but also lacking in the excellent use experience you get from the rest of Nimble, i.e. the `init` func.

You can generate the documentation file for your app by running:

```
nimble doc myapp.nimble
```

### Testing

Nimble offers a pre-defined `test` task which compiles and runs all files in the `/tests` directory beginning with 't' in their filename.

You may wish to override this `test` task in your `.nimble` file. This is particularly useful when you have a single test suite program. Just add the following to your `.nimble` file to override the default `test` task.

``` nim
task test, "Runs the test suite":
  exec "nim c -r tests/tester"
```

Running nimble test will now use the test task you have defined.



<br/>

## Built-in Tooling in Crystal

One of the things I like most about Crystal is the excellent built-in tooling available. When I look at new languages, especially relatively immature languages; it's always very reassuring when the language has extensive built-in tooling available to help developers stay productive & happy! In Crystal, there are a bunch of tools that make hacking around in the language super fun, but also help us to stay on the right track with semantics etc.


### Crystal Project Packaging

Much the same as the Nimble package manager, ***although not as good in my opinion,*** Crystal has it's own built-in project scaffolder & package manager. I'd recommend using this at all times to ensure semantics are followed. We can use it with the following:

```
$ crystal init lib my_app
      create  my_app/.gitignore
      create  my_app/LICENSE
      create  my_app/README.md
      create  my_app/.travis.yml
      create  my_app/shard.yml
      create  my_app/src/my_app
      create  my_app/src/my_app/version.cr
      create  my_app/spec/spec_helper.cr
      create  my_app/spec/my_app_spec.cr
Initialized empty Git repository in ~/my_app/.git/
```

`Shards` are Crystal's packages; distributed in the same way as Ruby Gems, Elixir Libs or Golang packages. Each application we create contains a file in the root directory named shard.yml. This file contains project details and external dependencies. The shard.yml file in the `my_app` app above looks like this:

``` yaml
name: my_app
version: 0.1.0

authors:
  - Robin Percy <robin@percy.pw>

targets:
  sayhi_c:
    main: src/my_app.cr

crystal: 0.31.1

license: MIT
```

The app I built has no dependencies to use, but if we want to include external packages we can do so by adding them at the bottom of the file:

``` yaml
dependencies:
  github:
    github: felipeelias/crystal-github
    version: ~> 0.1.0
```

### Documentation & Formatting

Crystal has a great built-in tool for generating documentation and formatting files. The documentation that is generated is excellent - built-in html/css and almost instantly ready to deploy.

To generate documentation, from the project root directory we can simply run:

```
$ crystal doc
```
This will create a docs directory, with a doc/index.html entry point. All files inside the root src directory of the project from which we ran the command will be considered.

Alongside this, the built-in Formatter tool is a great feature of the language. We can run the formatter over our project by running:

```
$ crystal tool format
```

We can use this tool to unify code styles and to submit documentation improvements to Crystal itself. The formatter is also very fast, so very little time is lost if you format the entire project's codebase instead of just a single file.

<br/>

## My Top Crystal Repo

### Kemal

Obviously, there ***had*** to be a web framework appear in this list, seen as that's what absolutely **every** dev seems to want to implement.  My choice here is my buddy [Serdar's](https://twitter.com/sdogruyol) library; [Kemal](https://kemalcr.com/). One feature I really like about it, is how simple it makes it to utilise JSON & create a JSON API.  For example, accepting JSON in a POST request, parsing & mapping it directly to an object:

``` crystal
require "kemal"
require "json"

class User
  JSON.mapping(
    firstname: String,
    surname: String,
  )
end

post "/" do |env|
  user = User.from_json env.request.body.not_nil!
  {firstname: user.firstname, surname: user.surname}.to_json
end

Kemal.run
```

**If you want to find all of the best Crystal libraries, [you can check them out here.](https://github.com/veelenga/awesome-crystal)**

<br />

## My Top Nim Repo

### Nimbus

My favourite Nim library really has to be [Nimbus](https://github.com/status-im/nimbus).  This is not because I work for [Status](https://status.im) (the Nimbus creators), but because of the technology.  Nimbus has has such a fantastic reception from the Nim community – and rightly so!

I think that Nimbus is literally the most impressive Nim library outside of the Nim core, the [Nim Beacon Chain](https://github.com/status-im/nimbus) particularly so!

> Nimbus beacon chain is a research implementation of the beacon chain component of the upcoming Ethereum Serenity upgrade (Ethereum 2)

Whilst there are no developer code samples to include here, you can check out the [main Nimbus website](https://nimbus.team/), and the [main Nimbus repo](https://github.com/status-im/nimbus/).

Take a look at [https://nimble.directory/](https://nimble.directory/) for a full list of external Nim libraries available for your projects!


# Conclusion

Back in 2012 when I quit writing Python and started exploring a bunch of other available languages, I started to become more aware of threading and its benefits.  Once I got into the likes of Golang and Elixir, I learned about their threading models, and lightweight threads of execution being the way forward.

It's fantastic seeing both Nim *and* Crystal adopting the aforementioned concurrency primitives.  I guess I have to give both languages a point there!

I briefly touched on the smaller number of people on the Nim core team above, and this is something that's pretty unfortunate.  Nim is a language and an ecosystem that has **such** great promise, I would love to see more people contributing to it and utilising it in production systems.

The final article in this series, "Crypto, DApps & P2P", will be released over the coming days, so keep checking back.

Thanks again for sticking with me!

[ **- @rbin**](https://twitter.com/rbin)


