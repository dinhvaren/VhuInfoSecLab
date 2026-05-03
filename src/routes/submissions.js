const express = require("express");
const router = express.Router();
const { SubmissionController } = require("../app/controller/index");
const { requireAdmin } = require("../app/middlewares/auth.middleware");
const { requireAuth } = require("../app/middlewares/auth.middleware");

// Admin
router.get("/",requireAdmin ,SubmissionController.getAll);
router.get("/:id",requireAdmin ,SubmissionController.getById);
router.delete("/:id",requireAdmin , SubmissionController.delete);

// User
router.post("/",requireAuth, SubmissionController.submitFlag);
router.get("/user/:userId",requireAuth, SubmissionController.getByUser);
router.get("/team/:teamId",requireAuth, SubmissionController.getByTeam);

module.exports = router;
