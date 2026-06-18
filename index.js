const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var cors = require("cors");
const app = express();
const port = 8000;
app.use(cors());
app.use(express.json());
const uri = process.env.MONGODB_URI;
app.get("/", (req, res) => {
  res.send("Hello World!");
});
const logger = async (req, res, next) => {
  console.log("cud ling pong", req.params);
  next();
};

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
    const applicationCollections = database.collection("applications");
    const plansCollection = database.collection("plans");
    const subscriptionCollection = database.collection("subscriptions");
    const sessionCollection = database.collection("session");
    //verification
    const verifyToken = async (req, res, next) => {
      // console.log("headers", req.headers.);
      const authHeader = req?.headers?.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const query = { token: token };
      const session = await sessionCollection.findOne(query);
      const userId = session?.userId;
      const userQuery = {
        _id: userId,
      };
      const user = await userCollection.findOne(userQuery);
      req.user = user;
      // console.log(userId);
      console.log(user);
      next();
    };

    const verifySeeker = async (req, res, next) => {
      if (req.user?.role !== "seeker") {
        res.status(401).send({ message: "unauthorized access" });
      }
    };

    // get all user
    app.get("/api/users", async (req, res) => {
      const cursor = userCollection.find().skip(6);
      const result = await cursor.toArray();
      res.send(result);
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

    // get job api by id
    app.get("/api/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await jobCollection.findOne(query);
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
    // app.get("/api/companies", async (req, res) => {
    //   const cursor = companyCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });
    // inefficient to join/aggregate collection
    app.get("/api/companies", verifyToken, async (req, res) => {
      const cursor = companyCollection.find();
      const companies = await cursor.toArray();
      for (const company of companies) {
        const filter = {
          companyId: company._id.toString(),
        };
        const jobCount = await jobCollection.countDocuments(filter);
        company.jobCount = jobCount;
      }
      res.send(companies);
    });
    // inefficient to join/aggregate collection
    app.get("/api/companies2", async (req, res) => {
      const pipeline = [
        {
          $skip: 4,
        },
      ];
      const cursor = companyCollection.aggregate(pipeline);
      const result = await cursor.toArray();
      res.send(result);
    });
    // get my company
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

    app.patch("/api/companies/:id", logger, verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedCompany = req.body;
      const updatedDoc = {
        $set: {
          status: updatedCompany.status,
        },
      };
      const result = await companyCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // applications related apis

    // get applications
    app.get("/api/applications", verifyToken, async (req, res) => {
      console.log("after req", req.query.applicantId);
      const query = {};
      if (req.query.applicantId) {
        query.applicantId = req.query.applicantId;
      }
      if (req.query.jobId) {
        query.jobId = req.query.jobId;
      }
      const result = await applicationCollections.find(query).toArray();

      res.send(result);
    });
    //post applications
    app.post("/api/applications", async (req, res) => {
      const application = req.body;
      const newApplication = {
        ...application,
        createdAt: new Date(),
      };
      const result = await applicationCollections.insertOne(newApplication);
      res.send(result);
    });

    //plans
    app.get("/api/plans", async (req, res) => {
      const query = {};
      if (req.query.plan_id) {
        query.id = req.query.plan_id;
      }
      const plan = await plansCollection.findOne(query);
      res.send(plan);
    });

    //subscriptions
    app.post("/api/subscriptions", async (req, res) => {
      const data = req.body;
      const subsInfo = {
        ...data,
        createdAt: new Date(),
      };
      const result = await subscriptionCollection.insertOne(subsInfo);

      const filter = { email: data.email };
      // update the value of the 'quantity' field to 5
      const updateDocument = {
        $set: {
          plan: data.planId,
        },
      };
      const updateResult = await userCollection.updateOne(
        filter,
        updateDocument,
      );
      res.send(updateResult);
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
