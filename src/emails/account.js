const sgMail = require('@sendgrid/mail');

const senderEmail = 'rajarshiray2016@gmail.com'

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = ({name, email})=>{
    const msg = {
        to: email,
        from: senderEmail,
        subject: 'Thank you for joining Task Manager API',
        text: `Hi ${name},\nWelcome to Task Manager API. You have been registered successfully. Let us know how you get along with the API.\n\nThanks and Regards,\nTask Manager API Team`
    };
    sgMail.send(msg);
}

const sendCancelationEmail = ({name, email})=>{
    const msg = {
        to: email,
        from: senderEmail,
        subject: 'Account Canceled for Task Manager API',
        text: `Hi ${name},\nYour account has been successfully canceled from Task Manager API. We are waiting to hear from you the reason behind the account cancelation.\n\nThanks and Regards,\nTask Manager API Team`
    };
    sgMail.send(msg);
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}