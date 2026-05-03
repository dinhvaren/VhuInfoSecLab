const { Challenge, Submission } = require("../models/index");

class ChallengeController {
  // [GET] /challenges
  async getAll(req, res) {
    try {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      else filter.status = "Active";

      const userId = req.user?.id || req.session?.user?.id;

      let challenges = await Challenge.find(filter)
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
          solvedMap[submission.challenge.toString()] = submission.flag;
        });

        challenges = challenges.map((challenge) => {
          const submittedFlag = solvedMap[challenge._id.toString()];

          return {
            ...challenge,
            solved: !!submittedFlag,
            submittedFlag: submittedFlag || "",
          };
        });
      }

      res.status(200).json({
        message: "Challenges retrieved successfully.",
        total: challenges.length,
        challenges,
      });
    } catch (err) {
      console.error("GetAll Challenges Error:", err);
      res
        .status(500)
        .json({ message: "Server error while retrieving challenges." });
    }
  }

  // [GET] /challenges/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const challenge = await Challenge.findById(id).select("-flag").lean();

      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found." });
      }

      res.status(200).json({ challenge });
    } catch (err) {
      console.error("Get Challenge By ID Error:", err);
      res
        .status(500)
        .json({ message: "Server error while retrieving challenge." });
    }
  }

  // [POST] /challenges
  async create(req, res) {
    try {
      const {
        title,
        category,
        points,
        difficulty,
        description,
        attachments,
        flag,
        status,
      } = req.body;

      if (!title || !category || !points || !flag) {
        return res.status(400).json({ message: "Missing required fields." });
      }

      const exists = await Challenge.findOne({ title });
      if (exists) {
        return res
          .status(400)
          .json({ message: "Challenge title already exists." });
      }

      const newChallenge = await Challenge.create({
        title,
        category,
        points,
        difficulty: difficulty || "Easy",
        description,
        attachments: attachments || [],
        flag,
        status: status || "Active",
      });

      res.status(201).json({
        message: "Challenge created successfully.",
        challenge: {
          id: newChallenge._id,
          title: newChallenge.title,
          category: newChallenge.category,
          points: newChallenge.points,
          status: newChallenge.status,
        },
      });
    } catch (err) {
      console.error("Create Challenge Error:", err);
      res
        .status(500)
        .json({ message: "Server error while creating challenge." });
    }
  }

  // [PUT] /challenges/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        category,
        points,
        difficulty,
        description,
        attachments,
        flag,
        status,
      } = req.body;

      const challenge = await Challenge.findById(id);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found." });
      }

      if (title) challenge.title = title;
      if (category) challenge.category = category;
      if (points) challenge.points = points;
      if (difficulty) challenge.difficulty = difficulty;
      if (description) challenge.description = description;
      if (attachments) challenge.attachments = attachments;
      if (flag) challenge.flag = flag;
      if (status) challenge.status = status;

      await challenge.save();

      res.status(200).json({
        message: "Challenge updated successfully.",
        challenge: {
          id: challenge._id,
          title: challenge.title,
          category: challenge.category,
          points: challenge.points,
          status: challenge.status,
        },
      });
    } catch (err) {
      console.error("Update Challenge Error:", err);
      res
        .status(500)
        .json({ message: "Server error while updating challenge." });
    }
  }

  // [DELETE] /challenges/:id
  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Challenge.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ message: "Challenge not found." });
      }

      res.status(200).json({ message: "Challenge deleted successfully." });
    } catch (err) {
      console.error("Delete Challenge Error:", err);
      res
        .status(500)
        .json({ message: "Server error while deleting challenge." });
    }
  }

  // [POST] /challenges/:id/check
  async checkFlag(req, res) {
    try {
      const { id } = req.params;
      const { flag } = req.body;

      const challenge = await Challenge.findById(id);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found." });
      }

      const isCorrect = challenge.flag === flag;
      res.status(200).json({
        message: isCorrect ? "✅ Correct flag!" : "❌ Wrong flag!",
        isCorrect,
      });
    } catch (err) {
      console.error("Check Flag Error:", err);
      res.status(500).json({ message: "Server error while checking flag." });
    }
  }
}

module.exports = new ChallengeController();
