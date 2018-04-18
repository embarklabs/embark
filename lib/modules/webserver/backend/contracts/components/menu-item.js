class MenuItem extends React.Component {    
    render(){
        return <a href="#" onClick={this.props.click} data-target={this.props.target} className="list-group-item list-group-item-action d-flex align-items-center">
                <span className="icon mr-3"><i className="fe fe-file"></i></span>{this.props.text}
            </a>;
    }
}
