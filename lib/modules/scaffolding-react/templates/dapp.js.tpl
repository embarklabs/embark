import EmbarkJS from 'Embark/EmbarkJS';
import {{contractName}} from 'Embark/contracts/{{contractName}}';

import React from 'react';
import ReactDOM from 'react-dom';
import { Tabs, Tab } from 'react-bootstrap';

class {{contractName}}UI extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
        };
    }

    render(){
        return (<h2>Test</h2>);
    }
}


ReactDOM.render(<div>
        <h1>{{title}}</h1>
        <{{contractName}}UI />
    </div>,
    document.getElementById('app')
);