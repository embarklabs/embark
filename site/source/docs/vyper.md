title: Vyper
---

As of Embark 3.0, Vyper is supported out of the box. You only need to [install the compiler](https://vyper.readthedocs.io/en/latest/installing-vyper.html) yourself.

Embark's Vyper support means that any files with the extension `.vy` in the contracts directory will be deployed with the file name as the contract name, so, for instance, `contracts/Crowdfunding.vy` will be deployed as `Crowdfunding`.

To see Vyper in action, generate a new demo project by running:

<pre><code class="shell">$ embark demo</code></pre>

Inside the demo's root directory, remove `contracts/simple_storage.sol` and replace it with this file instead:

<pre><code class="python"># contracts/SimpleStorage.vy
storedData: public(uint256)

@public
def __init__(initialValue: uint256):
  self.storedData = initialValue

@public
@payable
def set(x: uint256):
  self.storedData = x

@public
def get() -> uint256:
  return self.storedData
</code></pre>

This has exactly the same logic as its Solidity counterpart, so the tests will still pass:

<pre><code class="shell">$ embark test</code></pre>

The full documentation for Vyper can be found [here](https://vyper.readthedocs.io/en/latest/vyper-by-example.html)
