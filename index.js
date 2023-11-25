const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// custom middleware
const verifyToken = (req, res, next) => {
    // console.log('inside verify token', req.headers.authorization);
    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zjzxbzp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const packagesCollection = client.db("exploreNestDB").collection("packages");
        const storiesCollection = client.db("exploreNestDB").collection("stories");
        const guidesCollection = client.db("exploreNestDB").collection("guides");
        const userCollection = client.db("exploreNestDB").collection("users");

        // jwt related api
        app.get('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });
            res.send({ token });
        });

        // packages related api
        app.get('/allPackages', async (req, res) => {
            let queryObj = {};
            const category = req.query.category;
            if (category) {
                const searchPattern = new RegExp(category, 'i');
                queryObj.tourType = { $regex: searchPattern }
            }
            const result = await packagesCollection.find(queryObj).toArray();
            res.send(result);
        });
        app.get('/allPackages/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await packagesCollection.findOne(query);
            // console.log(result);
            res.send(result);
        });

        // guides related api
        app.get('/guides', async (req, res) => {
            const result = await guidesCollection.find().toArray();
            res.send(result);
        });
        app.get('/guides/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await guidesCollection.findOne(query);
            // console.log(result);
            res.send(result);
        });

        // stories related api
        app.get('/stories', async (req, res) => {
            const result = await storiesCollection.find().toArray();
            res.send(result);
        });

        // users related api
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const userExists = await userCollection.findOne(query);
            if (userExists) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Traveler is leaving the nest!')
})

app.listen(port, () => {
    console.log(`Explore nest is laying on port ${port}`);
})