import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as express from "express";
import * as path from "path";
// import * as webhttp from "http";
// import * as socketio from "socket.io";

import { feedRouter } from "./routes/feed";
import { loginRouter } from "./routes/login";
import { protectedRouter } from "./routes/protected";
import { publicRouter } from "./routes/public";
import { userRouter } from "./routes/user";

const app: express.Application = express();
// const http: webhttp.Server = webhttp.createServer(app);
// const io: SocketIO.Server = socketio(http);

app.disable("x-powered-by");

app.use(bodyParser.json());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));

// api routes
app.use("/api/secure", protectedRouter);
app.use("/api/login", loginRouter);
app.use("/api/public", publicRouter);
app.use("/api/feed", feedRouter);
app.use("/api/user", userRouter);

if (app.get("env") === "production") {

  // in production mode run application from dist/client folder
  app.use(express.static(path.join(__dirname, "/../client")));
  //app.use('/data', express.static(path.join(__dirname, "/../server/data")));
}
else {
  //app.use(express.static(__dirname));

  // Serve static .txt files only inside the /data/ directory
  //app.use('/data', express.static(__dirname + '/data'));

  //app.use('/data', express.static(path.join(__dirname, '/../server/data')))
}

// catch 404 and forward to error handler
app.use((req: express.Request, res: express.Response, next) => {
  const err = new Error("Not Found");
  next(err);
});

// production error handler
// no stacktrace leaked to user
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {

  res.status(err.status || 500);
  res.json({
    error: {},
    message: err.message,
  });
});

// This starts the API Server
export { app };
console.log('Starting Server...');



// export { app1 };