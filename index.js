require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s2dzxgz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const spotsCollection = client.db('spotDB').collection('spot');
    const myspotsCollection = client.db('spotDB').collection('myspots');

    app.get('/spots', async (req, res) => {
      const cursor = spotsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/spotsSample', async (req, res) => {
      const result = await spotsCollection.aggregate([{ $sample: { size: 6 } }]).toArray();
      res.send(result);
    });

    app.get('/spot/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await spotsCollection.findOne(query);
      res.send(result);
    })

    app.post('/spots', async (req, res) => {
      const newTouristsSpot = req.body;
      const result = await myspotsCollection.insertOne(newTouristsSpot);
      res.send(result);
    })

    app.get('/spots/user/:email', async (req, res) => {
      const userEmail = req.params.email;
      const query = { user_email: userEmail };
      const cursor = myspotsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/spots/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await myspotsCollection.findOne(query);
      res.send(result);
    })

    app.get('/spots/country/:countryName', async (req, res) => {
      try {
        const countryName = req.params.countryName;
        const query = { country_Name: countryName };
        const cursor = spotsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching spots by country:", error);
        res.status(500).send("Internal server error");
      }
    });

    app.delete('/spots/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      try {
        const result = await myspotsCollection.deleteOne(query);
        if (result.deletedCount === 1) {
          res.status(200).send({ success: true, message: "Spot deleted successfully" });
        } else {
          res.status(404).send({ success: false, message: "Spot not found" });
        }
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to delete spot", error });
      }
    });


    app.put('/spots/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedSpot = req.body;
      const spot = {
        $set: {
          tourists_spot_name: updatedSpot.tourists_spot_name,
          country_Name: updatedSpot.country_Name,
          location: updatedSpot.location,
          short_description: updatedSpot.short_description,
          average_cost: updatedSpot.average_cost,
          seasonality: updatedSpot.seasonality,
          travel_time: updatedSpot.travel_time,
          total_visitors_per_year: updatedSpot.total_visitors_per_year,
          user_email: updatedSpot.user_email,
          user_name: updatedSpot.user_name,
          photo: updatedSpot.photo
        }
      };

      try {
        const result = await myspotsCollection.updateOne(filter, spot, options);
        console.log('Update Result:', result);
        res.send(result);
      } catch (error) {
        console.error('Update Error:', error);
        res.status(500).send('Failed to update spot');
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Exploring world server is running')
})

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
})