const { User, Team, Challenge, Submission } = require("../models/index");

class AdminController {
  // [GET] /admin/dashboard
  async dashboard(req, res) {
    try {
      const [userCount, teamCount, challengeCount, submissionCount] =
        await Promise.all([
          User.countDocuments(),
          Team.countDocuments(),
          Challenge.countDocuments(),
          Submission.countDocuments(),
        ]);

      const recentSubmissions = await Submission.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" },
            },
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.render("admin/admin", {
        title: "Admin Dashboard | VHU InfoSec Lab",
        currentPath: req.originalUrl.split("?")[0],
        stats: {
          users: userCount,
          teams: teamCount,
          challenges: challengeCount,
          submissions: submissionCount,
        },
        chartData: JSON.stringify(recentSubmissions),
      });
    } catch (err) {
      console.error("Admin Dashboard Error:", err);
      res.status(500).render("error/500", {
        message: "Server error while loading dashboard.",
      });
    }
  }

  // [GET] /admin/users
  async listUsers(req, res) {
    try {
      const [users, teams] = await Promise.all([
        User.find().populate("team", "name").lean(),
        Team.find().select("_id name").lean(),
      ]);

      res.render("admin/users", {
        title: "Manage Users | VHU InfoSec Lab",
        users,
        teams,
        currentPath: req.originalUrl.split("?")[0],
      });
    } catch (err) {
      console.error("List Users Error:", err);
      res.status(500).render("error/500", { message: "Failed to load users." });
    }
  }

  // [GET] /admin/teams
  async listTeams(req, res) {
    try {
      const teams = await Team.find().populate("members").lean();
      res.render("admin/teams", {
        title: "Manage Teams | VHU InfoSec Lab",
        teams,
        currentPath: req.originalUrl.split("?")[0],
      });
    } catch (err) {
      console.error("List Teams Error:", err);
      res.status(500).render("error/500", { message: "Failed to load teams." });
    }
  }

  // [GET] /admin/challenges
  async listChallenges(req, res) {
    try {
      const challenges = await Challenge.find().lean();
      res.render("admin/challenges", {
        title: "Manage Challenges | VHU InfoSec Lab",
        challenges,
        currentPath: req.originalUrl.split("?")[0],
      });
    } catch (err) {
      console.error("List Challenges Error:", err);
      res
        .status(500)
        .render("error/500", { message: "Failed to load challenges." });
    }
  }

  // [GET] /admin/leaderboard
  async leaderboard(req, res) {
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
            totalFlags: { $sum: 1 },
            lastSubmission: { $max: "$submittedAt" },
          },
        },
        {
          $project: {
            solvedCount: { $size: "$solved" },
            totalFlags: 1,
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
          totalFlags: stat.totalFlags || 0,
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
        leaderboard.slice(0, 10).map(async (team) => {
          const submissions = await Submission.find({
            team: team._id,
          })
            .sort({ submittedAt: 1 })
            .populate("challenge", "points")
            .lean();

          const solvedSet = new Set();
          let currentScore = 0;
          let solvedCount = 0;

          const points = [{ x: 0, y: 0 }];

          for (const submission of submissions) {
            if (!submission.challenge) continue;

            if (submission.isCorrect) {
              const challengeId = submission.challenge._id.toString();

              if (solvedSet.has(challengeId)) continue;

              solvedSet.add(challengeId);
              solvedCount += 1;
              currentScore += Number(submission.challenge.points || 0);
            } else {
              currentScore -= 75;
            }

            points.push({
              x: solvedCount,
              y: currentScore,
            });
          }

          if (points.length > 0) {
            points[points.length - 1].y = Number(team.score || 0);
          }

          return {
            label: team.name,
            color: team.color,
            data: points,
          };
        }),
      );

      res.render("admin/leaderboard", {
        title: "Leaderboard | VHU InfoSec Lab",
        teams: leaderboard,
        chartData: JSON.stringify(chartData),
        currentPath: req.originalUrl.split("?")[0],
      });
    } catch (err) {
      console.error("Leaderboard Error:", err);
      res
        .status(500)
        .render("error/500", { message: "Failed to load leaderboard." });
    }
  }

  // [GET] /admin/submissions
  async listSubmissions(req, res) {
    try {
      const { user, team, result } = req.query;
      const filter = {};
      if (user) filter.user = user;
      if (team) filter.team = team;
      if (result === "correct") filter.isCorrect = true;
      if (result === "wrong") filter.isCorrect = false;

      const submissions = await Submission.find(filter)
        .populate("user", "username")
        .populate("team", "name")
        .populate("challenge", "title category points")
        .sort({ submittedAt: -1 })
        .lean();

      res.render("admin/submissions", {
        title: "Manage Submissions | VHU InfoSec Lab",
        submissions,
        currentPath: req.originalUrl.split("?")[0],
      });
    } catch (err) {
      console.error("List Submissions Error:", err);
      res
        .status(500)
        .render("error/500", { message: "Failed to load submissions." });
    }
  }
}

module.exports = new AdminController();
