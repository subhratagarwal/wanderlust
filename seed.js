const mongoose = require('mongoose');
const Listing = require('./models/listing');
const data = require('./init/data'); // adjust if your data file is elsewhere

mongoose.connect('mongodb://127.0.0.1:27017/wanderlust', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const seedDB = async () => {
  await Listing.deleteMany({});
  await Listing.insertMany(data);
  console.log("Database seeded!");
};

seedDB().then(() => mongoose.connection.close());
