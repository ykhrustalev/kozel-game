define(['io'], function (io) {
  var socket = io.connect(window.location);

  socket.on("app:reload", function () {
    window.location.reload();
  });

  return socket;
});
