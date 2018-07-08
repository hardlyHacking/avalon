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
    const icon = this.props.proposed ?
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className="feather feather-users">
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
    const waiting = this.props.waiting ?
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className="feather feather-watch">
          <circle cx="12" cy="12" r="7"></circle>
          <polyline points="12 9 12 12 13.5 13.5"></polyline>
          <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"></path>
        </svg>
      </div> : null
    return(
      <div>
        {this.props.name} {icon} {waiting}
      </div>
    )
  }
}

class PlayerCircle extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    const turn = this.props.room.turn === 0 ? 0 :
        this.props.room.turn % this.props.room.players.length
    const proposalAccept = new Set(this.props.room.proposal_accept)
    const proposalReject = new Set(this.props.room.proposal_reject)
    const proposed = new Set(this.props.room.proposal)
    const name = this.props.room.players[turn]

    const playerList = this.props.room.players.map((p, index) => {
      const c = index === turn ? "list-group-item active" : "list-group-item"
      const isWaiting = this.props.room.is_proposing_team ?
        name === p : !(proposalAccept.has(p) || proposalReject.has(p))
      return <li key={p}
                 className={c}
                 onClick={() => this.props.onClick(p)}>
               <Player name={p}
                       waiting={isWaiting}
                       selected={this.props.selected.has(p)}
                       proposed={proposed.has(p)} />
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

    socket.on('vote_proposal_success', function(data) {
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
        <PlayerCircle onClick={this.onPlayerClick}
                      selected={this.state.selected}
                      room={this.state.room} />
        <ActionButton room={this.state.room}
                      roomId={this.props.roomId}
                      selected={this.state.selected} />
      </div>
    )
  }
}
