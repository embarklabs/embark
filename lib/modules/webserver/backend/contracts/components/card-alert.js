class CardAlert extends React.Component {    
    render(){
        return this.props.show ? 
            <div className="card-alert alert alert-danger mb-0">
            {this.props.message}
            </div>
            : 
            '';
    }
}



