In the constant search for a balance between good UI and adhering to decentralization principals tradeoffs must be made. While developing the upcoming Teller network, a decentralized fiat on-ramp and off-ramp, our team came across the need for sending email notifications when a transaction happens. 

![](https://i.imgur.com/0sTbIgf.png)

The ethos of the Embark and other Status Network companies is to always build services for the public good. In that spirit we decided to make our smart contract notification service freely available to anyone interested in using it. This is an open source project and we welcome pull requests or issues to make it better.

The process is relatively straight forward. A user enters their email and then submits a transaction associating their ETH address with an email address of their choosing. Good OpSec is of course to create a new email with no personally identifiable information, however that is entirely up to the user. 

After the transaction is submitted the user will get a notification anytime a teller transaction involving their ETH account is confirmed on the network. For those who make a living buying and selling crypto this is a useful service for tax reporting purposes. In our system this is an entirely voluntary process for users but you can choose how you want to integrate it into your application.

Putting this service into practice for your application requires you to have a Sendgrid account. Other dependencies include NodeJS, Yarn and MongoDB installed. For instructions on how to install this application checkout our repository for creating this service for your own application:

[Check out the repositor here](https://github.com/status-im/contract-notifier)

