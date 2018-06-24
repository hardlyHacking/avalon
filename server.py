import bson.json_util
import flask
import flask_socketio
import pymongo
import random


ALWAYS_PRESENT = ['Assassin', 'Merlin']
EVIL = ['Mordred, Morgana, Oberon', 'Minion of Mordred']
GOOD = ['Merlin', 'Percival', 'Loyal Servant of Arthur']
GENERIC_BAD, GENERIC_GOOD = 'Minion of Mordred', 'Loyal Servant of Arthur'
OPTIONAL_ROLES = ['Mordred', 'Morgana', 'Percival', 'Oberon']


app = flask.Flask(__name__, static_url_path='', static_folder='public')
app.config['SECRET_KEY'] = 'secret!'
socketio = flask_socketio.SocketIO(app)
client = pymongo.MongoClient()
db = client.test_database


# In-memory mapping of socket-id's to user OPTIONAL_ROLES and rooms
# Used to determine which sockets belong to which named users
# and broadcast on socket disconnect events
NO_AUTH = 'unnamed'
CLIENTS = {NO_AUTH: set()}


@app.route('/favicon.ico')
def favicon():
  ''' Favicon inspired by @angadsg. :) '''
  return flask.send_from_directory('public', 'favicon.ico')


@app.route('/')
def home_page():
  ''' Welcome. '''
  return flask.send_from_directory('public', 'index.html')


@socketio.on('connect')
def connect_event():
  ''' A user reached the home page '''
  sid = flask.request.sid
  CLIENTS[NO_AUTH].add(sid)


@socketio.on('disconnect')
def disconnect():
  ''' A user left *any* page '''
  sid = flask.request.sid
  _leave_game(sid)


@socketio.on('name_check')
def name_check(data):
  ''' Check if a person with the same name already exists in a given room. '''
  room = db.rooms.find_one({'room_id': data['room']})
  # The name is not valid if the room exists and
  # a person with the same name already occupies the room
  valid_name = not room is None and data['name'] in room['players']
  socketio.emit('name_code', {'valid': valid_name})


@socketio.on('room_check')
def room_check(data):
  ''' Check if a room name already exists. '''
  room = db.rooms.find_one({'room_id': data['room']})
  socketio.emit('room_code', {'valid': room is None})


@socketio.on('create_game')
def create_game(data):
  ''' Create a new game and join it. '''
  r = db.rooms.find_one({'room_id': data['room']})
  # Normal case
  if r is None:
    # Create new room in DB
    room = _create_game(data['room'], data['name'])
    db.rooms.insert_one(room)

    # Join socket user to room
    _join_room(flask.request.sid, data['name'], data['room'])

    flask_socketio.emit('join_room_success', {'room': data['room']})
    flask_socketio.join_room(data['room'])
  # Cannot create a room that already exists
  else:
    flask_socketio.emit('join_room_failure', {'room': data['room']})


@socketio.on('join_game')
def join_game(data):
  ''' A user joined a game. '''
  room = db.rooms.find_one({'room_id': data['room']})
  if room is None or (room['is_started'] and not data['name'] in room['roles']):
    flask_socketio.emit('join_room_failure',
        {'msg': 'Could not join room ' + data['room']})
  else:
    # Update DB
    db.rooms.find_one_and_update({'room_id': data['room']},
      {
        '$push': {
          'players': data['name']
        }
      })

    # Update in-memory socket mapping
    _join_room(flask.request.sid, data['name'], data['room'])

    flask_socketio.emit('join_room_success', {'room': data['room']})
    flask_socketio.join_room(data['room'])
    flask_socketio.emit('player_join',
        {'name': data['name'], 'msg': 'entered the game.'}, room=data['room'])


@socketio.on('room_status')
def room_status(data):
  ''' General endpoint to fetch game state. '''
  room = db.rooms.find_one({'room_id': data['room']})
  if room is None:
    flask_socketio.emit('room_status_error', {'msg': 'Invalid room'})
  else:
    flask_socketio.emit('room_status', {'room': bson.json_util.dumps(room)})


@socketio.on('start_game')
def start_game(data):
  ''' All inclined users have joined; start the game. '''
  room = db.rooms.find_one({'room_id': data['room']})
  if not room is None and not room['is_started'] \
        and len(room['players']) > 4 and len(room['players']) < 11:
    room = _assign_roles(room, data)
    db.rooms.replace_one({'room_id': data['room']}, room)

    flask_socketio.emit('start_game_success',
        {'room': bson.json_util.dumps(room)}, room=data['room'])
  else:
    flask_socketio.emit('start_game_failure',
        {'msg': 'Could not start game: ' + data['room']}, room=data['room'])


def _assign_roles(room, data):
    room['is_started'] = True
    players = room['players']
    num_players = len(players)
    if num_players < 7:
        total_bad = 2
    elif num_players < 10:
        total_bad = 3
    elif num_players == 10:
        total_bad = 4
    total_good = num_players - total_bad

    # Filter in all selected optional roles
    num_good, num_bad = 0, 0
    optional_roles = set(OPTIONAL_ROLES)
    [optional_roles.remove(n) for n in OPTIONAL_ROLES if not data[n]]

    # Randomly assign optional roles to players
    mapping = {}
    for role in optional_roles:
        p = random.choice(players)
        mapping[p] = role
        players.remove(p)
        if role == 'Mordred' or role == 'Morgana':
            num_bad += 1
        else:
            num_good += 1
    for role in ALWAYS_PRESENT:
        p = random.choice(players)
        mapping[p] = role
        players.remove(p)
    num_bad += 1
    num_good += 1

    # Randomly assign the ordinary roles to remaining players
    # (loyal servant of arthur and minion or mordred)
    while num_bad < total_bad:
        p = random.choice(players)
        mapping[p] = GENERIC_BAD
        players.remove(p)
        num_bad += 1
    while num_good < total_good:
        p = random.choice(players)
        mapping[p] = GENERIC_GOOD
        players.remove(p)
        num_good += 1

    # Return modified object
    room['roles'] = mapping
    room['players'] = [k for k in mapping]
    print('room: {}'.format(room))
    return room


def _create_game(room, name):
  ''' Create a new game object. '''
  return {
    'room_id': room,
    'roles': {},
    'players': [name],
    'is_started': False,
    'is_over': False,
  }


def _join_room(sid, name, room):
  ''' A user that was already in the page joined a room. '''
  CLIENTS[NO_AUTH].remove(sid)
  CLIENTS[sid] = {'name': name, 'room': room}


def _leave_game(sid):
  ''' A user left the page - either in a game or otherwise. '''
  # User was in a room
  if sid in CLIENTS:
    client = CLIENTS[sid]
    room = db.roomes.find_one_and_update({'room_id': client['room']},
      {
        '$pull': {
          'players': client['name']
        }
      })
    CLIENTS.pop(sid)
    flask_socketio.emit('player_leave',
        {'name': client['name'], 'msg': 'left the game.'}, room=client['room'])
  # User was not in any room
  else:
    CLIENTS[NO_AUTH].discard(sid)


if __name__ == '__main__':
  socketio.run(app)
