template Multiplier() { 
  signal private input a; 
  signal private input b; 
  signal output c; c <== a*b; 
} 

component main = Multiplier();