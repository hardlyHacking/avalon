import flask
import flask_socketio
import json
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
  valid_name = not room is None and data['name'] in room.names
  socketio.emit('name_code', {'valid': valid_name})


@socketio.on('room_check')
def room_check(data):
  room = db.rooms.find_one({'room_id': data['room']})
  socketio.emit('room_code', {'valid': room is None})


@socketio.on('create_game')
def create_game(data):
  room = {
    'room_id': data['room'],
    'players': [data['name']]
  }
  db.rooms.insert_one(room)

  flask.socketio.emit('create_game_success', {room: data['room']})
  flask_socketio.join_room(data['room'])
  flask_socketio.send(data['name'] + ' has created the game.', room=data['room'])


@socketio.on('join_game')
def join_game(data):
  db.rooms.find_one_and_update({'room_id': data['room']},
    {
      '$push': {
        'players': data['name']
      }
    })

  flask.socketio.emit('join_game_succes', {room: data['room']})
  flask_socketio.join_room(data['room'])
  flask_socketio.send(data['name'] + ' has entered the game.', room=data['room'])


if __name__ == '__main__':
  socketio.run(app)
