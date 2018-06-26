const NAMES = ['Mordred', 'Morgana', 'Percival', 'Oberon']

class OptionalRoles extends React.Component {

  constructor(props) {
    super(props)
    this.renderCheckbox = this.renderCheckbox.bind(this)
  }

  renderCheckbox(name) {
    return(
      <div key={name} className="custom-control custom-checkbox">
        <input type="checkbox" className="custom-control-input"
               onClick={() => this.props.onClick(name)}/>
        <label className="custom-control-label" htmlFor={`check-${name}`}>{name}</label>
      </div>
    )
  }

  render() {
    const checkBoxes = NAMES.map(n => this.renderCheckbox(n))
    return(
      <div>
        <h2>Optional Roles</h2>
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

    const state = {}
    state[NAMES[0]] = false
    state[NAMES[1]] = false
    state[NAMES[2]] = false
    state[NAMES[3]] = false
    state['players'] = []
    state['isStarted'] = false
    this.state = state

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

    socket.on('start_game_success', function(data) {
      this.setState({ isStarted: true })
    }.bind(this))

    socket.emit('room_status', {'room': this.props.room})

    this.handleCheckboxClick = this.handleCheckboxClick.bind(this)
    this.handleStartGameClick = this.handleStartGameClick.bind(this)
    this.renderButton = this.renderButton.bind(this)
  }

  handleCheckboxClick(name) {
    this.setState({ name: true })
  }

  handleStartGameClick() {
    this.setState({ isClick: true })
    let data = {}
    data['room'] = this.props.room
    data[NAMES[0]] = this.state[NAMES[0]]
    data[NAMES[1]] = this.state[NAMES[1]]
    data[NAMES[2]] = this.state[NAMES[2]]
    data[NAMES[3]] = this.state[NAMES[3]]
    socket.emit('start_game', data)
  }

  renderButton() {
    return(
      <button className={"btn btn-danger"}
              onClick={this.handleStartGameClick}
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
                <PlayerList players={this.state.players} />
              </td>
              <td style={halfWidth}>
                <OptionalRoles onClick={this.handleCheckboxClick} />
              </td>
            </tr>
            <tr>
              <td colSpan="2">
                {this.renderButton()}
              </td>
            </tr>
          </tbody>
        </table>
      )
    } else {
      return(<Avalon roomId={this.props.room} />)
    }
  }
}
