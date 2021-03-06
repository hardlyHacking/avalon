class Game extends React.Component {

  constructor(props) {
    super(props)
    this.state = { inRoom: false,
                   name: '',
                   room: '',
                   joinRoomError: false,
                   createGameError: false }

    socket.on('join_room_success', function(data) {
      this.setState({ inRoom: true, room: data.room, name: data.name,
                      joinRoomError: false })
    }.bind(this))

    socket.on('join_room_failure', function(data) {
      this.setState({ joinRoomError: true })
    }.bind(this))
  }

  render() {
    if (this.state.inRoom) {
      return(<Board room={this.state.room} name={this.state.name} />)
    } else {
      return(<Landing />)
    }
  }
}

ReactDOM.render(<Game />, document.getElementById('content'))
