class PlayerCircle extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    const playerList = this.props.players.map((p, index) => {
      const c = index === this.turn ? "list-group-item active" : "list-group-item"
      return <li key={p} className={c}>{p}</li>
    })

    return(
      <div>
        <h3>Player Order</h3>
        <ul className="list-group">
          {playerList}
        </ul>
      </div>
    )
  }
}

class Avalon extends React.Component {

  constructor(props) {
    super(props)

    this.state = { fetched: false, room: {} }

    socket.emit('room_status', {'room': this.props.roomId})

    socket.on('room_status', function(data) {
      this.setState({ room: JSON.parse(data['room']), fetched: true })
    }.bind(this))
  }

  render() {
    if (!this.state.fetched) {
      return(
        <div>
          <h2>Loading</h2>
        </div>
      )
    }

    return(
      <div>
        <PlayerCircle players={this.state.room.players}
                      turn={this.state.room.turn % this.state.room.players.length} />
      </div>
    )
  }
}
