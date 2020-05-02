import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});
const socket_io_port = nconf.get('ports:socket_io');
import Socketio from 'socket.io'
let io = Socketio(socket_io_port);
import Debug from 'debug'
const debug = Debug('socketio');

io.on('connection', function (socket) {
  debug('Socket.IO connected [' + socket.id + ']');
  socket.on('disconnect', function () {
    debug('Socket.IO disconnected [' + socket.id + ']');
  });
});

let sendToBrowser = function(event: any, data: any) {
  io.emit(event, data);
}

export {
  sendToBrowser
}