const express = require("express");
const redis = require("redis");
const cors = require("cors");

class MockRedis {
  constructor() {
    this.cache = {};
  }

  set(k, v, cb) {
    this.cache[k] = v;
    if (cb) cb();
  }

  async get(k) {
    return this.cache[k] ?? null;
  }

  on() {}
}

const redisClient = redis.createClient();

redisClient.on("error", (err) => {
  console.log("Error occured while connecting or accessing redis server");
});

(async () => {
  if (!(await redisClient.get("customer_name", redis.print))) {
    //create a new record
    await redisClient.set("customer_name", "John Doe", redis.print);
    console.log("Writing Property : customer_name");
  } else {
    let val = await redisClient.get("customer_name", redis.print);
    console.log(`Reading property : customer_name - ${val}`);
  }
})();

const PORT = 4700;

const app = express();
const router = express.Router();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json({ limit: "500mb" }));
app.use(
  express.urlencoded({ limit: "500mb", extended: true, parameterLimit: 500000 })
);
app.use(router);

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Sample Docker Redis Application",
  });
});

router.get("/get", async (req, res) => {
  try {
    console.log("HIT GET /get", req.query);
    console.log("HIT GET KEY /get", req.query.key);
    const val = await new Promise((resolve, reject) => {
      redisClient.get(req.query.key, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    console.log("Val", val);
    res.status(200).send({
      status: 200,
      success: true,
      message: "",
      data: { val },
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({
      status: 500,
      success: false,
      message: e.message,
      data: {},
    });
  }
});

router.post("/set", async (req, res) => {
  try {
    console.log("HIT GET /set", req.query);
    const val = await redisClient.set(req.body.key, req.body.value);
    console.log(redisClient.cache);
    res.status(200).send({
      status: 200,
      success: true,
      message: "",
      data: { val },
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({
      status: 500,
      success: false,
      message: e.message,
      data: {},
    });
  }
});

app.all("*", (req, res, next) => {
  return res.status(404).json({
    status: 404,
    success: false,
    message: `can't find ${req.originalUrl} on this server`,
    data: {},
  });
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
