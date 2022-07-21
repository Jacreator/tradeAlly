export const ENVIRONMENT = process.env.APP_ENV || 'development'
export const IS_PRODUCTION = ENVIRONMENT === 'production'
export const IS_TEST = ENVIRONMENT === 'test'
export const APP_PORT = Number(process.env.APP_PORT) || 9000
export const APP_PREFIX_PATH = process.env.APP_PREFIX_PATH || '/v1/api'
export const JWT_SECRET = process.env.JWT_SECRET || 'thT9x1TP9y2022Serv1ceis'
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d'
export const DB = {
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_USER_PWD,
  HOST: process.env.DB_HOST,
  NAME: process.env.DB_NAME,
  PORT: Number(process.env.DB_PORT) || 27017,
}
export const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/taxitpay'
export const APP_NAME = 'Bills Payment Service'
export const APP_URL = process.env.APP_URL
export const FRONT_END_URL = process.env.FRONT_END_URL

export const POSTMARK_MAIL_URL = process.env.POSTMARK_MAIL_URL
export const POSTMARK_MAIL_TOKEN = process.env.POSTMARK_MAIL_TOKEN

export const EBULK_URL = process.env.EBULK_URL
export const EBULK_API_KEY = process.env.EBULK_API_KEY
export const EBULK_EMAIL = process.env.EBULK_EMAIL

export const MONNIFY_URL = process.env.MONNIFY_URL
export const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY
export const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY
export const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE
export const MONNIFY_ACCOUNT_NUMBER = process.env.MONNIFY_ACCOUNT_NUMBER
