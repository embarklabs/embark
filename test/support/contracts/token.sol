contract token { 
  mapping (address => uint) public coinBalanceOf;
  event CoinTransfer(address sender, address receiver, uint amount);

  /* Initializes contract with initial supply tokens to the creator of the contract */
  function token(uint supply) {
    //coinBalanceOf[msg.sender] = (supply || 10000);
    coinBalanceOf[msg.sender] = 10000;
  }

  /* Very simple trade function */
  function sendCoin(address receiver, uint amount) returns(bool sufficient) {
    if (coinBalanceOf[msg.sender] < amount) return false;
    coinBalanceOf[msg.sender] -= amount;
    coinBalanceOf[receiver] += amount;
    CoinTransfer(msg.sender, receiver, amount);
    return true;
  }
}
