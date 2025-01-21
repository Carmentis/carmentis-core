import { Server } from "socket.io";

export class wiServer {
  constructor(server) {
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

console.log(io);

    io.on("connection", this.connect);
  }

  connect(socket) {
    console.log("connection");

    socket.on("disconnect", function () {
      console.log("disconnected");
    });
  }
}
