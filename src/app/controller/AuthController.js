const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { User, Team } = require("../models/index");
const crypto = require("crypto");
require("dotenv").config();

const sendResetPasswordEmail = async (toEmail, resetLink) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.verify();
  await transporter.sendMail({
    from: `"VHU InfoSec Lab" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Reset Your Password - VHU CTF",
    html: `
    <div style="font-family: Arial, sans-serif;">
      <h2>Reset Your Password</h2>
      <p>You recently requested to reset your password.</p>
      <p>This link will expire in 15 minutes.</p>
      <a href="${resetLink}" 
         style="display:inline-block;padding:10px 16px;background:#dc3545;color:#fff;text-decoration:none;border-radius:4px;">
        Reset Password
      </a>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `,
  });
};

class AuthController {
  // [GET] /auth/login
  showLogin(req, res) {
    try {
      return res.render("auth/login", {
        title: "Login | CTF Platform",
      });
    } catch (err) {
      console.error("ShowLogin Error:", err);
      return res.status(500).render("error/500", {
        message: "Server error while rendering login page.",
      });
    }
  }

  // [GET] /auth/register
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

  // [POST] /auth/register
  async register(req, res) {
    try {
      const { teamName, username, email, password, confirm_password } =
        req.body;

      const renderRegister = (message) => {
        return res.status(400).render("auth/register", {
          title: "Register | CTF Platform",
          message,
        });
      };

      if (!username || !email || !password || !confirm_password) {
        return renderRegister("Please fill in all required fields.");
      }

      if (password !== confirm_password) {
        return renderRegister("Passwords do not match.");
      }

      if (password.length < 6) {
        return renderRegister("Password must be at least 6 characters long.");
      }

      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        return renderRegister("Username or email already taken.");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let team = null;
      let generatedTeamId = null;

      if (teamName && teamName.trim() !== "") {
        const cleanTeamName = teamName.trim();

        const existingTeam = await Team.findOne({ name: cleanTeamName });

        if (existingTeam) {
          return renderRegister(
            "Team name already exists. Leave Team Name empty and use Join Team after login.",
          );
        }

        generatedTeamId = crypto.randomBytes(4).toString("hex").toUpperCase();

        team = await Team.create({
          name: cleanTeamName,
          teamId: generatedTeamId,
          members: [],
        });
      }

      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role: "user",
        status: "active",
        team: team ? team._id : undefined,
      });

      if (team) {
        team.members.push(newUser._id);
        await team.save();
      }

      let message = "Registration successful. You can now login.";

      if (team) {
        message = `Registration successful. Your team code is ${generatedTeamId}. You can now login.`;
      }

      return res.render("auth/register", {
        title: "Register | CTF Platform",
        message,
      });
    } catch (err) {
      console.error("Register Error:", err);

      return res.status(500).render("auth/register", {
        title: "Register | CTF Platform",
        message: "Server error. Please try again later.",
      });
    }
  }

  // [POST] /auth/login
  async login(req, res) {
    try {
      const { username, password } = req.body;

      const renderLoginError = (message) => {
        return res.status(400).render("auth/login", {
          title: "Login | CTF Platform",
          message,
        });
      };

      if (!username || !password) {
        return renderLoginError("Please enter username and password.");
      }

      const user = await User.findOne({ username }).populate("team");

      if (!user) {
        return renderLoginError("Invalid username or password.");
      }

      if (user.status === "banned") {
        return renderLoginError("This account has been suspended.");
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return renderLoginError("Invalid username or password.");
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

      return res.status(500).render("auth/login", {
        title: "Login | CTF Platform",
        message: "Server error while logging in.",
      });
    }
  }

  // [GET] /auth/forgot-password
  showForgotPassword(req, res) {
    try {
      res.render("auth/forgot-password", {
        title: "Forgot Password | CTF Platform",
      });
    } catch (err) {
      console.error("ShowForgotPassword Error:", err);
      res.status(500).render("error/500", {
        message: "Server error while rendering forgot password page.",
      });
    }
  }

  // [POST] /auth/forgot-password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.render("auth/forgot-password", {
          title: "Forgot Password | CTF Platform",
          message: "Please enter your email address.",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.render("auth/forgot-password", {
          title: "Forgot Password | CTF Platform",
          message: "Email does not exist.",
        });
      }

      if (user.status === "banned") {
        return res.render("auth/forgot-password", {
          title: "Forgot Password | CTF Platform",
          message: "This account has been suspended.",
        });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      const baseUrl =
        process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

      const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

      await sendResetPasswordEmail(user.email, resetLink);

      return res.render("auth/forgot-password", {
        title: "Forgot Password | CTF Platform",
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (err) {
      console.error("ForgotPassword Error:", err);
      res.status(500).render("error/500", {
        message: "Server error while processing forgot password.",
      });
    }
  }

  // [GET] /auth/reset-password
  showResetPassword(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.redirect("/auth/login");
      }

      jwt.verify(token, process.env.JWT_SECRET);

      return res.render("auth/reset-password", {
        title: "Reset Password | CTF Platform",
        token,
      });
    } catch (err) {
      console.error("ShowResetPassword Error:", err);
      return res.status(400).send("Invalid or expired token");
    }
  }

  // [POST] /auth/reset-password
  async resetPassword(req, res) {
    try {
      const { token, password, confirmPassword } = req.body;

      if (!token || !password) {
        return res.status(400).send("Missing required data.");
      }

      if (confirmPassword && password !== confirmPassword) {
        return res.render("auth/reset-password", {
          title: "Reset Password | CTF Platform",
          token,
          message: "Passwords do not match.",
        });
      }

      if (password.length < 6) {
        return res.render("auth/reset-password", {
          title: "Reset Password | CTF Platform",
          token,
          message: "Password must be at least 6 characters long.",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.findByIdAndUpdate(decoded.id, {
        password: hashedPassword,
      });

      return res.redirect("/auth/login");
    } catch (err) {
      console.error("ResetPassword Error:", err);
      return res.status(400).send("This reset link is invalid or has expired.");
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

  // [GET] /auth/join-team
  showJoinTeam(req, res) {
    try {
      return res.render("auth/join-team", {
        title: "Join Team | CTF Platform",
        currentPath: req.originalUrl.split("?")[0],
      });
    } catch (err) {
      console.error("ShowJoinTeam Error:", err);
      return res.status(500).render("error/500", {
        message: "Server error while rendering join team page.",
      });
    }
  }

  // [POST] /auth/join-team
  async joinTeam(req, res) {
    try {
      const { teamId } = req.body;
      const userId = req.session.user?.id;

      const renderError = (message) => {
        return res.status(400).render("auth/join-team", {
          title: "Join Team | CTF Platform",
          message,
        });
      };

      if (!teamId) {
        return renderError("Please enter team code.");
      }

      const normalizedTeamId = teamId.trim().toUpperCase();

      const team = await Team.findOne({ teamId: normalizedTeamId });

      if (!team) {
        return renderError("Invalid team code.");
      }

      const user = await User.findById(userId);

      if (!user) {
        return renderError("User not found.");
      }

      if (user.team) {
        return renderError("You already have a team.");
      }

      const isMember = team.members.some(
        (m) => m.toString() === user._id.toString(),
      );

      if (!isMember) {
        team.members.push(user._id);
        await team.save();
      }

      user.team = team._id;
      await user.save();

      return res.redirect("/");
    } catch (err) {
      console.error("JoinTeam Error:", err);

      return res.status(500).render("auth/join-team", {
        title: "Join Team | CTF Platform",
        message: "Server error. Please try again later.",
      });
    }
  }

  // [GET] /auth/create-team
  showCreateTeam(req, res) {
    try {
      return res.render("auth/create-team", {
        title: "Create Team | CTF Platform",
        currentPath: req.originalUrl.split("?")[0],
      });
    } catch (err) {
      console.error("ShowCreateTeam Error:", err);
      return res.status(500).render("error/500", {
        message: "Server error while rendering create team page.",
      });
    }
  }

  // [POST] /auth/create-team
  async createTeam(req, res) {
    try {
      const { teamName } = req.body;
      const userId = req.session.user?.id;

      const renderError = (message) => {
        return res.status(400).render("auth/create-team", {
          title: "Create Team | CTF Platform",
          currentPath: req.path,
          message,
        });
      };

      if (!teamName || teamName.trim() === "") {
        return renderError("Please enter team name.");
      }

      const user = await User.findById(userId);

      if (!user) {
        return renderError("User not found.");
      }

      if (user.team) {
        return renderError("You already have a team.");
      }

      const cleanTeamName = teamName.trim();

      const existingTeam = await Team.findOne({ name: cleanTeamName });

      if (existingTeam) {
        return renderError("Team name already exists.");
      }

      const teamId = crypto.randomBytes(4).toString("hex").toUpperCase();

      const team = await Team.create({
        name: cleanTeamName,
        teamId,
        members: [user._id],
      });

      user.team = team._id;
      await user.save();

      req.session.user.team = team.name;

      return res.render("auth/create-team", {
        title: "Create Team | CTF Platform",
        currentPath: req.path,
        message: `Team created successfully. Your team code is ${teamId}.`,
      });
    } catch (err) {
      console.error("CreateTeam Error:", err);

      return res.status(500).render("auth/create-team", {
        title: "Create Team | CTF Platform",
        currentPath: req.path,
        message: "Server error. Please try again later.",
      });
    }
  }
}

module.exports = new AuthController();
