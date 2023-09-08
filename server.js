const express = require('express');
const redis = require('redis');

class MockRedis {
    constructor() {
        this.cache = {}
    }

    set(k, v, cb) {
        this.cache[k] = v
        if(cb) cb()
    }

    async get(k) {
        return this.cache[k] ?? null
    }

    on() {}
    
}

const redisClient = new MockRedis()

redisClient.on('error', (err) => {
    console.log('Error occured while connecting or accessing redis server');
});

(async () => {
    if(!(await redisClient.get('customer_name',redis.print))) {
        //create a new record
        await redisClient.set('customer_name','John Doe', redis.print);
        console.log('Writing Property : customer_name');
    } else {
        let val = await redisClient.get('customer_name',redis.print);
        console.log(`Reading property : customer_name - ${val}`);
    }
})()

const PORT = 4500;

const app = express();
const router = express.Router();

app.use(express.json());
app.use(router);

router.get('/', (req,res) => {
    res.status(200).json({
        message : "Sample Docker Redis Application"
    });
});

router.get("/get", async (req, res) => {
    try {
        console.log("HIT GET /get", req.query)
        const val = await redisClient.get(decodeURIComponent(req.query.key))
        res.status(200).send({
            status: 200,
            success: true,
            message: "",
            data: { val },
        })  
    } catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            success: false,
            message: e.message,
            data: {},
        })
    }
})

router.get("/set", async (req, res) => {
    try {
        console.log("HIT GET /set", req.query)
        const val = await redisClient.set(decodeURIComponent(req.query.key), decodeURIComponent(req.query.value))
        console.log(redisClient.cache)
        res.status(200).send({
            status: 200,
            success: true,
            message: "",
            data: { val },
        })
    } catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            success: false,
            message: e.message,
            data: {},
        })
    }
})

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
