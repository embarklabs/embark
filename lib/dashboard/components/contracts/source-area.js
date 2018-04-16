class SourceArea extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sourceCode: ""
        };
    }

    componentDidMount(){
        fetch(this.props.sourceURL)
            .then(response => response.text())
            .then(text => {
                let colorCodedText = hljs.highlight('javascript', text, true).value;
                this.setState({sourceCode: colorCodedText});
            });
    }
    
    render(){
        return <React.Fragment>
            <h3 className="filename">{this.props.sourceURL.split('\\').pop().split('/').pop()}</h3>
            <small className="url">{this.props.sourceURL}</small>
            <pre dangerouslySetInnerHTML={{__html: this.state.sourceCode}}></pre>
        </React.Fragment>;
    }
}

export default SourceArea;