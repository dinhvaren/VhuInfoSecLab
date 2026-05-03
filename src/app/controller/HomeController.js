const { Challenge, Team, User } = require("../models/index");
class HomeController {
  // [GET] /
  async index(req, res, next) {
    try {
      res.render("pages/index", {
        title: "VHU InfoSec Lab | Home",
        currentPath: req.path,
        message: "Welcome to VHU CTF Platform",
      });
    } catch (err) {
      console.error("Home Index Error:", err);
      res.status(500).render("error/500", {
        page: { title: "Server Error" },
        message: "Something went wrong while loading homepage.",
      });
    }
  }

  // [GET] /about
  about(req, res) {
    try {
      res.render("pages/about", {
        title: "About | VHU InfoSec Lab",
        currentPath: req.path,
        description:
          "VHU InfoSec Lab là môi trường học tập & CTF Platform dành cho sinh viên ngành An toàn thông tin tại Đại học Văn Hiến.",
      });
    } catch (err) {
      console.error("Home About Error:", err);
      res.status(500).render("error/500", {
        page: { title: "Server Error" },
        message: "Server error while rendering about page.",
      });
    }
  }

  // [GET] /hackerboard
  async hackerboard(req, res) {
    try {
      const teams = await Team.find()
        .sort({ score: -1 })
        .limit(10)
        .populate("members");

      res.render("pages/hackerboard", {
        title: "Hackerboard | VHU InfoSec Lab",
        message: "Top 10 teams in the VHU CTF Platform.",
        teams,
        currentPath: req.path,
      });
    } catch (err) {
      console.error("Hackerboard Error:", err);
      res.status(500).render("error/500", {
        page: { title: "Server Error" },
        message: "Server error while loading hackerboard.",
      });
    }
  }

  // [GET] /challenges
  async challenges(req, res) {
    try {
      const challenges = await Challenge.find({ status: "Active" })
        .select("-flag")
        .sort({ points: 1 })
        .lean();

      res.render("pages/challenges-user", {
        title: "Challenges | VHU InfoSec Lab",
        message: "Select a challenge and start hacking!",
        challenges,
        currentPath: req.originalUrl.split("?")[0],
      });
    } catch (err) {
      console.error("Challenges Error:", err);
      res.status(500).render("error/500", {
        page: { title: "Server Error" },
        message: "Server error while loading challenges.",
      });
    }
  }
  // [GET] /feedback
  feedback(req, res) {
    try {
      res.render("pages/feedback", {
        title: "Feedback | VHU InfoSec Lab",
        message: "Your feedback helps us improve the CTF experience.",
        currentPath: req.path,
      });
    } catch (err) {
      console.error("Feedback Error:", err);
      res.status(500).render("error/500", {
        page: { title: "Server Error" },
        message: "Server error while loading feedback page.",
      });
    }
  }

  //  [GET] /profile
  async profile(req, res) {
    try {
      // const userId = req.user?._id;
      // if (!userId) {
      //   return res.redirect("/auth/login");
      // }

      // const user = await User.findById(userId)
      //   .populate("team", "name score")
      //   .select("-password");

      // const submissions = await Submission.find({ user: userId })
      //   .populate("challenge", "title category")
      //   .sort({ createdAt: -1 })
      //   .limit(10);

      res.render("pages/profile", {
        title: "Profile | VHU InfoSec Lab",
        // user,
        // submissions,
        currentPath: req.path,
      });
    } catch (err) {
      console.error("Profile Render Error:", err);
      res.status(500).render("error/500", {
        page: { title: "Server Error" },
        message: "Server error while rendering profile page.",
      });
    }
  }
}

module.exports = new HomeController();
