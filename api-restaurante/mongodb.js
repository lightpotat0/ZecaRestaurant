import { MongoClient } from 'mongodb';

const client = new MongoClient("mongodb://admin_db_user:cqXXkKAINc3zWhdD@ac-tuu2oib-shard-00-00.seirart.mongodb.net:27017,ac-tuu2oib-shard-00-01.seirart.mongodb.net:27017,ac-tuu2oib-shard-00-02.seirart.mongodb.net:27017/?ssl=true&replicaSet=atlas-oq7p4w-shard-0&authSource=admin");

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

// Call this only when your application terminates
export async function disconnectFromMongoDB() {
  await client.close();
}