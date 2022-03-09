import nodeMailer from 'nodemailer';

const adminEmail = 'tojiro206@gmail.com'
const adminPassword = 'eoltmqejlpvbegij'
const mailHost = 'smtp.gmail.com'
const mailPort = 587

const sendMail = (email, subject, view) => {
  const transporter = nodeMailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: false, 
    auth: {
      user: adminEmail,
      pass: adminPassword
    }
  })

  const options = {
    from: adminEmail,
    to: email, 
    subject: subject,
    html: view   
  }
  return transporter.sendMail(options)
}

export default sendMail;