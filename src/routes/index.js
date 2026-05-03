const homeRouter = require("./home");
const authRouter = require("./auth");
const adminRouter = require("./admin");
const userRouter = require("./user");
const teamRouter = require("./team");
const submissionsRouter = require("./submissions");
const challengeRouter = require("./challenge");

function route(app) {
  app.use("/", homeRouter);
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/admin", adminRouter);
  app.use("/team", teamRouter);
  app.use("/submissions", submissionsRouter);
  app.use("/challenges", challengeRouter);
}

module.exports = route;
