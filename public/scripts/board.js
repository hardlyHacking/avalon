const NAMES = ['Mordred', 'Morgana', 'Percival', 'Oberon']

class OptionalRoles extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      hasPercival: false,
      hasMorgana: false,
      hasMordred: false,
      hasOberon: false
    }

    this.renderCheckbox = this.renderCheckbox.bind(this);
  }

  renderCheckbox(name) {
    return(
      <div key={name} className="custom-control custom-checkbox">
        <input type="checkbox" className="custom-control-input" id={`check-${name}`} />
        <label className="custom-control-label" htmlFor={`check-${name}`}>{name}</label>
      </div>
    )
  }

  render() {
    const checkBoxes = NAMES.map(n => this.renderCheckbox(n))
    return(
      <div>
        <h2 className="">Optional Roles</h2>
        {checkBoxes}
      </div>
    )
  }
}

class PlayerList extends React.Component {

  constructor(props) {
    super(props)

    this.state = { isClicked: false, players: [] }
    this.renderList = this.renderList.bind(this)
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

    this.handleClick = this.handleClick.bind(this)
    this.renderButton = this.renderButton.bind(this);
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
              disabled={this.state.players.length < 5 || this.state.players.length > 10}
      >Start Game</button>
    )
  }

  render() {
    if (!this.state.isStarted) {
      const halfWidth = {
        width: "10%"
      }

      return(
        <table className="table table-sm">
          <tbody>
            <tr>
              <td style={halfWidth}>
                <PlayerList players={this.state.players}
                            room={this.props.room} />
              </td>
              <td style={halfWidth}>
                <OptionalRoles />
              </td>
            </tr>
            <tr>
              <td colspan="3">
                {this.renderButton()}
              </td>
            </tr>
          </tbody>
        </table>
      )
    } else {
      return null;
    }
  }
}
