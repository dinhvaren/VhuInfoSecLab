const express = require("express");
const router = express.Router();
const { UserController } = require("../app/controller/index");
const { requireAdmin } = require("../app/middlewares/auth.middleware");
const { requireAuth } = require("../app/middlewares/auth.middleware");

// Admin routes
router.get("/",requireAdmin, UserController.getAllUsers);
router.get("/:id",requireAdmin, UserController.getUserById);
router.put("/:id",requireAdmin, UserController.updateUser);
router.delete("/:id",requireAdmin, UserController.deleteUser);
// User route
router.get("/profile/me",requireAuth, UserController.getProfile);

module.exports = router;
