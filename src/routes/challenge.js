const express = require("express");
const router = express.Router();
const { ChallengeController } = require("../app/controller/index");
const { requireAdmin } = require("../app/middlewares/auth.middleware");
const { requireAuth } = require("../app/middlewares/auth.middleware");

// Public
router.get("/",requireAuth, ChallengeController.getAll);
router.get("/:id",requireAuth, ChallengeController.getById);
router.post("/:id/check",requireAuth, ChallengeController.checkFlag);

// Admin
router.post("/", requireAdmin, ChallengeController.create);
router.put("/:id", requireAdmin, ChallengeController.update);
router.delete("/:id", requireAdmin, ChallengeController.delete);

module.exports = router;
