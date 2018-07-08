class TurnLabel extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    const name = this.props.turn === 0 ? this.props.players[0] :
        this.props.players[this.props.players.length % this.props.turn]
    const mission = this.props.isMission ? `Mission in progress` :
      (this.props.isProposingTeam ? `${name} proposing team` :
        `Vote on ${name}'s proposal`)
    return(
      <div>
        <h2>{`${name}'s Turn`}</h2>
        <h3>{`${mission}`}</h3>
      </div>
    )
  }
}

class PlayerCircle extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    const playerList = this.props.players.map((p, index) => {
      const c = index === this.turn ? "list-group-item active" : "list-group-item"
      return <li key={p} className={c} onClick={() => this.props.onClick(p)}>{p}</li>
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

    this.state = { fetched: false, room: {}, selected: {} }

    socket.emit('room_status', {'room': this.props.roomId})

    socket.on('room_status', function(data) {
      this.setState({ room: JSON.parse(data['room']), fetched: true })
    }.bind(this))

    this.onPlayerClick = this.onPlayerClick.bind(this)
  }

  onPlayerClick(player) {
    if (Object.keys(this.state.selected).length < this.state.room.maxCount) {
      const choice = player in this.state.selected && this.state.selected[player]
      const newSelection = Object.assign({}, this.state.selected, {player: choice})
      this.setState({ selected: newSelection })
    }
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
        <TurnLabel players={this.state.room.players} turn={this.state.room.turn} />
        <PlayerCircle players={this.state.room.players}
                      onClick={this.onPlayerClick}
                      selected={this.state.selected}
                      turn={this.state.room.turn % this.state.room.players.length} />
      </div>
    )
  }
}
