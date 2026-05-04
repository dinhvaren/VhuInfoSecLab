const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema({
  title:       { type: String, required: true, unique: true },
  category:    { type: String, enum: ["Web", "Crypto", "Forensics", "Pwn", "Reverse", "Misc", "OSINT"], required: true },
  points:      { type: Number, required: true },
  difficulty:  { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
  description: { type: String, required: true },
  attachments: [{ type: String }],
  flag:        { type: String, required: true }, 
  status:      { type: String, enum: ["Active", "Draft"], default: "Active" },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model("Challenge", challengeSchema);
