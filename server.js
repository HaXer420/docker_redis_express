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
}

const redisClient = new MockRedis()
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
        const val = await redisClient.get(req.query.key)
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

router.post("/set", async (req, res) => {
    try {
        const val = await redisClient.set(req.query.key, req.query.value)
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


app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
});
