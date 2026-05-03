const express = require("express");
const router = express.Router();
const { TeamController } = require("../app/controller/index");
const { requireAdmin } = require("../app/middlewares/auth.middleware");

router.get("/",requireAdmin,TeamController.getAllTeams);
router.get("/leaderboard",requireAdmin, TeamController.getLeaderboard);
router.get("/:id",requireAdmin, TeamController.getTeamById);
router.post("/",requireAdmin, TeamController.createTeam);
router.put("/:id",requireAdmin, TeamController.updateTeam);
router.delete("/:id",requireAdmin, TeamController.deleteTeam);
router.patch("/:id/add-member",requireAdmin, TeamController.addMember);
router.patch("/:id/remove-member",requireAdmin, TeamController.removeMember);

module.exports = router;
