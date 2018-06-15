class Landing extends React.Component {

  constructor(props) {
    super(props)
    this.state = { room: '', name: '', emptyRoomId: true, emptyName: true,
                   delayTimer: null, validName: false, createClick: false,
                   joinClick: false, isJoinRoom: false }

    this.createGame = this.createGame.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.joinGame = this.joinGame.bind(this)
    this.keyUp = this.keyUp.bind(this)
    this.renderForm = this.renderForm.bind(this)
    this.renderInvalidNameError = this.renderInvalidNameError.bind(this)

    socket.on('room_code', function(data) {
      this.setState({ isJoinRoom: !data.valid })
    }.bind(this))

    socket.on('name_code', function(data) {
      this.setState({ validName: data.valid })
    }.bind(this))
  }

  createGame() {
    this.setState({ createClick: true })
    const room = this.state.room
    const name = this.state.name
    socket.emit('create_game', {'room': room, 'name': name})
  }

  joinGame() {
    this.setState({ joinClick: true })
    const room = this.state.room
    const name = this.state.name
    socket.emit('join_game', {'room': room, 'name': name})
  }

  handleChange(event) {
    const emptyName = event.target.name === 'room' ? 'emptyRoomId' : 'emptyName'
    let state = {}
    state[event.target.name] = event.target.value
    state[emptyName] = event.target.value === ''
    this.setState(state)
  }

  keyUp(event) {
    clearTimeout(this.state.delayTimer)
    const name = event.target.name
    const value = event.target.value

    const room = this.state.room
    const playerName = this.state.name

    this.setState({
      delayTimer: setTimeout(function() {
        socket.emit(name + '_check', {'room': room, 'name': playerName})
      }, 1000)
    })
  }

  renderForm() {
    return(
      <div className={"container-fluid d-flex justify-content-center text-center"}>
        <table>
          <tbody>
          <tr><td><h2>Avalon</h2></td></tr>
          <tr>
            <td>
              <div className="input-group">
                <div className={"input-group-prepend"}>
                  <span className={"input-group-text"}>Game Code</span>
                </div>
                <input type="text"
                       className={"form-control"}
                       id="room"
                       name="room"
                       value={this.state.room}
                       onChange={this.handleChange}
                       onKeyUp={this.keyUp} />
              </div>
              <div className="input-group">
                <div className={"input-group-prepend"}>
                  <span className={"input-group-text"}>Player Name</span>
                </div>
                <input type="text"
                       className={"form-control"}
                       id="name"
                       name="name"
                       value={this.state.name}
                       onChange={this.handleChange}
                       onKeyUp={this.keyUp} />
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <button className={"btn btn-primary"}
                      disabled={!(!this.state.emptyRoomId && !this.state.emptyName && this.state.isJoinRoom && !this.state.joinClick)}
                      onClick={this.joinGame}
                      type="button"
              >Join Game</button>
              <button className={"btn btn-success"}
                      disabled={!(!this.state.emptyRoomId && !this.state.emptyName && !this.state.isJoinRoom && !this.state.createClick)}
                      onClick={this.createGame}
                      type="button"
              >Create Game</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    )
  }

  renderInvalidNameError() {
    if (!this.state.validName) {
      return null;
    }
    return(
      <div className={"alert alert-danger"} role="alert">
        Invalid user name for this particular Game Code.
      </div>
    )
  }

  render() {
    return(
      <div>
        {this.renderInvalidNameError()}
        {this.renderForm()}
      </div>
    )
  }
}
