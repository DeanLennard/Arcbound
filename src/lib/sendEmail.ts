import nodemailer from 'nodemailer';

export default async function sendEmail(to: string, subject: string, html: string) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false, // use TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false // 🛑 DEV ONLY — disables cert checking
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
    });
}
