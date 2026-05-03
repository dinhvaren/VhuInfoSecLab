require("dotenv").config();
const express = require("express");
const route = require("./routes");
const session = require("express-session");
const path = require("path");
const cookieParser = require("cookie-parser");
const db = require("./config/database");
const app = express();
const { engine } = require("express-handlebars");
const { loadUser } = require("./app/middlewares/auth.middleware");

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/image", express.static(path.join(__dirname, "..", "image")));
app.use(express.static(path.join(__dirname, "..", "public")));

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    helpers: {
      eq: (a, b) => {
        if (!a || !b) return false;
        return a.replace(/\/$/, "") === b.replace(/\/$/, "");
      },
      isRole: (role, expectedRole) => {
        return role === expectedRole;
      },
      navClass: (link, currentPath) => {
        if (!currentPath) return "text-light";
        return link === currentPath ? "text-white" : "text-light";
      },
      activeClass: (link, currentPath) => {
        if (!currentPath) return "";

        const cleanLink = String(link).replace(/\/$/, "");
        const cleanPath = String(currentPath).replace(/\/$/, "");

        return cleanLink === cleanPath ? "text-white active-link" : "";
      },
      json: (context) => JSON.stringify(context),
    },

    partialsDir: [
      path.join(__dirname, "views/partials"),
      path.join(__dirname, "views/pages"),
      path.join(__dirname, "views/error"),
      path.join(__dirname, "views/auth"),
      path.join(__dirname, "views/admin"),
    ],
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
    },
    defaultLayout: "main",
  }),
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

const port = process.env.PORT;
const host = process.env.HOST;

db.connect();

const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(loadUser);

route(app);

app.listen(port, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
