var nconf = require('nconf');
nconf.file({
  file: 'config.json',
  search: true
});
var socket_io_port = nconf.get('ports:socket_io');
var io = require('socket.io')(socket_io_port);
var debug = require('debug')('socketio');

io.on('connection', function (socket) {
  debug('Socket.IO connected [' + socket.id + ']');
  socket.on('disconnect', function () {
    debug('Socket.IO disconnected [' + socket.id + ']');
  });
});

module.exports.sendToBrowser = function(event, data) {
  io.emit(event, data);
}