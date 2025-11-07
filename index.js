const express = require("express");
const cors = require("cors");
require("dotenv").config();

const admin = require("firebase-admin");
const serviceAccount = require("./dragonball-authentication.json");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// middleware

app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.MODEL_USER}:${process.env.MODEL_PASS}@crud-project.eyn7az2.mongodb.net/?appName=CRUD-PROJECT`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async (req, res, next) => {
  // console.log(req.headers.authorization);
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({ masagge: "unauthorized" });
  }
  const token = authorization.split(" ")[1];

  try {
    await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    res.status(401).send({ masagge: "unauthorized" });
  }
};

async function run() {
  try {
    // await client.connect();

    const db = client.db("modeldb");
    const modelcollection = db.collection("models");
    const downloadCollection = db.collection("downloads");

    // find method = when we need the miltiple data then we call it

    // findOne method = when we need the one perticuller data then we call it

    app.get("/models", async (req, res) => {
      const result = await modelcollection.find().toArray();
      res.send(result);
    });

    app.get("/models/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await modelcollection.findOne(query);

      res.send(result);
    });

    app.get("/latest-models", async (req, res) => {
      const cursor = modelcollection.find().sort({ created_at: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/models", async (req, res) => {
      const newModels = req.body;
      const result = await modelcollection.insertOne(newModels);
      res.send(result);
    });

    app.patch("/models/:id", async (req, res) => {
      const id = req.params.id;
      const updateModels = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updateModels.name,
          category: updateModels.category,
          description: updateModels.description,
          thumbnail: updateModels.thumbnail,
        },
      };

      const result = await modelcollection.updateOne(query, update);
      res.send(result);
    });

    app.delete("/models/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await modelcollection.deleteOne(query);
      res.send(result);
    });

    app.get("/my-models", verifyToken, async (req, res) => {
      const email = req.query.email;
      const result = await modelcollection
        .find({ created_by: email })
        .toArray();
      res.send(result);
    });

    app.post("/my-downloads/:id", async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      const result = await downloadCollection.insertOne(data);
      const filter = { _id: new ObjectId(id) };
      const update = {
        $inc: {
          downloads: 1,
        },
      };
      const downloadCounted = await modelcollection.updateOne(filter, update);
      res.send(result, downloadCounted);
    });

    app.get("/my-downloads", verifyToken, async (req, res) => {
      const email = req.query.email;
      const result = await downloadCollection
        .find({
          downloaded_by: email,
        })
        .toArray();
      res.send(result);
    });

    app.get("/search", async (req, res) => {
      const search = req.query.search;
      const result =await modelcollection.find({ name: {$regex:search, $options : 'i'} }).toArray();
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("3d modle server is running");
});

app.listen(port, () => {
  console.log(`3D Modle server is running on port: ${port}`);
});
