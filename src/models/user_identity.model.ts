import { Schema, Document, model } from 'mongoose'
import crypto from 'crypto'
import uniqueValidator from 'mongoose-unique-validator'
import privateValidator from 'mongoose-private'
import { sendEmail } from '../helper/mailer'

export interface IUserIdentity {
    account_type: string
    user_id: string
    two_factor_auth: boolean
    salt: string
    pin: string
}

export interface IUserIdentityToAuthJSON {
    account_type: string;
    user_id: string;
    two_factor_auth: boolean
    salt: string
    pin: string
}

export default interface IUserIdentityModel extends Document, IUserIdentity {
    sendPinResetLink(): void
    setPin(payload: any): void
    validPin(pin: string): boolean
}

const schema = new Schema<IUserIdentityModel>(
    {
        account_type: { type: String, required: true },
        user_id: { type: String, required: true },
        salt: { type: String, default: null },
        two_factor_auth: { type: Boolean, default: true },
        pin: { type: String, required: true, private: true },
    },
    { timestamps: true },
)

// Plugins
schema.plugin(uniqueValidator)
schema.plugin(privateValidator)


schema.methods.setPin = function (pin: string) {
    this.salt = crypto.randomBytes(16).toString('hex')
    this.pin = crypto.pbkdf2Sync(pin, this.salt, 10000, 512, 'sha512').toString('hex')
}

schema.methods.validPin = function (pin: string): boolean {
    const hash = crypto.pbkdf2Sync(pin, this.salt, 10000, 512, 'sha512').toString('hex')
    return this.pin === hash
}

schema.methods.sendPinResetLink = async function (payload: any) {
    const body = `
  <!DOCTYPE html>
  <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css"
        integrity="sha512-5A8nwdMOWrSz20fDsjczgUidUBR8liPYU+WymTZP1lmY9G6Oc7HlZv156XqnsgNUzTyMefFTcsFH/tnJE/+xBg=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
      />
      <title>Password Reset</title>
      <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
      <![endif]-->
      <style>
        body,
        div,
        h1,
        p,
        button,
        a {
          font-family: "Poppins", sans-serif;
        }
        i {
          color: rgba(255, 255, 255, 0.9);
        }
        * {
          padding: 0;
          margin: 0;
        }
        p {
          font-size: 1rem;
        }
        @media (max-width: 500px) {
          p {
            font-size: 0.875rem;
          }
        }
        button:hover,
        a:hover {
          opacity: 0.75;
        }
        .main-container {
          padding: 1.5rem;
          margin: 1.5rem auto 0;
          max-width: 700px;
          width: 100%;
          background-color: white;
        }
        @media (max-width: 900px) {
          .main-container {
            width: 80%;
          }
        }
        @media (max-width: 500px) {
          .main-container {
            padding: 1rem;
          }
        }
        .page-header {
          color: rgba(0, 0, 0, 0.9);
          font-weight: 600;
          font-size: 1.5rem;
        }
        @media (max-width: 500px) {
          .page-header {
            font-size: 1.25rem;
          }
        }
        .page-text {
          color: rgba(0, 0, 0, 0.7);
          font-weight: 400;
        }
        .btn-container {
          margin: 2rem auto;
          max-width: 300px;
          width: 100%;
        }
        @media (max-width: 500px) {
          .btn-container {
            margin: 1.25rem auto;
          }
        }
        .social-container {
          background-color: #5cb23a;
          padding: 1rem 1.5rem;
          margin-top: 1.5rem;
          border-radius: 4px;
        }
        @media (max-width: 500px) {
          .social-container {
            padding: 1rem;
            margin-top: 1.25rem;
          }
        }
        .tax-text {
          text-align: center;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          width: 80%;
          margin: auto;
        }
        @media (max-width: 500px) {
          .tax-text {
            width: 100%;
          }
        }
        .social-flex {
          margin-top: 2rem;
          display: flex;
          gap: 2rem;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 500px) {
          .social-flex {
            margin-top: 1.25rem;
          }
        }
        .social-link {
          font-size: 1.5rem;
        }
        .footer-link {
          font-size: 1rem;
          color: rgba(0, 0, 0, 0.5);
          text-decoration: none;
        }
        @media (max-width: 500px) {
          .footer-link {
            font-size: 0.875rem;
          }
        }
        .mail-text {
          width: 80%;
          margin: 1rem auto;
          text-align: center;
        }
        @media (max-width: 500px) {
          .mail-text {
            width: 100%;
          }
        }
      </style>
    </head>
    <body style="margin: 2rem 0; background-color: #f4f5fb">
      <div style="width: 115px; height: 45px; margin: 0 auto">
        <image src="/assets/taxitpay-logo.png" alt="TaxitPay Logo" style="width: 100%; height: 100%" />
      </div>
      <div class="main-container">
        <div>
          <h1 class="page-header">Pin Reset</h1>
          <hr style="margin: 12px 0; border: none; border-top: 1px solid rgba(0, 0, 0, 0.1)" />
          <p class="page-text">Dear ${payload.name}</p>
          <br />
          
          <p class="page-text">
            You are trying to reset your TaxiTWallet® Account Pin.
          </p>
        </div>
  
        <div style="margin: 1.5rem 0">
          <p style="color: rgba(0, 0, 0, 0.5); font-size: 12px; text-align: center">ONE-TIME PASSWORD</p>
          <p style="color: rgba(0, 0, 0, 0.9); text-align: center; font-weight: 700; font-size: 2rem; letter-spacing: 1rem;">
            ${payload.otp}
          </p>
        </div>
  
        <div>
          <p class="page-text">
            The verification code will expire after <b>30 minutes</b>. Do not share your code with anyone.
          </p>
          <br />
          <p class="page-text">
            Don’t recognize this activity? Please
            <a href="#" style="color: #5cb23a; font-weight: 600">reset your password</a>.
          </p>
          <br />
          <p class="page-text">This is an automated message, please do not reply.</p>
        </div>
  
        <div class="social-container">
          <div style="background-color: rgba(255, 255, 255, 0.16); border-radius: 6px; padding: 12px 0">
            <p class="tax-text">
              Taxtech®... developing efficient & effective technologies for the management of taxes.
            </p>
          </div>
          <div class="social-flex">
            <a href="" class="social-link"><i class="fa fa-facebook-official" aria-hidden="true"></i></a>
            <a href="" class="social-link"><i class="fa fa-twitter" aria-hidden="true"></i></a>
            <a href="" class="social-link"><i class="fa fa-youtube-play" aria-hidden="true"></i></a>
            <a href="" class="social-link"><i class="fa fa-linkedin-square" aria-hidden="true"></i></a>
          </div>
        </div>
  
        <footer style="margin-top: 2rem; color: rgba(0, 0, 0, 0.5)">
          <div style="display: flex; width: fit-content; margin: 0 auto">
            <a href="" class="footer-link">View web version</a>
            <div style="background-color: #c9c9c9; width: 6px; height: 6px; border-radius: 50%; margin: 9px 1rem 0;"></div>
            <a href="" class="footer-link">Unsubscribe</a>
          </div>
          <p style="margin-top: 1rem; text-align: center">
            &copy; 2015 - 2022 Taxaide Technologies Ltd. All rights reserved.
          </p>
          <p class="mail-text">
            If you have any questions or feedback, please feel free to send a mail to
            <a href="mailto:support@taxtech.com.ng" style="color: #5cb23a; font-weight: 600; text-decoration: none">
              support@taxtech.com.ng
            </a>
          </p>
        </footer>
      </div>
    </body>
  </html>
  `
    const data = { from: 'tech@taxtech.com.ng', to: payload.email, subject: 'Password Reset', html: body, email: payload.email }

  await sendEmail(data)
    // return Promise.resolve();
}

export const UserIdentity = model<IUserIdentityModel>('User_Identity', schema)
