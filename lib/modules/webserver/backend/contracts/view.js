
const contractName = location.search.replace(/\?/, '');

let contractDefinition;
let host;

fetch("/embark/console", {
    method: "POST",
    headers: { 'content-type' : 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: "cmd=web3.currentProvider.host"
    })
.then(response => response.text())
.then(text => {
    host = text;
    return fetch("/embark/contract/" + contractName);
    })
.then(response => response.json())
.then(_contractDefinition => {
    contractDefinition = _contractDefinition;
    return fetch("/embark/files/contracts?filename=" + contractDefinition.originalFilename);
    })
.then(response => response.text())
.then(contractSource => {
    const web3 = new Web3(host);
    window.web3 = web3;

    let contractObj = new web3.eth.Contract(contractDefinition.abiDefinition);
    contractObj.options.data = "0x" + contractDefinition.code;
    contractObj.options.address = contractDefinition.deployedAddress;

    window[contractDefinition.className] = contractObj;

    ReactDOM.render(
        <ContractUI name={contractDefinition.className} definition={contractDefinition} contract={contractObj} source={contractSource} />,
        document.getElementById('contracts-area')
    );
});
