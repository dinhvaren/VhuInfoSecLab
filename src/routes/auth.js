const express = require("express");
const router = express.Router();
const { AuthController } = require("../app/controller/index");
const { requireAuth } = require("../app/middlewares/auth.middleware");

router.get("/login", AuthController.showLogin);
router.get("/register", AuthController.showRegister);

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);

router.get("/join-team", requireAuth, AuthController.showJoinTeam);
router.post("/join-team", requireAuth, AuthController.joinTeam);

router.get("/create-team", requireAuth, AuthController.showCreateTeam);
router.post("/create-team", requireAuth, AuthController.createTeam);

router.get("/logout", requireAuth, AuthController.logout);

router.get("/forgot-password", AuthController.showForgotPassword);
router.post("/forgot-password", AuthController.forgotPassword);

router.get("/reset-password", AuthController.showResetPassword);
router.post("/reset-password", AuthController.resetPassword);

module.exports = router;