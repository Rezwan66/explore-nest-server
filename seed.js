const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zjzxbzp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const validCategories = [
  "Sports", "Beach", "Hiking", "Countryside", "Wildlife", 
  "Islands", "Castles", "Desert", "Scuba Diving", "Camping"
];

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB for seeding...");
    const packagesCollection = client.db('exploreNestDB').collection('packages');
    
    const packages = await packagesCollection.find({}).toArray();
    console.log(`Found ${packages.length} packages.`);
    console.log('Current categories:', packages.map(p => p.tourType));

    let updatedCount = 0;
    
    // Assign new valid categories to packages so the new filters work
    for (let i = 0; i < packages.length; i++) {
        const pkg = packages[i];
        // Only assign if it's not already one of the valid categories
        if (!validCategories.includes(pkg.tourType)) {
            // Pick a deterministic category based on index so it doesn't randomly change every run
            const newCategory = validCategories[i % validCategories.length];
            await packagesCollection.updateOne(
                { _id: pkg._id },
                { $set: { tourType: newCategory } }
            );
            updatedCount++;
        }
    }
    
    console.log(`Successfully updated ${updatedCount} packages with new categories.`);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
