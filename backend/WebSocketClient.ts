import WebSocket from 'ws'

function WebSocketClient() {
  this.number = 0;	// Message number
  this.autoReconnectInterval = 5 * 1000;	// ms
}
WebSocketClient.prototype.open = function (url: string) {
  this.url = url;
  this.instance = new WebSocket(this.url, { maxPayload: 10000000 });
  this.instance.on('open', () => {
    this.onopen();
  });
  this.instance.on('message', (data: any, flags: any) => {
    this.number++;
    this.onmessage(data, flags, this.number);
  });
  this.instance.on('close', (e: any) => {
    switch (e.code) {
      case 1000:	// CLOSE_NORMAL
        console.log("WebSocket: closed");
        break;
      default:	// Abnormal closure
        this.reconnect(e);
        break;
    }
    this.onclose(e);
  });
  this.instance.on('error', (e: any) => {
    switch (e.code) {
      case 'ECONNREFUSED':
        this.reconnect(e);
        break;
      default:
        this.onerror(e);
        break;
    }
  });
  this.instance.on('ping', () => {
    console.log('received ping');
  });
  this.instance.on('pong', () => {
    console.log('received pong');
  });
  this.instance.on('upgrade', (response: any) => {
    //console.log('received upgrade');
  });
}
WebSocketClient.prototype.send = function (data: any, option: any) {
  try {
    this.instance.send(data, option);
  } catch (e) {
    this.instance.emit('error', e);
  }
}
WebSocketClient.prototype.reconnect = function (e: any) {
  console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e);
  this.instance.removeAllListeners();
  var that = this;
  setTimeout(function () {
    console.log("WebSocketClient: reconnecting...");
    that.open(that.url);
  }, this.autoReconnectInterval);
}
WebSocketClient.prototype.onopen = function (e: any) { console.log("WebSocketClient: open", arguments); }
WebSocketClient.prototype.onmessage = function (data: any, flags: any, number: any) { console.log("WebSocketClient: message", arguments); }
WebSocketClient.prototype.onerror = function (e: any) { console.log("WebSocketClient: error", arguments); }
WebSocketClient.prototype.onclose = function (e: any) { console.log("WebSocketClient: closed", arguments); }

export default WebSocketClient