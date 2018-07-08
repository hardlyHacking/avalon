class TurnLabel extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    const name = this.props.turn === 0 ? this.props.players[0] :
        this.props.players[this.props.players.length % this.props.turn]
    const mission = this.props.isMission ? `Mission in progress` :
      (this.props.isProposingTeam ? `Waiting for ${name}'s proposal` :
        (this.props.isVotingProposal ? `Vote on ${name}'s proposal` : null))
    return(
      <div>
        <h2>{`${name}'s Turn`}</h2>
        <h3>{`${mission}`}</h3>
      </div>
    )
  }
}

class Player extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    const wrapper = this.props.proposed ?
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             class="feather feather-users">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      : (this.props.selected ?
      <div>
        <svg xmlns="http://www.w3.org/2000/svg"
             width="24" height="24" viewBox="0 0 24 24">
          <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
        </svg>
      </div> : null)
    return(
      <div>
        {this.props.name} {wrapper}
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
      const c = index === this.props.turn ? "list-group-item active" : "list-group-item"
      return <li key={p}
                 className={c}
                 onClick={() => this.props.onClick(p)}>
               <Player name={p}
                       selected={this.props.selected.has(p)}
                       proposed={this.props.proposed.has(p)} />
             </li>
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

class ActionButton extends React.Component {

  constructor(props) {
    super(props)

    this.ackProposal = this.ackProposal.bind(this)
    this.proposeTeam = this.proposeTeam.bind(this)
    this.voteProposal = this.voteProposal.bind(this)
  }

  ackProposal() {
    socket.emit('ack_proposal', { 'room': this.props.roomId })
  }

  proposeTeam() {
    socket.emit('propose_team', {
      'room': this.props.roomId,
      'proposal': [...this.props.selected]
    })
  }

  voteProposal(vote) {
    socket.emit('vote_proposal', {
      'room': this.props.roomId,
      'vote': vote
    })
  }

  render() {
    const room = this.props.room

    const isYourTurn = room.current_player === room.players[room.turn]
    if (room.is_proposing_team && isYourTurn) {
      const btnDisabled = this.props.selected.size !== room.max_count[room.turn]
      return(
        <div>
          <button type="button"
                  className="btn btn-secondary"
                  disabled={btnDisabled}
                  onClick={this.proposeTeam}
          >Propose</button>
        </div>
      )
    } else if (room.is_voting_proposal) {
      return(
        <div>
          <button type="button"
                  className="btn btn-success"
                  onClick={() => this.voteProposal(true)}
          >Accept</button>
          <button type="button"
                  className="btn btn-danger"
                  onClick={() => this.voteProposal(false)}
          >Reject</button>
        </div>
      )
    } else if (room.is_proposal_ack) {
      return(
        <div>
          <button type="button"
                  className="btn btn-secondary"
                  onClick={this.ackProposal}
          >Ok</button>
        </div>
      )
    } else if (room.is_mission) {
      return(
        <div>
          <button type="button" className="btn btn-success">Success</button>
          <button type="button" className="btn btn-danger">Fail</button>
        </div>
      )
    }

    return null
  }
}

class Avalon extends React.Component {

  constructor(props) {
    super(props)

    this.state = { fetched: false, room: {}, selected: new Set() }

    socket.emit('room_status', {'room': this.props.roomId})

    socket.on('room_status', function(data) {
      this.setState({ room: JSON.parse(data['room']), fetched: true })
    }.bind(this))

    socket.on('propose_team_failure', function(data) {
      alert('Invalid proposal')
    })

    socket.on('propose_team_success', function(data) {
      socket.emit('room_status', {'room': this.props.roomId})
    }.bind(this))

    this.onPlayerClick = this.onPlayerClick.bind(this)
  }

  onPlayerClick(player) {
    const room = this.state.room
    if (room.is_proposing_team &&
        room.current_player === room.players[room.turn]) {
      if (this.state.selected.has(player)) {
        this.setState({
          selected: new Set([...this.state.selected].filter(x => x !== player))
        })
      } else {
        const selected = this.state.selected.size
        const allowed = room.max_count[room.turn]
        if (selected < allowed) {
          this.setState({
            selected: new Set([...this.state.selected].concat(player))
          })
        }
      }
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
        <TurnLabel players={this.state.room.players}
                   turn={this.state.room.turn}
                   isProposingTeam={this.state.room.is_proposing_team}
                   isMission={this.state.room.is_mission}
                   isVotingProposal={this.state.room.is_voting_proposal} />
        <PlayerCircle players={this.state.room.players}
                      onClick={this.onPlayerClick}
                      selected={this.state.selected}
                      proposed={new Set(this.state.room.proposal)}
                      turn={this.state.room.turn ===0 ? 0 :
                            this.state.room.turn % this.state.room.players.length} />
        <ActionButton room={this.state.room}
                      roomId={this.props.roomId}
                      selected={this.state.selected} />
      </div>
    )
  }
}
