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

From a low-level perspective; I look for efficient use of technology in features such as in-memory storage, caching, garbage collection, and concurrency primitives that not just *markedly* improve our application performance, but that are also relatively simple and intuitive to use.  I see this as particularly important as I have, in my past, seen some truly shocking examples of trying to handle multi-threading, from languages that I love \*cough* ***Ruby*** \*cough*. I also like to see a fully-featured standard library that takes influence from previous successful languages.  However, I digress...

I regret to say that this is the final article in this series!  It's been good fun for me; getting to the know the ins-and-outs of Nim, and to re-grow a fresh appreciation of Crystal, having put it on the back-burner for quite some time.  However,  whether the final article in the series or not, it's going to be a good one!  We're going to be covering the benefits to the Cryptocurrency / DApp industries from both Crystal and Nim.  So without further ado, let's dive on in!


# Cryptocurrency

Hypothetically; if we were to build our own Cryptocurrency platform, Crystal and Nim would be good languages to consider for doing so.  (That being a blog series I'm going to write in the near future, so deciding which language to use will be heavily influenced by ***this*** blog series!)

For our Cryptocurrency, we would need to be able to build out a decent hashing system, an intelligent key manager, utilise smart algorithms, and all of this atop of a distributed, decentralised virtual machine / node manager.  Now, all of this sounds like a ***very*** tall order!  For all of these feature requirements to be met by a single programming language, it would mean that this language is going to have to be **ONE HELL** of an impressive piece of technology.

Happily, both Crystal *and* Nim would allow us ***all*** of the above functionality.  In this hypothetical usecase, if we were to build out a fully-featured blockchain; both mining *and* hashing computations would need to be continually made, and these entail  relatively heavy computations.  As shown over the last 2 articles, we can be sure that both langs can handle the performance stresses, no problem. 

As I'd like to build this topic out into a further detailed article series, I will show off 2 of the above pieces of functionality we'd require for our Crypto app:

## Calculating our Transaction Hashes

When building our Blockchain; we need to consider how we're going to identify and chain our transaction blocks together (blockchain).  Without going into details in *this* article on how blockchains function, for our hypothetical app, each of our block’s hashes will be a cryptographic hash of the block’s `index`, `timestamp`, `data`, and the hash of the previous block’s hash `previous_hash`.  

For the sake of our hypothetical blockchain; we'll stick with the existing, and proven, SHA256 algorithm.

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
 
echo SHA256("Rosetta code")
```


<br/>
## Releasing our Crypto App 

One of the *other* biggest factors we have to consider, is the ability to distribute our crypto apps super easily.  With both being compiled languages, we're already off to a promising start – 


### In Nim:

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


### In Crystal:

Crystal also allows for cross-compilation, and makes it just as easy.  For example, to build our app for Linux distributions from our Mac, we can run:

``` 
crystal build your_program.cr --cross-compile --target "x86_64-unknown-linux-gnu" 
```

***Worth noting:*** *Crystal doesn't offer the iPhone / Android cross-compilation functionality that Nim does, so building our app in Nim gets a definite thumbs-up from a distribution point-of-view!*

<br/> 

# Building, Signing & Sending an Ethereum Transaction

For the sake of this article, in Crystal, I didn't see the need to build out a more low-level version of the below action, as it *is* so similar in the Nim demo that follows.  This actually worked out in my favour, as it means I get to further show off the native HTTP library for Crystal.

## In Crystal:

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

```
Ethereum::Transaction.create("0xA02378cA1c24767eCD776aAFeC02158a30dc01ac", "0xA02378cA1c24767eCD776aAFeC02158a30dc01ac", 80000)
```

And we would get a response similar to the following, ready to be signed and sent to the Ethereum network:

```
{
  "tx": "02000000011cd5d7621e2a7c9403e54e089cb0b5430b83ed13f1b897d3e319b100ba1b059b01000000db00483045022100d7534c80bc0a42addc3d955f74e31610aa78bf15d79ec4df4c36dc98e802f5200220369cab1bccb2dbca0921444ce3fafb15129fa0494d041998be104df39b8895ec01483045022100fe48c4c1d46e163acaff6b0d2e702812d20",
  "hash_to_sign": "955f74e31610aa78bf15d79ec4df4c36dc98e802f52002"
}
```


## In Nim:

From a low-level perspective, instead of using an HTTP library as in the Crystal example above, we can use Status' very own Nim-Ethereum library to build our Ethereum transaction.  Assuming we have imported `nim-eth` into our Nimble project, our Ethereum transaction can be built atop of the following:

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


[The `Eth` Common Library](https://github.com/status-im/nim-eth/) contains a whole bunch of useful Nim libraries for interacting with the Ethereum Network, including:

 - [Recursive Length Prefix encoding (RLP)](https://github.com/status-im/nim-eth/blob/master/doc/rlp.md),
 - [P2P](https://github.com/status-im/nim-eth/blob/master/doc/p2p.md),
 - [Eth-keys](https://github.com/status-im/nim-eth/blob/master/doc/keys.md),
 - [Eth-keyfile](https://github.com/status-im/nim-eth/blob/master/doc/keyfile.md),
 - [Ethereum Trie structure](https://github.com/status-im/nim-eth/blob/master/doc/trie.md), and
 - [Ethereum Bloom Filter](https://github.com/status-im/nim-eth/blob/master/doc/bloom.md).

If you are going to be working in the Ethereum ecosystem using Nim, it goes without saying that these utilities are absolutely essential.  With Status & the [Nimbus](https://nimbus.team) team being such early adopters and major contributors to the Nim universe, you are more than likely to stumble across our code sooner or later! 