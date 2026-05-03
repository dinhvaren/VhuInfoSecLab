require("dotenv").config();
const nodemailer = require("nodemailer");

async function main() {
  const transporter = nodemailer.createTransport({
    host: "smtp.tino.vn",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "admin@vhuinfosec.io.vn",
      pass: "$g5?hX-+#sgW",
    },
  });

  await transporter.verify();

  await transporter.sendMail({
    from: `"VHU InfoSec Lab" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER,
    subject: "Test SMTP",
    text: "SMTP OK",
  });

  console.log("Mail sent OK");
}

main().catch(console.error);
