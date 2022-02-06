import mongoose from "mongoose";
import env from "./config.js";
const { MONGO_URI } = env;
const connect = () => {
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connect my mongo-server success");
    })
    .catch((error) => {
        console.log(error);
      console.log("fail");
      process.exit(1);
    });
};
export default connect;