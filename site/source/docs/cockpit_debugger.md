title: Using the Cockpit Debugger
layout: docs
---

Cockpit comes with a very powerful integrated debugger similar to the one provided by the [Remix](https://remix.ethereum.org/) browser IDE. Having an integrated debugger experience right at our finger tips makes us more productive when building decentralized applications and improves our developer experience.

In this guide we'll take a look at how to use the debugger.

## Entering the Debugger

First things first, we need to know where to find the debugger and how to enter it. In Cockpit, basically any transaction that is a Smart Contract call can be debugged.

Therefore, there are different entry points to the debugger. Most of the UI components that represent transaction come with a "Debug" button. Clicking that button takes us to Cockpit's [Code Editor](/docs/cockpit_editor.html) in its debugging mode.

Probably the most straight forward way to do that is entering the [Explorer](/docs/cockpit_explorer.html) and simply select any transaction that is a Smart Contract call.

![Cockpit Enter Debugger](/assets/images/cockpit_enter_debugger.gif)

## Debugger View

Once we enter the debugger mode inside the Code Editor we'll see that Cockpit provides us with several controls to and variable scopes to debug transactions. The controls are very similar to controls in other debugger tools (such as the browser devtools). 

![Cockpit Debugger Controls](/assets/images/cockpit_debugger_controls.png)

From left to right, the controls are:

- **Jump to previous breakpoint** - Jumps to the previous available breakpoint within the current function
- **Jump to next breakpoint** - Jumps to the next available breakpoint within the current function
- **Step over previous function call** - Executes the previous function without stepping into it
- **Step over next function call** - Executes the next function without stepping into it
- **Step into previous function call** - Steps into the previous function call and sets temporary breakpoint
- **Step into next function call** - Steps into the next function call and sets temporary breakpoint

When using any of these controls, the breakpoint indicator in the source of the Smart Contract, as well as the variables in the Scopes view  will update as well. 

![Cockpit Using Debugger](/assets/images/cockpit_using_debugger.gif)

## Debugger variables

As we're using the debugger and step through function calls, Cockpit updates and outputs relevant variables within the scope of the function we're debugging. This is a very useful feature as we can see in real-time which variables contain which value.

The debugger provides variables in the following scopes:

- **contract** - These are variable members of the Smart Contract instance itself.
- **globals** - These are global variables available in the current scope of the function that is being debugged. This includes useful values such as the current `block` as well as `msg`.
- **locals** - These are parameter variables scoped to the function that is being debugged.
