import mongoose from "mongoose";

//define the connection cache type
type MongooseCache = {
    conn : typeof mongoose | null;
    promise : Promise<typeof mongoose> | null;
};

//extend the global object to include our mongoose cache
declare global {
    //eslint-disable-next-line no-var
    var mongoose : MongooseCache | undefined;
}
const MONGODB_URI = "process.env.MONGODB_URI";

//initialise the cache on the global object to persist across hot reloads in dev
let cached: MongooseCache = global.mongoose || {conn:null, promise : null };

if(!global.mongoose){
    global.mongoose = cached;
}

async function connectDB() : Promise<typeof mongoose>{
    //return existing connection if available
    if(cached.conn){
        return cached.conn;
    }

    // return existing connection promise if one is in progress
    if(!cached.promise){
        //validate mongoDB URI exists
        if(!MONGODB_URI){
            throw new Error(
                'Please define the MONGODB_URI environment variable inside .env.local'
            );
        }
        const options = {
            bufferCommands: false,
        };
        //create a new conn promise
        cached.promise = mongoose.connect(MONGODB_URI!, options).then((mongoose) => {
            return mongoose;
        });
    }

    try{
        //wait for the conn to establish
        cached.conn = await cached.promise;
    }catch(error){
        cached.promise = null;
        throw error;
    }
    return cached.conn;
}
export default connectDB;