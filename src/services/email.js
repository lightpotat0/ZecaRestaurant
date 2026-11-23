import nodemailer from "nodemailer";

export async function enviarCodigo(para, codigo) {
    const porta = Number(process.env.SMTP_PORT) || 587;

    const transporte = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: porta,
        secure: porta === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    await transporte.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: para,
        subject: "Seu código de verificação - Zeca Restaurant",
        text: `Seu código de verificação é ${codigo}. Ele expira em 5 minutos.`
    });
}
