const { Submission, User, Team, Challenge } = require("../models/index");

class SubmissionController {
  // [GET] /submissions
  async getAll(req, res) {
    try {
      const submissions = await Submission.find()
        .populate("user", "username email")
        .populate("team", "name")
        .populate("challenge", "title category points")
        .sort({ submittedAt: -1 })
        .lean();

      res.status(200).json({
        message: "Submissions retrieved successfully.",
        total: submissions.length,
        submissions,
      });
    } catch (err) {
      console.error("GetAll Submissions Error:", err);
      res
        .status(500)
        .json({ message: "Server error while retrieving submissions." });
    }
  }

  // [GET] /submissions/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const submission = await Submission.findById(id)
        .populate("user", "username email")
        .populate("team", "name")
        .populate("challenge", "title category points")
        .lean();

      if (!submission) {
        return res.status(404).json({ message: "Submission not found." });
      }

      res.status(200).json({ submission });
    } catch (err) {
      console.error("Get Submission By ID Error:", err);
      res
        .status(500)
        .json({ message: "Server error while retrieving submission." });
    }
  }

  // [DELETE] /submissions/:id
  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Submission.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ message: "Submission not found." });
      }

      res.status(200).json({ message: "Submission deleted successfully." });
    } catch (err) {
      console.error("Delete Submission Error:", err);
      res
        .status(500)
        .json({ message: "Server error while deleting submission." });
    }
  }

  // [POST] /submissions
  async submitFlag(req, res) {
    try {
      const userId = req.user?.id || req.session?.user?.id;
      const { challengeId, flag, ip } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized. Please log in." });
      }

      if (!challengeId || !flag) {
        return res.status(400).json({ message: "Missing required fields." });
      }

      const user = await User.findById(userId).populate("team");
      const challenge = await Challenge.findById(challengeId);

      if (!user || !challenge) {
        return res
          .status(404)
          .json({ message: "User or challenge not found." });
      }

      const isCorrect = challenge.flag === flag;

      await Submission.create({
        user: user._id,
        team: user.team?._id || null,
        challenge: challenge._id,
        flag,
        isCorrect,
        ipAddress: ip || req.ip,
      });

      if (isCorrect) {
        const alreadySolved = user.solved.some(
          (id) => id.toString() === challenge._id.toString(),
        );

        if (!alreadySolved) {
          user.solved.push(challenge._id);
          user.score += challenge.points;
          await user.save();

          if (user.team) {
            const team = await Team.findById(user.team._id);
            if (team) {
              team.score += challenge.points;
              await team.save();
            }
          }
        }
      }

      return res.status(201).json({
        message: isCorrect ? "Correct flag!" : "Wrong flag!",
        isCorrect,
      });
    } catch (err) {
      console.error("Submit Flag Error:", err);
      return res
        .status(500)
        .json({ message: "Server error while submitting flag." });
    }
  }

  // [GET] /submissions/user/:userId
  async getByUser(req, res) {
    try {
      const { userId } = req.params;

      const submissions = await Submission.find({ user: userId })
        .populate("challenge", "title category points")
        .sort({ submittedAt: -1 })
        .lean();

      res.status(200).json({ submissions });
    } catch (err) {
      console.error("Get Submissions By User Error:", err);
      res
        .status(500)
        .json({ message: "Server error while retrieving user's submissions." });
    }
  }

  // [GET] /submissions/team/:teamId
  async getByTeam(req, res) {
    try {
      const { teamId } = req.params;

      const submissions = await Submission.find({ team: teamId })
        .populate("user", "username")
        .populate("challenge", "title category points")
        .sort({ submittedAt: -1 })
        .lean();

      res.status(200).json({ submissions });
    } catch (err) {
      console.error("Get Submissions By Team Error:", err);
      res
        .status(500)
        .json({ message: "Server error while retrieving team submissions." });
    }
  }
}

module.exports = new SubmissionController();
