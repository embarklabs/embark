contract token { mapping (address => uint) public coinBalanceOf; function token() {}  function sendCoin(address receiver, uint amount) returns(bool sufficient) {  } }

contract Crowdsale {

  address public beneficiary;
  uint public fundingGoal; uint public amountRaised; uint public deadline; uint public price;
  token public tokenReward;   
  Funder[] public funders;
  event FundTransfer(address backer, uint amount, bool isContribution);

  /* data structure to hold information about campaign contributors */
  struct Funder {
    address addr;
    uint amount;
  }

  /*  at initialization, setup the owner */
  function Crowdsale(address _beneficiary, uint _fundingGoal, uint _duration, uint _price, token _reward) {
    beneficiary = _beneficiary;
    fundingGoal = _fundingGoal;
    deadline = now + _duration * 1 minutes;
    price = _price;
    tokenReward = token(_reward);
  }   

  /* The function without name is the default function that is called whenever anyone sends funds to a contract */
  function () {
    uint amount = msg.value;
    funders[funders.length++] = Funder({addr: msg.sender, amount: amount});
    amountRaised += amount;
    tokenReward.sendCoin(msg.sender, amount / price);
    FundTransfer(msg.sender, amount, true);
  }

  modifier afterDeadline() { if (now >= deadline) _ }

  /* checks if the goal or time limit has been reached and ends the campaign */
  function checkGoalReached() afterDeadline {
    if (amountRaised >= fundingGoal){
      beneficiary.send(amountRaised);
      FundTransfer(beneficiary, amountRaised, false);
    } else {
      FundTransfer(0, 11, false);
      for (uint i = 0; i < funders.length; ++i) {
        funders[i].addr.send(funders[i].amount);  
        FundTransfer(funders[i].addr, funders[i].amount, false);
      }               
    }
    suicide(beneficiary);
  }
}
