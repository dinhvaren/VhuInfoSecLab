const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Team } = require("../models/index");
require("dotenv").config();

class AuthController {
  // [GET] /auth/login
  showLogin(req, res) {
    try {
      res.render("auth/login", {
        title: "Login | CTF Platform",
        message: "Sign in to access your challenges.",
      });
    } catch (err) {
      console.error("ShowLogin Error:", err);
      res.status(500).render("error/500", {
        message: "Server error while rendering login page.",
      });
    }
  }

  // [GET] /auth/register-individual
  showRegisterIndividual(req, res) {
    try {
      res.render("auth/register-individual", {
        title: "Register Individual | CTF Platform",
        message: "Create a personal account to join the competition.",
      });
    } catch (err) {
      console.error("ShowRegisterIndividual Error:", err);
      res.status(500).render("error/500", {
        message: "Server error while rendering register page.",
      });
    }
  }

  // [GET] /auth/register (team)
  showRegister(req, res) {
    try {
      res.render("auth/register", {
        title: "Register Team | CTF Platform",
        message: "Register your team and invite members to compete together.",
      });
    } catch (err) {
      console.error("ShowRegister Error:", err);
      res.status(500).render("error/500", {
        message: "Server error while rendering register page.",
      });
    }
  }

  // [POST] /auth/register-individual
  async registerIndividual(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res
          .status(400)
          .json({ message: "Please fill in all required fields." });
      }

      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Username or email already taken." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role: "user",
        status: "active",
      });

      return res.status(201).json({
        message: "Registration successful!",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (err) {
      console.error("RegisterIndividual Error:", err);
      res
        .status(500)
        .json({ message: "Server error. Please try again later." });
    }
  }

  // [POST] /auth/register (team)
  async register(req, res) {
    try {
      const { teamName, members } = req.body;

      if (!teamName || !Array.isArray(members) || members.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid team registration data." });
      }

      const existingTeam = await Team.findOne({ name: teamName });
      if (existingTeam) {
        return res.status(400).json({ message: "Team name already exists." });
      }

      const newTeam = await Team.create({ name: teamName });
      const createdMembers = [];

      for (const member of members) {
        const { username, email, password } = member;
        if (!username || !email || !password) continue;

        const duplicate = await User.findOne({
          $or: [{ username }, { email }],
        });
        if (duplicate) continue;

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
          username,
          email,
          password: hashedPassword,
          role: "user",
          team: newTeam._id,
        });

        createdMembers.push(newUser._id);
      }

      newTeam.members = createdMembers;
      await newTeam.save();

      return res.status(201).json({
        message: "Team registered successfully!",
        team: {
          id: newTeam._id,
          name: newTeam.name,
          totalMembers: createdMembers.length,
        },
      });
    } catch (err) {
      console.error("RegisterTeam Error:", err);
      res
        .status(500)
        .json({ message: "Server error. Please try again later." });
    }
  }

  // [POST] /auth/login
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.redirect("/auth/login");
      }

      const user = await User.findOne({ username }).populate("team");
      if (!user) {
        return res.redirect("/auth/login");
      }

      if (user.status === "banned") {
        return res.redirect("/auth/login");
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.redirect("/auth/login");
      }

      user.lastLogin = Date.now();
      await user.save();

      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          role: user.role,
          team: user.team ? user.team.name : null,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      );

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 2 * 60 * 60 * 1000,
      });

      req.session.user = {
        id: user._id,
        username: user.username,
        role: user.role,
        team: user.team ? user.team.name : null,
      };

      if (user.role === "admin") {
        return res.redirect("/admin");
      }

      return res.redirect("/");
    } catch (err) {
      console.error("Login Error:", err);
      return res.redirect("/auth/login");
    }
  }

  // [GET] /auth/logout
  logout(req, res) {
    try {
      res.clearCookie("auth_token");

      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
            return res.status(500).render("error/500", {
              message: "Server error during logout.",
            });
          }

          res.redirect("/auth/login");
        });
      } else {
        res.redirect("/auth/login");
      }
    } catch (err) {
      console.error("Logout Error:", err);
      res.status(500).render("error/500", {
        message: "Server error during logout.",
      });
    }
  }
}

module.exports = new AuthController();
