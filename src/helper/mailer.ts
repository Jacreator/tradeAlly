import axios from 'axios'
import { POSTMARK_MAIL_URL, POSTMARK_MAIL_TOKEN } from '../config';

const headers = [
  {
    "Name": "X-Postmark-Server-Token",
    "Value": `${POSTMARK_MAIL_TOKEN}`
  }
]

export const sendEmail = async (payload: any) => {
  const url = POSTMARK_MAIL_URL

  const options = {
    email: payload.to,
    From: payload.from,
    To: payload.to,
    Cc: payload.cc ? payload.cc : null,
    Bcc: payload.bcc ? payload.bcc : null,
    Subject: payload.subject,
    Tag: payload.tag ? payload.tag : null,
    HtmlBody: payload.html ? payload.html : null,
    TextBody: payload.text ? payload.text : null,
    ReplyTo: "noreply@taxtech.com.ng",
    TrackOpens: true,
    TrackLinks: "HtmlOnly",
    MessageStream: "outbound"
  }

  const sentMail = await axios.post(`${url}/email`, options, {
    headers: {
      "X-Postmark-Server-Token": `${POSTMARK_MAIL_TOKEN}`
    }
  })
    .then((body) => { return { res: body } })
    .catch((err) => { return { res: err } })

  return sentMail
}

export const sendEmailWithAttachment = async (payload: any) => {
  const url = POSTMARK_MAIL_URL

  const options = {
    email: payload.to,
    From: payload.from,
    To: payload.to,
    Cc: payload.cc ? payload.cc : null,
    Bcc: payload.bcc ? payload.bcc : null,
    Subject: payload.subject,
    Tag: payload.tag ? payload.tag : null,
    HtmlBody: payload.html ? payload.html : null,
    TextBody: payload.text ? payload.text : null,
    ReplyTo: "noreply@taxtech.com.ng",
    TrackOpens: true,
    TrackLinks: "HtmlOnly",
    MessageStream: "outbound",
    Attachments:[{ 'ContentType': 'application/pdf', 'Name': `${payload.attach.slipName}`, 'Content': payload.attach.encrypt_data }]
  }

  const sentMail = await axios.post(`${url}/email`, options, { headers: { "X-Postmark-Server-Token": `${POSTMARK_MAIL_TOKEN}` } })
    .then((body) => { return { res: body } })
    .catch((err) => { return { res: err } })

  return sentMail
}

export const sendBatchEmail = async (batchEmail: any) => {
  const url = POSTMARK_MAIL_URL
  const options: any[] = []

  for (const email of batchEmail) {
    console.log(email)
    options.push({
      email: email.to,
      From: email.from,
      To: email.to,
      Cc: email.cc ? email.cc : null,
      Bcc: email.bcc ? email.bcc : null,
      Subject: email.subject,
      Tag: email.tag ? email.tag : null,
      HtmlBody: email.html ? email.html : null,
      TextBody: email.text ? email.text : null,
      ReplyTo: "noreply@taxtech.com.ng",
      TrackOpens: true,
      TrackLinks: "HtmlOnly",
      MessageStream: "outbound"
    })
  }

  const sentMail = await axios.post(`${url}/email/batch`, options, {
    headers: {
      "X-Postmark-Server-Token": `${POSTMARK_MAIL_TOKEN}`
    }
  })
    .then((body) => { return { res: body } })
    .catch((err) => { return { res: err } })

  return sentMail
}

// export { sendEmail, sendBatchEmail }

  // Headers: headers,