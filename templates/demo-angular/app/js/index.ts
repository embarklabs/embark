import EmbarkJS from 'Embark/EmbarkJS';
//import your contracts
//e.g if you have a contract named SimpleStorage:
//import SimpleStorage from 'Embark/contracts/SimpleStorage';

class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
  greet() {
    return "Hello, " + this.greeting;
  }
}

document.addEventListener("DOMContentLoaded", function() {
  EmbarkJS.onReady(function() {
   // Interact with contracts, storage, etc..
  });

  let greeter = new Greeter("world");
  
  let button = document.createElement('button');
  button.textContent = "Say Hello";
  button.onclick = function() {
    alert(greeter.greet());
  }
  
  document.body.appendChild(button);
});

