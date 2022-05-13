const express = require('express')
const cors =require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express()
const port = process.env.PROT || 5000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nwhtf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});



async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("doctors-portal").collection("services");
    const bookingCollection = client.db("doctors-portal").collection("bookings");

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    /****
     * API Naming Convention
     * app.get('/booking') //get all booking in this collection .or get more than one or by filter
     * app.get('/booking/:id')//get a specific booking
     * app.post('/booking') // add a new booking
     * app.patch('/booking/:id)//
     * app.delete('/booking/:id)//
     *
     *
     */

    //warning;
    //this is not the proper way to query
    //After learning more about mongodb . use aggregate lookup, pipeline, match , group
    //google serach = mongodb Aggregation operation
    app.get("/available", async (req, res) => {
      const date = req.query.date || "may 11, 2022";

      //step 1: get all services

      const services = await serviceCollection.find().toArray();

      //step 2: get the booking of the day output: [{}, {}, {},{},{},{},{}]

      const query = { data: date };
      const bookings = await bookingCollection.find(query.toArray());

      //step 3 : for each service, find booking for that service
      services.forEach((service) => {
        // step 4 : find bookings for that service. output [{},{},{},{}]
        const serviceBookings = bookings.filter((b) => b.treatment === service.name);
        //step 5 : select slots of the service bookings : ['','','','','',]
        const bookedSlots = serviceBookings.map((s) => s.slot);
        // step 6 : select those slots that are not in bookedSlots
        const available = service.slot.filter((s) => !bookedSlots.includes(s));
        service.available = available;
      });
      res.send(services);
    });

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result });
    });
  }
  finally{

  }
}
run().catch(console.dir)


app.get('/', (req, res) => {
  res.send('Hello my website')
})

app.listen(port, () => {
  console.log(`my app listening on port ${port}`);
});