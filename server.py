import bson.json_util
import flask
import flask_socketio
import pymongo


app = flask.Flask(__name__, static_url_path='', static_folder='public')
app.config['SECRET_KEY'] = 'secret!'
socketio = flask_socketio.SocketIO(app)
client = pymongo.MongoClient()
db = client.test_database


@app.route('/favicon.ico')
def favicon():
  return flask.send_from_directory('public', 'favicon.ico')


@app.route('/')
def home_page():
  return flask.send_from_directory('public', 'index.html')


@socketio.on('connect_event')
def connect_event(data):
  pass


@socketio.on('name_check')
def name_check(data):
  room = db.rooms.find_one({'room_id': data['room']})
  # The name is not valid if the room exists and
  # a person with the same name already occupies the room
  valid_name = not room is None and data['name'] in room['players']
  socketio.emit('name_code', {'valid': valid_name})


@socketio.on('room_check')
def room_check(data):
  print('room_check: ' + str(data))
  room = db.rooms.find_one({'room_id': data['room']})
  print('room is: ' + str(room))
  socketio.emit('room_code', {'valid': room is None})


@socketio.on('create_game')
def create_game(data):
  print('create_game: ' + str(data))
  r = db.rooms.find_one({'room_id': data['room']})
  if r is None:
    print('validated that game does not exist')
    room = _create_game(data['room'], data['name'])
    print('inserting room: ' + str(room))
    db.rooms.insert_one(room)

    flask_socketio.emit('join_room_success', {'room': data['room']})
    flask_socketio.join_room(data['room'])
  else:
    print('room already exists')
    flask_socketio.emit('join_room_failure', {'room': data['room']})


@socketio.on('join_game')
def join_game(data):
  print('join_game: ' + str(data))
  room = db.rooms.find_one({'room_id': data['room']})
  if room is None or room['is_started']:
    print('room does not exist; could not join')
    flask_socketio.emit('join_room_failure',
        {'msg': 'Could not join room ' + data['room']})
  else:
    print('room exists; joining')
    db.rooms.find_one_and_update({'room_id': data['room']},
      {
        '$push': {
          'players': data['name']
        }
      })

    print('emitting success')
    flask_socketio.emit('join_room_success', {'room': data['room']})
    flask_socketio.join_room(data['room'])
    flask_socketio.emit('player_join',
        {'name': data['name'], 'msg': 'entered the game.'}, room=data['room'])


@socketio.on('room_status')
def room_status(data):
  print('room_status: ' + str(data))
  room = db.rooms.find_one({'room_id': data['room']})
  print('room: ' + str(room))
  if room is None:
    flask_socketio.emit('room_status_error', {'msg': 'Invalid room'})
  else:
    flask_socketio.emit('room_status', {'room': bson.json_util.dumps(room)})


@socketio.on('start_game')
def start_game(data):
  room = db.rooms.find_one({'room_id': data['room']})
  if not room is None and not room['is_started']:
    db.rooms.find_one_and_update({'room_id': data['room']},
      {
        '$set': {
          'is_started': True
        }
      })
    flask_socketio.emit('start_game_success',
        {'room': bson.json_util.dumps(room)}, room=data['room'])
  else:
    flask_socketio.emit('start_game_failure',
        {'msg': 'Could not start game: ' + data['room']}, room=data['room'])


def _create_game(room, name):
  return {
    'room_id': room,
    'players': [name],
    'is_started': False,
    'is_over': False,
  }


if __name__ == '__main__':
  socketio.run(app)
