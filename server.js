import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Pusher from "pusher";
import DBModel from "./dbModel.js";

// app config
const app = express();
const port = process.env.PORT || 8080;

const pusher = new Pusher({
  appId: "1326605",
  key: "8e95e9d60f4bbc0e606a",
  secret: "8194f2a7b745c67a9c0b",
  cluster: "mt1",
  useTLS: true,
});

// middlewares
app.use(express.json());
app.use(cors());

// DB config
const connection_url =
  "mongodb+srv://mern_instagram:RsChPjFB6yik3AZt@cluster0.qyjwj.mongodb.net/instaDB?retryWrites=true&w=majority";

mongoose.connect(connection_url, {});

mongoose.connection.once("open", () => {
  console.log("Database Connected!!!");

  const changeStream = mongoose.connection.collection("posts").watch();

  changeStream.on("change", (change) => {
    console.log("Change Triggered on Pusher...");
    console.log(change);
    console.log("End of Change");

    if (change.operationType === "insert") {
      console.log("Triggering Pusher ***IMG UPLOAD***");

      const postDetails = change.fullDocument;
      pusher.trigger("posts", "inserted", {
        user: postDetails.user,
        caption: postDetails.caption,
        image: postDetails.image,
      });
    } else {
      console.log("Unknown trigger from pusher");
    }
  });
});

// api routes
app.get("/", (req, res) => {
  res.status(200).send("Hello world");
});

app.post("/upload", (req, res) => {
  const body = req.body;

  DBModel.create(body, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/sync", (req, res) => {
  DBModel.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

// Listen
app.listen(port, () => console.log(`listening on localhost: ${port}`));
