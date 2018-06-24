class PlayerList extends React.Component {

  constructor(props) {
    super(props)

    this.state = { isClicked: false }

    this.handleClick = this.handleClick.bind(this)
    this.renderButton = this.renderButton.bind(this)
    this.renderList = this.renderList.bind(this)
  }

  handleClick() {
    this.setState({ isClick: true })
    socket.emit('start_game', {'room': this.props.room})
  }

  renderButton() {
    return(
      <button className={"btn btn-danger"}
              onClick={this.handleClick}
              type="button"
      >Start Game</button>
    )
  }

  renderList() {
    const players = this.props.players.map((p) =>
      <li key={p} className={"list-group-item"}>{p}</li>)
    return(
      <ul className={"list-group list-group-flush"}>
        {players}
      </ul>
    )
  }

  render() {
    return(
      <div>
        <h2>Active Players</h2>
        {this.renderList()}
        {this.renderButton()}
      </div>
    )
  }
}

class Board extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      players: [],
      isStarted: false
    }

    socket.on('player_join', function(data) {
      const p = this.state.players.slice()
      p.push(data['name'])
      this.setState({ players: p })
    }.bind(this))

    socket.on('player_leave', function(data) {
      const p = this.state.players.filter(e => e !== data['name'])
      this.setState({ players: p })
    }.bind(this))

    socket.on('room_status', function(data) {
      const room = JSON.parse(data.room)
      this.setState({
        isStarted: room.is_started,
        players: room.players
      })
    }.bind(this))

    socket.emit('room_status', {'room': this.props.room})
  }

  render() {
    if (!this.state.isStarted) {
      return(<PlayerList players={this.state.players}
                         room={this.props.room} />)
    } else {
      return null;
    }
  }
}
