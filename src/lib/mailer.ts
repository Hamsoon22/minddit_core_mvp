import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendSessionInvite({
  to,
  name,
  sessionTitle,
  joinUrl,
}: {
  to: string;
  name: string;
  sessionTitle: string;
  joinUrl: string;
}) {
  await transporter.sendMail({
    from: `"Mindflow" <${process.env.SMTP_USER}>`,
    to,
    subject: `[Mindflow] "${sessionTitle}" 세션에 초대되었습니다`,
    html: `
      <p>${name}님, 안녕하세요.</p>
      <p><strong>${sessionTitle}</strong> 세션에 초대되었습니다.</p>
      <p><a href="${joinUrl}">여기를 클릭해 참여하세요</a></p>
    `,
  });
}
