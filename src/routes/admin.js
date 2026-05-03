const express = require("express");
const router = express.Router();
const { AdminController } = require("../app/controller/index");
const { requireAdmin } = require("../app/middlewares/auth.middleware");

router.use(requireAdmin);

router.get("/", AdminController.dashboard);
router.get("/users", AdminController.listUsers);
router.get("/teams", AdminController.listTeams);
router.get("/challenges", AdminController.listChallenges);
router.get("/leaderboard", AdminController.leaderboard);
router.get("/submissions", AdminController.listSubmissions);

module.exports = router;