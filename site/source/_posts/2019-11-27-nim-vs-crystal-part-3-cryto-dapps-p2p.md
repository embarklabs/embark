title: Nim vs Crystal - Part 3 - Crypto, DApps & P2P
summary: "Crystal and Nim go head-to-head to figure out the best modern, low-level programming language!  In part 3; Crypto, P2P & DApps are explored."
author: robin_percy
categories:
  - tutorials
layout: blog-post
image: '/assets/images/nim-crystal-header_blank.jpg'
---

![crystal vs nim](http://embark.status.im/assets/images/nim-crystal-header-img_NEW.jpg)

Welcome back to my series comparing the two sweethearts of the modern low-level programming world.  Just to quickly recap: in [article #1](/news/2019/11/18/nim-vs-crystal-part-1-performance-interoperability/) I noted my thoughts on the interoperability capabilities of the two languages, alongside briefly reviewing the performance metrics for each (albeit with relatively simple tests).  Whether simple or not, the tests ***did*** throw up some unexpected twists in the plot - Crystal used *very-nearly* half of the memory amount executing the tests when compared to Nim, and also took *very nearly* half of the execution time in doing so.  **This seriously took me by surprise!** 

In [article #2](/news/2019/11/21/nim-vs-crystal-part-2-threading-tooling/); I looked at the Concurrency primitives of both languages, and explored the in-built tooling.  As I said in that article, one of the biggest factors I look at when considering adopting a new language is the tooling ecosystem that surrounds it.  This includes, but is not limited to:  A comprehensive package manager, an intuitive testing suite, a good project scaffolder, and an in-built formatter/linter to ensure my code stays semantically correct – especially if I know I will be working in Open Source repos others will contribute to.  But they're just the high-level tools.

From a low-level perspective; I look for efficient technology in the Garbage Collector, threading paradigms / concurrency primitives that not only work really well making our application perform better, but are also relatively simple and intuitive to use.  I have, in my past, seen some truly shocking examples of languages I love trying to handle multi-threading \*cough* ***Ruby*** \*cough*. I also like to see a standard library that learns from previous, successful languages, and implements these much-requested features right from the beginning; (I'm looking at you, Golang with your Generics fiasco!)

I regret to say that this is the final article in this specific series!  It's been good fun for me; getting to the know the ins-and-outs of Nim more.  I've also re-grown a fresh appreciation for Crystal, having put it on the back-burner for quite some time...

