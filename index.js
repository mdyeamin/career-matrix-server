const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
var cors = require("cors");
const app = express();
const port = 8000;
app.use(cors());
app.use(express.json());
const uri = process.env.MONGODB_URI;
app.get("/", (req, res) => {
  res.send("Hello World!");
});

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("career-matrix");
    const jobCollection = database.collection("jobs");
    const companyCollection = database.collection("companies");
    const userCollection = database.collection("user");

    // get all user
    app.get("/api/users", async (req, res) => {
      const cursor = userCollection.find().skip(6)
      const result = await cursor.toArray()
      res.send(result)
    });

    // get jobs api

    app.get("/api/jobs", async (req, res) => {
      console.log("statuss", req.query.companyId);
      const query = {};
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      console.log("qqqqqqqq", query);
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // post jobs api
    app.post("/api/jobs", async (req, res) => {
      const jobs = req.body;
      const newJobs = {
        ...jobs,
        createdAt: new Date(),
      };
      const result = await jobCollection.insertOne(newJobs);
      console.log("After post from backend", result);

      res.send(result);
    });

    // companies related api

    //get all companies
    app.get('/api/companies',async(req,res)=>{
      const cursor =  companyCollection.find().skip(2)
      const result = await cursor.toArray()
      res.send(result)
    })
    // get company
    app.get("/api/my/companies", async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }
      const result = await companyCollection.findOne(query);
      // const result = cursor.toArray();
      res.send(result || {});
    });

    // post company
    app.post("/api/companies", async (req, res) => {
      const company = req.body;
      const newCompany = {
        ...company,
        createdAt: new Date(),
      };
      const result = await companyCollection.insertOne(newCompany);
      console.log("after post company backend", result);

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
