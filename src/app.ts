import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import httpStatus from "http-status";
import mongoSanitize from 'express-mongo-sanitize';

// from own files
import { IS_TEST, APP_NAME, APP_PREFIX_PATH } from "./config";
import ApiError from "./helper/ApiError";
import { errorConverter, errorHandler } from "./helper/errorConverter";
import { morganSuccessHandler, morganErrorHandler } from "./helper/morgan";
import routes from "./routes";

const app = express();

if (!IS_TEST) {
  app.use(morganSuccessHandler);
  app.use(morganErrorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
// app.use(xss())
app.use(mongoSanitize());

// gzip compression
app.use(compression());

app.use(cors());

app.get('/', (_req, res) => {
  res.status(httpStatus.OK).send({
    service: `${APP_NAME}`,
    message: `Welcome to the ${APP_NAME}. happens here!`,
    config: APP_PREFIX_PATH
  });
});


app.use(APP_PREFIX_PATH, routes);

// send back a 404 error for any unknown api request
app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'))
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app
