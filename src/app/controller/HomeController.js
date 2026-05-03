const { Challenge, Team, User, Submission } = require("../models/index");
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
      const getTeamColor = (index) => {
        const hue = (index * 137.508) % 360;
        return `hsl(${hue}, 100%, 55%)`;
      };

      const teams = await Team.find()
        .sort({ score: -1 })
        .populate("members", "username")
        .lean();

      const teamIds = teams.map((team) => team._id);

      const solvedStats = await Submission.aggregate([
        {
          $match: {
            team: { $in: teamIds },
            isCorrect: true,
          },
        },
        {
          $group: {
            _id: "$team",
            solved: { $addToSet: "$challenge" },
            lastSubmission: { $max: "$submittedAt" },
          },
        },
        {
          $project: {
            solvedCount: { $size: "$solved" },
            lastSubmission: 1,
          },
        },
      ]);

      const statMap = {};
      solvedStats.forEach((item) => {
        statMap[item._id.toString()] = item;
      });

      const leaderboard = teams.map((team) => {
        const stat = statMap[team._id.toString()] || {};

        return {
          ...team,
          score: Number(team.score || 0),
          solvedCount: stat.solvedCount || 0,
          memberCount: team.members?.length || 0,
          lastSubmission: stat.lastSubmission || null,
        };
      });

      leaderboard.sort((a, b) => {
        if ((b.score || 0) !== (a.score || 0)) {
          return (b.score || 0) - (a.score || 0);
        }

        const aTime = a.lastSubmission
          ? new Date(a.lastSubmission).getTime()
          : Infinity;
        const bTime = b.lastSubmission
          ? new Date(b.lastSubmission).getTime()
          : Infinity;

        return aTime - bTime;
      });

      leaderboard.forEach((team, index) => {
        team.rank = index + 1;
        team.color = getTeamColor(index);
      });

      const chartData = await Promise.all(
        leaderboard.map(async (team) => {
          const submissions = await Submission.find({
            team: team._id,
            isCorrect: true,
          })
            .sort({ submittedAt: 1 })
            .populate("challenge", "points")
            .lean();

          const solvedSet = new Set();
          let totalScore = 0;
          const points = [{ x: 0, y: 0 }];

          for (const submission of submissions) {
            if (!submission.challenge) continue;

            const challengeId = submission.challenge._id.toString();
            if (solvedSet.has(challengeId)) continue;

            solvedSet.add(challengeId);
            totalScore += Number(submission.challenge.points || 0);

            points.push({
              x: solvedSet.size,
              y: totalScore,
            });
          }

          return {
            label: team.name,
            color: team.color,
            data: points,
          };
        }),
      );

      res.render("pages/hackerboard", {
        title: "Hackerboard | VHU InfoSec Lab",
        message: "All teams in the VHU CTF Platform.",
        teams: leaderboard,
        chartData: JSON.stringify(chartData),
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
      const userId = req.user?.id || req.session?.user?.id;

      let challenges = await Challenge.find({ status: "Active" })
        .select("-flag")
        .sort({ points: 1 })
        .lean();

      if (userId) {
        const solvedSubmissions = await Submission.find({
          user: userId,
          isCorrect: true,
        })
          .select("challenge flag")
          .lean();

        const solvedMap = {};

        solvedSubmissions.forEach((submission) => {
          if (submission.challenge) {
            solvedMap[submission.challenge.toString()] = submission.flag;
          }
        });

        challenges = challenges.map((challenge) => {
          const submittedFlag = solvedMap[challenge._id.toString()];

          return {
            ...challenge,
            solved: Boolean(submittedFlag),
            submittedFlag: submittedFlag || "",
          };
        });
      } else {
        challenges = challenges.map((challenge) => ({
          ...challenge,
          solved: false,
          submittedFlag: "",
        }));
      }

      res.render("pages/challenges-user", {
        title: "Challenges | VHU InfoSec Lab",
        message: "Select a challenge and start hacking!",
        challenges,
        currentPath: req.originalUrl.split("?")[0],
        user: req.user || req.session?.user,
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
      const userId = req.user?.id || req.session?.user?.id;

      if (!userId) {
        return res.redirect("/auth/login");
      }

      const user = await User.findById(userId)
        .populate("team", "name score")
        .populate("solved", "title category points")
        .select("-password")
        .lean();

      if (!user) {
        return res.redirect("/auth/login");
      }

      const submissions = await Submission.find({ user: userId })
        .populate("challenge", "title category points")
        .sort({ submittedAt: -1 })
        .limit(10)
        .lean();

      const rankList = await User.find({ status: "active" })
        .sort({ score: -1 })
        .select("_id score")
        .lean();

      const rankIndex = rankList.findIndex(
        (item) => item._id.toString() === userId.toString(),
      );

      res.render("pages/profile", {
        title: "Profile | VHU InfoSec Lab",
        profileUser: user,
        submissions,
        rank: rankIndex >= 0 ? rankIndex + 1 : "N/A",
        currentPath: req.originalUrl.split("?")[0],
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
