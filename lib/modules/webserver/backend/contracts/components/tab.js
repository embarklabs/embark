class Tab extends React.Component {
    render(){
        return (
            this.props.selectedTab == this.props.id
            ?
            <div id={this.props.id}>
                { this.props.children }
            </div>
            :
            ''
        );
    }
}