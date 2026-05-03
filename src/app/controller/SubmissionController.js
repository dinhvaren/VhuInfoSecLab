const { Submission, User, Team, Challenge } = require("../models/index");

async function recalcUserScore(user) {
  const challenges = await Challenge.find({
    _id: { $in: user.solved || [] },
  })
    .select("points")
    .lean();

  const totalScore = challenges.reduce((sum, challenge) => {
    return sum + Number(challenge.points || 0);
  }, 0);

  user.score = totalScore;
  await user.save();

  return totalScore;
}

async function recalcTeamScore(teamId) {
  if (!teamId) return 0;

  const members = await User.find({ team: teamId }).select("solved").lean();

  const solvedSet = new Set();

  members.forEach((member) => {
    (member.solved || []).forEach((challengeId) => {
      solvedSet.add(challengeId.toString());
    });
  });

  const challenges = await Challenge.find({
    _id: { $in: Array.from(solvedSet) },
  })
    .select("points")
    .lean();

  const totalScore = challenges.reduce((sum, challenge) => {
    return sum + Number(challenge.points || 0);
  }, 0);

  await Team.findByIdAndUpdate(teamId, {
    $set: { score: totalScore },
  });

  return totalScore;
}

class SubmissionController {
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

  async delete(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Submission.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ message: "Submission not found." });
      }

      if (deleted.team) {
        await recalcTeamScore(deleted.team);
      }

      res.status(200).json({ message: "Submission deleted successfully." });
    } catch (err) {
      console.error("Delete Submission Error:", err);
      res
        .status(500)
        .json({ message: "Server error while deleting submission." });
    }
  }

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

      const user = await User.findById(userId);
      const challenge = await Challenge.findById(challengeId);

      if (!user || !challenge) {
        return res
          .status(404)
          .json({ message: "User or challenge not found." });
      }

      const teamId = user.team || null;

      const solvedSubmission = await Submission.findOne({
        user: user._id,
        challenge: challenge._id,
        isCorrect: true,
      }).lean();

      if (solvedSubmission) {
        return res.status(200).json({
          message: "Challenge already solved.",
          isCorrect: true,
          alreadySolved: true,
          submittedFlag: solvedSubmission.flag,
        });
      }

      const isCorrect = challenge.flag === flag;

      await Submission.create({
        user: user._id,
        team: teamId,
        challenge: challenge._id,
        flag,
        isCorrect,
        ipAddress: ip || req.ip,
      });

      if (!isCorrect) {
        return res.status(201).json({
          message: "Wrong flag!",
          isCorrect: false,
          alreadySolved: false,
        });
      }

      user.solved = user.solved || [];

      const alreadyInSolved = user.solved.some(
        (id) => id.toString() === challenge._id.toString(),
      );

      if (!alreadyInSolved) {
        user.solved.push(challenge._id);
      }

      const userScore = await recalcUserScore(user);

      let teamScore = 0;

      if (teamId) {
        await Team.findByIdAndUpdate(teamId, {
          $addToSet: { members: user._id },
        });

        await Submission.updateMany(
          {
            user: user._id,
            isCorrect: true,
            team: null,
          },
          {
            $set: { team: teamId },
          },
        );

        teamScore = await recalcTeamScore(teamId);
      }

      return res.status(201).json({
        message: "Correct flag!",
        isCorrect: true,
        alreadySolved: false,
        submittedFlag: flag,
        points: Number(challenge.points || 0),
        userScore,
        teamScore,
      });
    } catch (err) {
      console.error("Submit Flag Error:", err);
      return res
        .status(500)
        .json({ message: "Server error while submitting flag." });
    }
  }

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
