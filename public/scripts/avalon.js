class MissionCircle extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    const circleStyle = {
      background: 'red',
      borderRadius: '80px',
      color: 'white',
      height: '80px',
      fontWeight: 'bold',
      width: '80px',
      display: 'table',
      margin: '20px auto'
    }

    const circleTextStyle = {
      fontSize: '35px',
      verticalAlign: 'middle',
      display: 'table-cell'
    }

    const cls = this.props.status === 0 ? `bg-secondary` :
        (this.props.status === 1 ? `bg-success` : `bg-danger`)

    return(
      <div style={circleStyle} className={cls}>
        <p style={circleTextStyle} className={"text-center"}>{this.props.count}</p>
      </div>
    )
  }
}

class MissionBoard extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    const missionCircles = this.props.missions.map((m, index) =>
        <MissionCircle key={index}
                       count={this.props.maxCount[index]}
                       status={m} />)

    return(
      <div className="row">
        {missionCircles}
      </div>
    )
  }
}

class TurnLabel extends React.Component {

  constructor(props) {
    super(props)
  }

  getSubtext(name) {
    if (this.props.isMission) {
      return `Mission in progress`
    } else if (this.props.isProposingTeam) {
      return `Waiting for ${name}'s proposal'`
    } else if (this.props.isVotingProposal) {
      return `Vote on ${name}'s proposal'`
    }
    return null
  }

  render() {
    const name = this.props.turn === 0 ? this.props.players[0] :
        this.props.players[this.props.turn % this.props.players.length]
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
    const status = this.props.proposed ?
        // Team icon
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="feather feather-users">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
      : (this.props.selected ?
        // Checkmark
        <div>
          <svg xmlns="http://www.w3.org/2000/svg"
               width="24" height="24" viewBox="0 0 24 24">
            <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
          </svg>
        </div> : null)
    const waiting = this.props.waiting ?
      // Timer icon
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className="feather feather-watch">
          <circle cx="12" cy="12" r="7"/>
          <polyline points="12 9 12 12 13.5 13.5"/>
          <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"/>
        </svg>
      </div> : null
    const voteStatus = this.props.voteComplete ? (this.props.accepted ?
        // Thumbsup
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="feather feather-thumbs-up">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
        </div> :
        // Thumbsdown
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="feather feather-thumbs-down">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
          </svg>
        </div> ) : null
    return(
      <div className="row">
        {this.props.name} {status} {voteStatus} {waiting}
      </div>
    )
  }
}

class PlayerCircle extends React.Component {

  constructor(props) {
    super(props)
  }

  calculateWaiting(room, player, accepted, rejected, acked) {
    if (room.is_proposing_team) {
      return name === player
    } else if (room.is_voting_proposal) {
      return !(accepted.has(player) || rejected.has(player))
    } else if (room.is_proposal_ack) {
      return !acked.has(player)
    }
    return false
  }

  render() {
    const turn = this.props.room.turn === 0 ? 0 :
        this.props.room.turn % this.props.room.players.length
    const proposalAccept = new Set(this.props.room.proposal_accept)
    const proposalReject = new Set(this.props.room.proposal_reject)
    const proposed = new Set(this.props.room.proposal)
    const acked = new Set(this.props.room.proposal_ack)
    const name = this.props.room.players[turn]

    const playerList = this.props.room.players.map((p, index) => {
      const c = index === turn ? "list-group-item active" : "list-group-item"
      const isWaiting = this.calculateWaiting(
          this.props.room, p, proposalAccept, proposalReject, acked)
      return <li key={p}
                 className={c}
                 onClick={() => this.props.onClick(p)}>
               <Player name={p}
                       waiting={isWaiting}
                       voteComplete={this.props.room.is_proposal_ack}
                       accepted={proposalAccept.has(p)}
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
    this.voteMission = this.voteMission.bind(this)
    this.voteProposal = this.voteProposal.bind(this)
  }

  ackProposal() {
    socket.emit('ack_proposal', { 'room': this.props.roomId })
    this.props.onClick()
  }

  proposeTeam() {
    socket.emit('propose_team', {
      'room': this.props.roomId,
      'proposal': [...this.props.selected]
    })
    this.props.onClick()
  }

  voteMission(vote) {
    socket.emit('vote_mission', {
      'room': this.props.roomId,
      'vote': vote
    })
    this.props.onClick()
  }

  voteProposal(vote) {
    socket.emit('vote_proposal', {
      'room': this.props.roomId,
      'vote': vote
    })
    this.props.onClick()
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
      const proposalAccept = new Set(room.proposal_accept)
      const proposalReject = new Set(room.proposal_reject)
      const voteDisabled = proposalAccept.has(room.current_player) ||
          proposalReject.has(room.current_player)
      return(
        <div>
          <button type="button"
                  className="btn btn-success"
                  disabled={voteDisabled}
                  onClick={() => this.voteProposal(true)}
          >Accept</button>
          <button type="button"
                  className="btn btn-danger"
                  disabled={voteDisabled}
                  onClick={() => this.voteProposal(false)}
          >Reject</button>
        </div>
      )
    } else if (room.is_proposal_ack) {
      const proposalAck = new Set(room.proposal_ack)
      return(
        <div>
          <button type="button"
                  className="btn btn-secondary"
                  disabled={proposalAck.has(room.current_player)}
                  onClick={this.ackProposal}
          >Ok</button>
        </div>
      )
    } else if (room.is_mission) {
      const proposal = new Set(room.proposal)
      const votes = new Set(room.mission_vote)
      if (proposal.has(room.current_player)) {
        const actionDisabled = votes.has(room.current_player)
        return(
          <div>
            <button type="button"
                    className="btn btn-success"
                    disabled={actionDisabled}
                    onClick={() => this.voteMission(true)}
            >Success</button>
            <button type="button"
                    className="btn btn-danger"
                    disabled={actionDisabled}
                    onClick={() => this.voteMission(false)}
            >Fail</button>
          </div>
        )
      }
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

    socket.on('propose_team_success', function(data) {
      socket.emit('room_status', {'room': this.props.roomId})
    }.bind(this))

    socket.on('vote_mission_success', function(data) {
      socket.emit('room_status', {'room': this.props.roomId})
    }.bind(this))

    socket.on('vote_proposal_success', function(data) {
      socket.emit('room_status', {'room': this.props.roomId})
    }.bind(this))

    socket.on('ack_proposal_success', function(data) {
      socket.emit('room_status', {'room': this.props.roomId})
    }.bind(this))

    this.clearSelected = this.clearSelected.bind(this)
    this.onPlayerClick = this.onPlayerClick.bind(this)
  }

  clearSelected() {
    this.setState({
      selected: new Set()
    })
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
                      selected={this.state.selected}
                      onClick={this.clearSelected} />
        <MissionBoard maxCount={this.state.room.max_count}
                      missions={this.state.room.missions} />
      </div>
    )
  }
}
