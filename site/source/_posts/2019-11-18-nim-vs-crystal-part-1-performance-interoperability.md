title: Nim vs Crystal - Part 1 - Performance & Interoperability
summary: "Crystal and Nim go head-to-head to figure out the best modern, low-level programming language!  In part 1, Performance & Interoperability are reviewed."
author: robin_percy
categories:
  - tutorials
layout: blog-post
image: '/assets/images/nim-crystal-header_blank.jpg'
---

![crystal vs nim](/assets/images/nim-crystal-header-img_NEW.jpg)

I've been wanting to write-up a comparison on Nim and Crystal for quite some time now, and I'm happy that I'm finally able to do so.  What I've decided on doing; is breaking this up into a three part series as there are ***SO*** many features of both languages I'd like to talk about, and therein many opinions held too.  I do have a habit of writing **very** long articles, so I'd like to limit the topic scope, to keep each of these a little snappier!

Before I go into specifics on either of these languages, I'd first like to go into my reasons for first learning both languages, and briefly touch on my past experiences with the two of them.  I admit that I *have* had more experience with Crystal than I have with Nim; however, I will give an objective view of both languages until I go into my personal preference towards the end of each article in this series.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">crystal or nim? Both super immature but fun</p>&mdash; @r4vi (@r4vi) <a href="https://twitter.com/r4vi/status/874741870093623296?ref_src=twsrc%5Etfw">June 13, 2017</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Back in mid-2017, I sent out a tweet asking my dev followers which low-level languages they would recommend I take a look at.  For a while before this, I had been waiting for a new systems language for me to learn, but until this tweet, I never really found one that I was *actually* interested in taking a look at.

Naturally, both languages have a **TONNE** of features, so I'm not going to go into details on things like basic types, etc.  I will simply compare the biggest things that attracted me to both languages.  For in-depth tutorials on the features of both langs, check out the [Crystal Docs](https://crystal-lang.org/reference/), or the [Nim Docs](https://nim-lang.org/docs/lib.html).

Anyway, let's take a look at both languages, and you can make your own mind up as to which you'd rather be programming in.  Maybe both.  Maybe neither!


<br/>

## Nim

Nim is a statically-typed, imperative, systems programming language; aiming to achieve the performance of C, be as expressive as Lisp, and have a simple, clear syntax like Python.  I have to say, from my experience Nim manages to ***pretty much*** fit these criterion.  

> By compiling to C, Nim is able to take advantage of many features offered by modern C compilers. The primary benefits gained by this compilation model include incredible portability and optimisations.

> The binaries produced by Nim have zero dependencies and are typically very small. This makes their distribution easy and keeps your users happy.

When I say it *pretty much* matches the criteria, the only statement that doesn't quite match is achieving the performance of C.  In realise this is an almost impossible task, but Nim actually did fall short on a few occasions when it came to performance.  I will go into detail about this later on in the article.


### Installing Nim

Nim is super easy to install.  If you're on Windows, [head over here](https://nim-lang.org/install_windows.html), and download/run the installer.

If you're on any other Unix-based system, you can run:

```
$ curl https://nim-lang.org/choosenim/init.sh -sSf | sh`
```

If you're on Mac, and with Homebrew installed, simply run:

```
$ brew install nim
```

You could also consider using [choosenim](https://github.com/dom96/choosenim) to manage Nim installations in a similar way to `pyenv` and `rustup`.


### Interfacing Other Languages

One of the things that attracted me to both Nim **and** Crystal, was the ability to natively interface with other languages, and the **ease** with which that is achieved.  Nim has bidirectional interfacing not only with C, but also natively with JavaScript. Crystal natively interfaces with C, but is only unidirectional.  Definitely a point scored here for Nim!

When it comes to building DApps, the variety of target hardware they must be run on is already large, and growing all the time.  The low-level ability to interop with other languages makes for both languages being a much more attractive proposition.

For a quick demo, let's take a look at interfacing both C and JavaScript from Nim.

#### C Invocation

Firstly, create the file `logic.c` with the following content:

``` c
int addTwoIntegers(int a, int b)
{
  return a + b;
}
```

Next, create the file `calculator.nim` with the following content:

``` nim
{.compile: "logic.c".}
proc addTwoIntegers(a, b: cint): cint {.importc.}

when isMainModule:
  echo addTwoIntegers(3, 7)
```

Now then, with these two *very simple* files in place, we can run:

```
$ nim c -r calculator.nim
```

The Nim compiler will compile the `logic.c` file in addition to `calculator.nim` and link both into an executable; which outputs `10` when run.  Very sharp, in my opinion!

#### JavaScript Invocation

Even sharper, in my opinion, is the ability to interop with JavaScript.  Create a file titled `host.html` with the following content:

``` html
<html>
<body>
  <script type="text/javascript">
    function addTwoIntegers(a, b)
    {
      return a + b;
    }
  </script>

  <script type="text/javascript" src="calculator.js"></script>
</body>
</html>
```

Now, create another `calculator.nim` file with the following content (or reuse the one from the above C example):

``` nim
proc addTwoIntegers(a, b: int): int {.importc.}

when isMainModule:
  echo addTwoIntegers(3, 7)
```


Compile the Nim code to JavaScript by running:

```
$ nim js -o:calculator.js calculator.nim
```

Once that's done, go ahead and open `host.html` in a browser and you should see the value `10` in the browser's console.  I think this is **REALLY** neat.  It's superb how easy it is to achieve that, too.


### Aside – a Quick (not-so) Secret:

Instead of writing out the HTML above, you could actually use ***Nim's native*** HTML DSL:

``` nim
import html_dsl

html page:
  head:
    title("Title")
  body:
    p("Hello")
    p("World")
    dv:
      p "Example"

echo render(page())
```

Running this will output the following:

``` html
<!DOCTYPE html>
  <html class='has-navbar-fixed-top' >
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Title</title>
  </head>
  <body class='has-navbar-fixed-top' >
    <p >Hello</p>
    <p >World</p>
    <div>
      <p>Example</p>
    </div>
  </body>
</html>
```


<br/>

## Crystal

Crystal is a statically-typed, object-oriented, systems programming language; with the aim of achieving the speed and performance of c/c++, whilst having a syntax as simple, readable, and easy to learn as Ruby.

I first came across Crystal when I saw [@sferik](https://twitter.com/sferik) giving a talk on it in Poland back in 2015. [Video here.](https://www.youtube.com/watch?v=Ysm4IU4aWoQ) It was a great talk, and sparked my interest in Crystal right there and then. When I initially explored Crystal I thought it looked awesome, but I was too busy with all the other languages I was using on a daily basis, to be able to focus my time on it properly.

### Installing Crystal

You can find all of the relevant instructions for installing Crystal, on the [main website installation page](https://crystal-lang.org/install/).

If you are on Mac, and have Homebrew installed, you can simply run:

```
$ brew install crystal
```

**However**, if you are a Windows user, *for the time being* you are out of luck, unless you use the Windows Subsystem for Linux.  If I were in a more shocking/pedantic mood, I'd take a (not yet gained) point **away** from Crystal here, for lack of Windows support.


### Interfacing C

Let’s build a simple script in C that says “hi!”. We’ll then write a Crystal app to bind to our C library. This is a great starting point for anyone who wants to know about binding C in Crystal.

First off, let’s create a project with Crystal’s scaffolding tool (I’ll cover this feature later). Run:

```
$ crystal init app sayhi_c
```

Then head into the directory `sayhi_c/src/sayhi_c` and let’s create a file `sayhi.c` with the following contents:

``` c
#include <stdio.h>

void hi(const char * name){
  printf("Hi %s!\n", name);
}
```

Now we need to compile our C file into an object. On Ubuntu or Mac using gcc we can run:

```
$ gcc -c sayhi.c -o sayhi.o
```

Using the -o flags allow us to create an Object filetype. Once we’ve got our Object file, we can bind it from within our Crystal app. Open up our `sayhi_c.cr` file, and have it reflect the following:

``` crystal
require "./sayhi_c/*"

@[Link(ldflags: "#{__DIR__}/sayhi_c/sayhi.o")]

lib Say
  fun hi(name : LibC::Char*) : Void
end

Say.hi("Status")
```

I’ll mention now that there are no implicit type conversions except to_unsafe - explained here when invoking a C function: you must pass the exact type that is expected.

Also worth noting at this point is that since we have built our C file into an object file, we can include it in the project directory and link from there. When we want to link dynamic libraries or installed C packages, we can just link them without including a path.

So, if we build our project file and run it, we get the following:

```
$ crystal build --release src/sayhi_c.cr

$ ./sayhi_c

 > Hi Status!
```

As you can see, Nim takes the winners trophy in this case, as it is **much** simpler to achieve a similar goal.  With Nim, we were also able to link both the Nim and C files into the same executable, which Crystal sadly cannot do.



<br/>

## Performance Tests

### Parsing & calculating values from a large JSON file:

Firstly, we need to generate our large JSON file.  For this test, we're going to generate a dataset which includes **1 Million** items.

<center><iframe src="https://giphy.com/embed/13B1WmJg7HwjGU" width="480" height="270" frameBorder="0"></iframe></center>

We can do so with the following Ruby script:

``` rb
require 'json'

x = []

1000000.times do
  h = {
    'x' => rand,
    'y' => rand,
    'z' => rand,
    'name' => ('a'..'z').to_a.shuffle[0..5].join + ' ' + rand(10000).to_s,
    'opts' => {'1' => [1, true]},
  }
  x << h
end

File.open("1.json", 'w') { |f| f.write JSON.pretty_generate('coordinates' => x, 'info' => "some info") }
```

This will generate a JSON file **of around 212mb**, with the following syntax:

``` json
{
  "coordinates": [
    {
      "x": 0.10327081810860272,
      "y": 0.03247172212368832,
      "z": 0.8155255437507467,
      "name": "scojbq 5965",
      "opts": {
        "1": [
          1,
          true
        ]
      }
    }
  ],
  "info": "some info"
}
```

Now that we have our chunky JSON file; we can write our first test – **in Nim**:

``` nim
import json

let jobj = parseFile("1.json")

let coordinates = jobj["coordinates"].elems
let len = float(coordinates.len)
var x = 0.0
var y = 0.0
var z = 0.0

for coord in coordinates:
  x += coord["x"].fnum
  y += coord["y"].fnum
  z += coord["z"].fnum

echo x / len
echo y / len
echo z / len
```

And again; the same simple test, this time written **in Crystal**:

``` crystal
require "json"

text = File.read("1.json")
jobj = JSON.parse(text)
coordinates = jobj["coordinates"].as_a
len = coordinates.size
x = y = z = 0

coordinates.each do |coord|
  x += coord["x"].as_f
  y += coord["y"].as_f
  z += coord["z"].as_f
end

p x / len
p y / len
p z / len
```

### Results:

Building our test files into tiny release packages with the respective commands below:

```
$ crystal build json_test.cr --release -o json_test_cr --no-debug
```

```
$ nim c -o:json_test_nim -d:danger --cc:gcc --verbosity:0 json_test.nim
```

We can then time & run those packages, to obtain our test results:

| Language | Time (s) | Memory (Mb) |
|----------|----------|-------------|
| Nim      | 6.92     | 1320.4      |
| Crystal  | 4.58     | 960.7       |

As you can see; in this case ***Crystal*** is the more performant language – taking less time to execute & complete the test, and also fewer Megabytes in memory doing so.



<br/>

### Base64 encoding / decoding a large blob:

In this test; we will firstly encode and then decode a string, with a current timestamp into newly allocated buffers, utilising the Base64 algorithm.  For starters, let's look at the ***Nim*** test:

``` nim
import base64, times, strutils, strformat

let STR_SIZE = 131072
let TRIES = 8192
let str = strutils.repeat('a', STR_SIZE)

var str2 = base64.encode(str)
stdout.write(fmt"encode {str[..3]}... to {str2[..3]}...: ")

var t = times.epochTime()
var i = 0
var s:int64 = 0
while i < TRIES:
  str2 = base64.encode(str)
  s += len(str2)
  i += 1
echo(fmt"{s}, {formatFloat(times.epochTime() - t, ffDefault, 6)}")

var str3 = base64.decode(str2)
stdout.write(fmt"decode {str2[..3]}... to {str3[..3]}...: ")

t = times.epochTime()
i = 0
s = 0
while i < TRIES:
  str3 = base64.decode(str2)
  s += len(str3)
  i += 1
echo(fmt"{s}, {formatFloat(times.epochTime() - t, ffDefault, 6)}")
```

And now the same test, written in Crystal:

``` crystal
require "base64"

STR_SIZE = 131072
TRIES = 8192

str = "a" * STR_SIZE

str2 = Base64.strict_encode(str)
print "encode #{str[0..3]}... to #{str2[0..3]}...: "

t, s = Time.local, 0
TRIES.times do |i|
  str2 = Base64.strict_encode(str)
  s += str2.bytesize
end
puts "#{s}, #{Time.local - t}"

str3 = Base64.decode_string(str2)
print "decode #{str2[0..3]}... to #{str3[0..3]}...: "

t, s = Time.local, 0
TRIES.times do |i|
  str3 = Base64.decode_string(str2)
  s += str3.bytesize
end
puts "#{s}, #{Time.local - t}"
```

### Results:

We can again; build our Base64 test files into release packages with the respective commands below:

```
$ crystal build base64_test.cr --release -o base64_test_cr --no-debug
```

```
$ nim c -o:base64_test_nim -d:danger --cc:gcc --verbosity:0 base64_test.nim
```

As with our last test suite, we can then time & run those packages, to obtain our test results:

| Language | Time (s) | Memory (Mb) |
|----------|----------|-------------|
| Nim      | 4.17     | 6.6         |
| Crystal  | 2.36     | 3.5         |

Once again, to my surprise, Crystal came out on top. And did again and again for me, running a bunch of different tests I could scrape together from other curious devs.


## Conclusion

The summary of this first-in-series article, is most definitely one of surprise.  I already knew that Crystal was a highly-performant language, and I have previously done my own research & testing to see how close to *C speeds* it could achieve.  That being said, I was *also* already aware that Nim **claims** close to C speeds, and that one of the language's principals was to run well on old & less-performant hardware.  

Yet, Crystal beat not only my own expectations; but beat Nim for both memory usage **AND** execution times.  I really didn't expect to see Crystal come out *this* far ahead in performance.  On the other hand, Nim came out by-far the leader when it comes to language interoperability.  **Nim makes it even easier** than Crystal when interfacing other langs – not something I thought possible, given just how easy Crystal makes the task.

In conclusion, it seems that we have 1 point for Nim (interoperability), and 1 point for Crystal (performance).  Both languages have pleasantly surprised me, and I look forward to diving into the next topics in the series:

 - Part 2: Threading and Tooling
 - Part 3: Crypto, DApps and P2P

These two articles will be released over the next couple of days, so don't forget to come back then to check them out!

Thanks for reading - as ever, if you have any questions, please feel free to reach out at [robin@status](mailto:robin@status.im).

[ - **@rbin**](https://twitter.com/rbin)
