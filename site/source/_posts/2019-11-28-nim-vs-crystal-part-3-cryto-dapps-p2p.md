title: Nim vs Crystal - Part 3 - Crypto, DApps & P2P
summary: "Crystal and Nim go head-to-head to figure out the best modern, low-level programming language!  In part 3; Crypto, P2P & DApps are explored."
author: robin_percy
categories:
  - tutorials
layout: blog-post
image: '/assets/images/nim-crystal-header_blank.jpg'
---

![crystal vs nim](/assets/images/nim-crystal-header-img_NEW.jpg)

Welcome back to my series comparing the two sweethearts of the modern low-level programming world.  Just to quickly recap: in [article #1](/news/2019/11/18/nim-vs-crystal-part-1-performance-interoperability/) I noted my thoughts on the interoperability capabilities of the two languages, alongside briefly reviewing the performance metrics for each (albeit with relatively simple tests).  Whether simple or not, the tests ***did*** throw up some unexpected twists in the plot.  Crystal used *very-nearly* half of the memory amount executing the tests when compared to Nim, and also took *very nearly* half of the execution time in doing so.  **This seriously took me by surprise!**

In [article #2](/news/2019/11/21/nim-vs-crystal-part-2-threading-tooling/); I looked at the Concurrency primitives of each language, and explored both the in-built tooling, and external package ecosystems surrounding each language.  As I said in that article, one of the biggest factors I look at when considering adopting a new language; is its tooling ecosystem.  This includes, but is not limited to:  A comprehensive package manager, an intuitive testing suite, a good project scaffolder, and an in-built formatter/linter to ensure my code stays semantically correct – especially if I know I will be working in Open Source repos that others will contribute to.  But they're just the high-level tools that I look for...

From a low-level standpoint; I look for efficient use of technology in features such as in-memory storage, caching, garbage collection, and concurrency primitives that not just *markedly* improve our application performance, but that are also relatively simple, and intuitive to use.  I see *this* as particularly important as I have, in my past, seen some truly shocking examples of trying to handle multi-threading, from languages that I love \*cough* ***Ruby*** \*cough*. I also like to see a fully-featured standard library that takes influence from previous successful languages.  However, I digress...

I regret to say that this is the final article in this series!  It's been good fun for me; getting to the know the ins-and-outs of Nim, and to re-grow a fresh appreciation of Crystal, having put it on the back-burner for quite some time.  However,  whether the final article in the series or not, it's going to be a good one!  We're going to be covering the benefits to the Cryptocurrency / DApp industries from both Crystal and Nim.  So without further ado:

***Let's dive on in!***

## Cryptocurrency

Firstly, I'd like to talk about the possibility of using either Crystal or Nim,  (or both!) in the development of crypto apps. Hypothetically; if we had the inclination to build out our own Cryptocurrency:   Crystal and Nim have ***proven to be two of the strongest languages*** to consider for the undertaking..  (That being the *next* blog series I'm going to write – in the near future, so deciding which language to use will be heavily influenced by ***this*** blog series!)

For our Cryptocurrency, we would need to be able to use an intelligent key manager, utilise smart hashing algorithms, maintain strong performance, and all of this atop of a distributed, decentralised virtual machine or blockchain.  Now, all of this sounds like a ***very*** tall order!  For all of these feature requirements to be met by a single programming language, it would mean that this language is going to have to be **ONE HELL** of an impressive piece of technology.

Happily, both Crystal *and* Nim allow us ***all*** of the above functionality.  In our hypothetical usecase, if we were to build out a fully-featured blockchain; mining *and* hashing functions would need to be continually made, both of which entail relatively heavy computations.  As shown over the last 2 articles in the series, we can at least be sure that both langs can handle the performance stresses, no problemo.

As I'd like to write this topic out into a further detailed article series, I will show off just 2 of the above pieces of functionality we'd require for our Crypto app:


### Calculating our Block Hashes

When building our Blockchain; we need to consider how we're going to identify and chain our transaction blocks together (blockchain).  Without going into details in *this* article on how blockchains function, we'll stick with the existing, and proven, SHA256 algorithm.


### In Crystal:

``` crystal
require "json"
require "openssl"

module OurCryptoApp::Model
  struct Transaction
    include JSON::Serializable

    alias TxnHash = String

    property from : String
    property to : String
    property amount : Float32
    getter hash : TxnHash
    getter timestamp : Int64

    def initialize(@from, @to, @amount)
      @timestamp = Time.utc_now.to_unix
      @hash = calc_hash
    end

    private def calc_hash : TxnHash
      sha = OpenSSL::Digest.new("SHA256")
      sha.update("#{@from}#{@to}#{@amount}#{@timestamp}")
      sha.hexdigest
    end
  end
end
```


### In Nim:

If we want to generate a similar hash in Nim, we could run the following:

``` nim
import strutils

const SHA256Len = 32

proc SHA256(d: cstring, n: culong, md: cstring = nil): cstring {.cdecl, dynlib: "libssl.so", importc.}

proc SHA256(s: string): string =
  result = ""
  let s = SHA256(s.cstring, s.len.culong)
  for i in 0 .. < SHA256Len:
    result.add s[i].BiggestInt.toHex(2).toLower

echo SHA256("Hash this block, yo")
```


## Releasing our Crypto App

Another serious factor we have to consider, is the ability to distribute our crypto app, once built, with great ease.  Remembering that both Crystal and Nim are *compiled* languages, we're already off to a promising start.  (A single executable binary is always going to be easier to distribute than something requiring its own specialist environment!)

It pays rather large dividends being able to write our Crypto app just once, and having the ability to maintain one singular code repo for that app. To this end – I think it is definitely worth considering a multi-platform app framework.  I already know that in my next article series, I will be exploring building a Crypto app using [React Native](https://facebook.github.io/react-native/).

However, if you wish to build the frontend of your cross-platform crypto app in something else, there are a variety of technologies available - all of which seem to work well with both Crystal and Nim:

 - [Ionic Framework](http://ionicframework.com/)
 - [Flutter](https://flutter.io/)
 - [NativeScript](https://www.nativescript.org/)

And if you come from a Windows background:

 - [Xamarin](https://dotnet.microsoft.com/apps/xamarin)


### Building & Releasing In Nim:

If we wanted to build out and release our app for Android, we can run:

```
nim c -c --cpu:arm --os:android -d:androidNDK --noMain:on
```

To generate the C source files we need to include in our Android Studio project.  We then simply add the generated C files to our CMake build script in our Android project.

Similarly, we could run:

```
nim c -c --os:ios --noMain:on
```

To generate C files to include in our XCode project. Then, we can use XCode to compile, link, package and sign everything.


### Building & Releasing In Crystal:

Crystal also allows for cross-compilation, and makes it just as easy.  For example, to build our app for Linux distributions from our Mac, we can run:

```
crystal build your_program.cr --cross-compile --target "x86_64-unknown-linux-gnu"
```

***Worth noting:*** *Crystal doesn't offer the out-of-the-box iPhone / Android cross-compilation functionality that Nim does, so building our app in Nim gets a definite thumbs-up from a distribution point-of-view!*

## Ethereum - Building, Signing & Sending a  Transaction

For the sake of this article, in Crystal, I didn't see the need to write out a more low-level example of the below action, as it *is* so similar to the Nim demo that follows.  This actually worked out in my favour, as it means I get to further show off the native HTTP library for Crystal.

### In Crystal:

``` crystal
require "http/client"

module Ethereum
  class Transaction

    # /ethereum/create/ Create - Ethereum::Transaction.create(args)
    def self.create(to : String, from : String, amount : UInt64, gas_price : UInt64? = nil, gas_limit : UInt64? = nil) : EthereumToSign | ErrorMessage

      headers = HTTP::Headers.new
      if ENV["ONCHAIN_API_KEY"]? != nil
        headers.add("X-API-KEY", ENV["ONCHAIN_API_KEY"])
      end

      response = HTTP::Client.post "https://onchain.io/api/ethereum/create//?to=#{to}&from=#{from}&amount=#{amount}&gas_price=#{gas_price}&gas_limit=#{gas_limit}", headers: headers

      return ErrorMessage.from_json response.body if response.status_code != 200

      ethereumtosign = EthereumToSign.from_json response.body


      return ethereumtosign
    end

    # /ethereum/sign_and_send/ Sign and send - Ethereum::Transaction.sign_and_send(args)
    def self.sign_and_send(to : String, from : String, amount : UInt64, r : String, s : String, v : String, gas_price : UInt64? = nil, gas_limit : UInt64? = nil) : SendStatus | ErrorMessage

      headers = HTTP::Headers.new
      if ENV["ONCHAIN_API_KEY"]? != nil
        headers.add("X-API-KEY", ENV["ONCHAIN_API_KEY"])
      end

      response = HTTP::Client.post "https://onchain.io/api/ethereum/sign_and_send//?to=#{to}&from=#{from}&amount=#{amount}&r=#{r}&s=#{s}&v=#{v}&gas_price=#{gas_price}&gas_limit=#{gas_limit}", headers: headers

      return ErrorMessage.from_json response.body if response.status_code != 200

      sendstatus = SendStatus.from_json response.body


      return sendstatus
    end

  end
end
```

Then, in our application we could simply call:

``` crystal
Ethereum::Transaction.create("0xA02378cA1c24767eCD776aAFeC02158a30dc01ac", "0xA02378cA1c24767eCD776aAFeC02158a30dc01ac", 80000)
```

And we would get a response similar to the following, ready to be signed and sent to the Ethereum network:

``` json
{
  "tx": "02000000011cd5d7621e2a7c9403e54e089cb0b5430b83ed13f1b897d3e319b100ba1b059b01000000db00483045022100d7534c80bc0a42addc3d955f74e31610aa78bf15d79ec4df4c36dc98e802f5200220369cab1bccb2dbca0921444ce3fafb15129fa0494d041998be104df39b8895ec01483045022100fe48c4c1d46e163acaff6b0d2e702812d20",
  "hash_to_sign": "955f74e31610aa78bf15d79ec4df4c36dc98e802f52002"
}
```


## In Nim:

From a deeper, more low-level perspective; instead of using an HTTP library as in the Crystal example above, we can use Status' very own Nim-Ethereum library to build our Ethereum transaction.  Assuming we have imported `nim-eth` into our Nimble project, our Ethereum transaction can be built atop of the following protocol:

``` nim
import
  nim-eth/[common, rlp, keys], nimcrypto

proc initTransaction*(nonce: AccountNonce, gasPrice, gasLimit: GasInt, to: EthAddress,
  value: UInt256, payload: Blob, V: byte, R, S: UInt256, isContractCreation = false): Transaction =
  result.accountNonce = nonce
  result.gasPrice = gasPrice
  result.gasLimit = gasLimit
  result.to = to
  result.value = value
  result.payload = payload
  result.V = V
  result.R = R
  result.S = S
  result.isContractCreation = isContractCreation

type
  TransHashObj = object
    accountNonce:  AccountNonce
    gasPrice:      GasInt
    gasLimit:      GasInt
    to {.rlpCustomSerialization.}: EthAddress
    value:         UInt256
    payload:       Blob
    mIsContractCreation {.rlpIgnore.}: bool

proc read(rlp: var Rlp, t: var TransHashObj, _: type EthAddress): EthAddress {.inline.} =
  if rlp.blobLen != 0:
    result = rlp.read(EthAddress)
  else:
    t.mIsContractCreation = true

proc append(rlpWriter: var RlpWriter, t: TransHashObj, a: EthAddress) {.inline.} =
  if t.mIsContractCreation:
    rlpWriter.append("")
  else:
    rlpWriter.append(a)

const
  EIP155_CHAIN_ID_OFFSET* = 35

func rlpEncode*(transaction: Transaction): auto =
  # Encode transaction without signature
  return rlp.encode(TransHashObj(
    accountNonce: transaction.accountNonce,
    gasPrice: transaction.gasPrice,
    gasLimit: transaction.gasLimit,
    to: transaction.to,
    value: transaction.value,
    payload: transaction.payload,
    mIsContractCreation: transaction.isContractCreation
    ))

func rlpEncodeEIP155*(tx: Transaction): auto =
  let V = (tx.V.int - EIP155_CHAIN_ID_OFFSET) div 2
  # Encode transaction without signature
  return rlp.encode(Transaction(
    accountNonce: tx.accountNonce,
    gasPrice: tx.gasPrice,
    gasLimit: tx.gasLimit,
    to: tx.to,
    value: tx.value,
    payload: tx.payload,
    isContractCreation: tx.isContractCreation,
    V: V.byte,
    R: 0.u256,
    S: 0.u256
    ))

func txHashNoSignature*(tx: Transaction): Hash256 =
  # Hash transaction without signature
  return keccak256.digest(if tx.V.int >= EIP155_CHAIN_ID_OFFSET: tx.rlpEncodeEIP155 else: tx.rlpEncode)
```

*Note* - I do realise the above Nim code example and the Crystal examples are different - I fully intended them to be.  The Crystal example allowed me to further show off the HTTP library I touched on in the last article, and the Nim example allowed me to go to a lower-level; something I think brings the article relevancy full circle.


[Status' Eth Common Library](https://github.com/status-im/nim-eth/) contains a whole bunch of useful Nim libraries for interacting with the Ethereum Network, including:

 - [Recursive Length Prefix encoding (RLP)](https://github.com/status-im/nim-eth/blob/master/doc/rlp.md),
 - [P2P](https://github.com/status-im/nim-eth/blob/master/doc/p2p.md),
 - [Eth-keys](https://github.com/status-im/nim-eth/blob/master/doc/keys.md),
 - [Eth-keyfile](https://github.com/status-im/nim-eth/blob/master/doc/keyfile.md),
 - [Ethereum Trie structure](https://github.com/status-im/nim-eth/blob/master/doc/trie.md), and
 - [Ethereum Bloom Filter](https://github.com/status-im/nim-eth/blob/master/doc/bloom.md).

If you are going to be working in the Ethereum ecosystem using Nim, it goes without saying that these utilities are absolutely essential.  With Status & the [Nimbus](https://nimbus.team) team being such early adopters and major contributors to the Nim/Crypto universe, you are more than likely to stumble across this code sooner or later!


## Conclusion

Our hypothetical Crypto app has taken shape throughout this article, and I think both languages have shown off great promise, and have proven their respective abilities to power the Cryptocurrency universe.

Realistically, if you were a brand-new developer looking to learn a language to break into the Crypto scene, the choice would almost definitely be **Crystal**.  This is simply because of the *much* larger ecosystem and resources surrounding it.

However, if you were an already-established developer, looking to build out a crypto app that you could develop and multi-platform release with greater ease, you'd inevitably choose **Nim**.  Crystal not only lacks the ability to be developed properly on Windows, but also lacks the interoperability and multi-release functionality, as we have seen, with Nim.

Alas, this brings me on to my final points...


## Series Conclusion

It's funny – each article in this series, I've started by saying to myself "Right, Nim is going to win." And then half way through; changing my story to "Crystal is my choice, actually."

But then I went and spoiled it all, by saying something stupid like "Cryptocurrency".

Prior to this article, I *was swaying* towards settling on Crystal.  Not only did it impress in performance, but also seemed to have an enthusiastic ecosystem building around it.  Nim, however, refused to go down without a fight –  offering up *extremely* impressive interoperability, awesome inbuilt tooling, and great efficiency overall.

I hate to do this, but I'm just going to have to say it:  for your usecase – **pick the best tool for the job**. Please ensure that you research properly into both languages, and weigh-up the pro's/con's that pertain to your specific usecase.

***Cliches aside*** – if I had to pick a favourite overall language, it would have to be **Crystal**.  Frankly, this opinion is formed from my extensive use of Crystal over Nim, the fact I **much** prefer the Crystal syntax, and the fact that I am simply more comfortable coding in Crystal than I am in Nim!

So, to answer the epic question – Crystal vs Nim?

Personally, I choose Crystal.  But I think **you** should choose ***Nim.*** 😅

[ **- @rbin**](https://twitter.com/rbin)
