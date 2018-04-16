class Tab extends React.Component {
    render(){
        return <div role="tabpanel" className={this.props.active || false ? 'tab-pane active' : 'tab-pane'} id={this.props.id}>
        <h2>{this.props.name}</h2>
        { this.props.children }
      </div>;
    }
}

export default Tab;