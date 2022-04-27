/* backend server init*/
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
/* env config  */
require("dotenv").config();

const port = process.env.PORT || 5000;

/* middleware */
app.use(cors())
app.use(express.json())


/* default api routes */

app.get("/", (req, res) =>{
    res.send({message: "This is your DEMO Server For Volunteers"})
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@volunteers.opfns.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const eventsCollection = client.db("events-db").collection("events");
        const blogsCollection = client.db("blogs-db").collection("blogs")

        /* ADD EVENT DATA INTO MONGODB */
        app.post("/events",VerifyToken, async(req, res) => {
            const eventBody = req.body.body.uid;
            const decodeInfo = req.decoded.uid;
            const eventData = req.body.body;
            if(eventBody === decodeInfo){
                const result = await eventsCollection.insertOne(eventData);
                if(result.acknowledged){
                    res.send({message: "Event Successfully added."})
                }
            }else{
                res.status(403).send({message: "Forbidden Request"})
            }
                                
        })


        /* GET EVENT DATA FROM MONGODB */
        app.get("/events",VerifyToken,  async(req, res) =>{
            const userId = req.query.uid;
            const userDecodedId = req.decoded.uid;
            const query = req.query;
            
            if(userDecodedId === userId){
                const cursor = await eventsCollection.find(query);
                const result = await cursor.toArray();
                res.send(result)
            }else{
                res.status(403).send({message: "Forbidden Request"})
            } 
            
        })


        /* UPDATE EVENT DATA FROM MONGODB */
        app.put("/events", VerifyToken,  async(req, res) =>{
            const decodedId = req.decoded.uid;
            const userId = req.body.body.uid;
            const query = req.query;
            const eventData = req.body.body;
            const filter = {_id: ObjectId(query.eventId)}
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                  title: eventData?.title,
                  description: eventData?.description,
                  date: eventData?.date,
                  image: eventData?.image
                },
              };
            if(decodedId === userId){ 
                const result = await eventsCollection.updateOne(filter, updateDoc, options);
                if(result.acknowledged){
                    res.send({message: "Update Event Successfully done."})
                }
            }else{
                res.status(403).send({message: "Forbidden Request"})
            }
                       
        })

        /* DELETE EVENT FROM MONGODB */
        app.delete("/event",VerifyToken, async (req, res) =>{
            const authUserUid = req.decoded.uid;
            const uId = req.query.uid;
            const query = req.query.eventId;
            if(authUserUid === uId){
                const result = await eventsCollection.deleteOne({_id: ObjectId(query)})
                if(result.acknowledged){
                    res.send({message: "Event Deleted Successfully done."})
                }
            }else{
                res.status(403).send({message: "Forbidden Request"})
            }
            
            
        })


        /* GET ALL THE VOLUNTEERS EVENT FROM MONGODB */
        app.get("/volunteers", async(req, res)=>{
            const cursor = await eventsCollection.find({});
            const result = await cursor.toArray();
            res.send(result)
        });

        /* SEARCH ALL THE VOLUNTEERS FROM MONGODB */
        app.get("/volunteers/search", VerifyToken, async(req,res) =>{
            const searchQuery = req.query.name.toLowerCase();
            const decodedId = req.decoded.uid;
            const userId = req.query.uid;
            if(decodedId === userId){
                const cursor = await eventsCollection.find({});
                const result = await cursor.toArray();
                const searchedVolunteers = result.filter(volunteer => volunteer.title.toLowerCase().includes(searchQuery))
                res.send(searchedVolunteers)
            }else{
                res.status(403).send({message: "Forbidden Request"})
            }
            
            
        })


        /* ADD BLOG DATA INTO MONGODB */
        app.post("/blog", VerifyToken, async(req, res)=>{
            const userUid = req.body.body.uid;
            const decodedId = req.decoded.uid;
            const blogData = req.body.body;
                        
            if(userUid === decodedId){
                const result = await blogsCollection.insertOne(blogData);
                if(result.acknowledged){
                    res.send({message: "Blog Added successfully done."})
                }
            }else{
                res.status(403).send({message: "Forbidden Request"})
            }
           
            
        })
        /* GET ALL THE Blogs EVENT FROM MONGODB */
        app.get("/blogs", async(req, res)=>{
            const cursor = await blogsCollection.find({});
            const result = await cursor.toArray();
            res.send(result)
        });

        /* GET BLOG DATA FROM MONGODB */
        app.get("/blog",VerifyToken,  async(req, res) =>{
            const userId = req.query.uid;
            const userDecodedId = req.decoded.uid;
            const query = req.query;
            
            if(userDecodedId === userId){
                const cursor = await blogsCollection.find(query);
                const result = await cursor.toArray();
                res.send(result)
            }else{
                res.status(403).send({message: "Forbidden Request"})
            } 
            
        })

       /*  UPDATE DATA FROM MONGODB */
       app.post("/update-blog", VerifyToken, async(req, res) =>{
           const blogContent = req.body.body;
           const verifyUid = blogContent.uid;
           const decodedId = req.decoded.uid;
           const queryId = req.query.blogId;
           if(verifyUid === decodedId){
               const filter = {_id: ObjectId(queryId)}
               const options = {upsert: true}
               const updateDoc = {
                $set: {
                  title: blogContent?.title,
                  category: blogContent?.category,
                  description: blogContent?.description,
                  image: blogContent?.image
                },
              };
              const result = await blogsCollection.updateOne(filter, updateDoc, options)

              if(result.acknowledged){
                  res.send({message: "Blog updated successfully done."})
              }
           }
           else{
            res.status(403).send({message: "Forbidden Request"})
           }
           
           
       })


       /* DELETE BLOG FROM MONGODB */
       app.delete("/blog", VerifyToken, async(req, res) =>{
           const queryId = req.query.blogId;

           const decodedUid = req.decoded.uid;
           const currentUserId = req.query.uid;
           if(decodedUid === currentUserId){
               const filter = {_id: ObjectId(queryId)}
               const result = await blogsCollection.deleteOne(filter);
               if(result.acknowledged){
                   res.send({message: "Blog deleted Successfully done."})
               }
           }
           else{
            res.status(403).send({message: "Forbidden Request"})
           }
           
       })



        /* GET DATA FOR AUTHORIZATION */
        app.post("/login", async(req, res) => {
            const userInfo = req.body;
            const token = jwt.sign(userInfo, process.env.ACCESS_TOKEN,{
                expiresIn: '1d'
            })
            res.send({token});    
        })
 
        
    }finally{}
}

run().catch(console.dir)


function VerifyToken(req, res, next){
    const authToken = req.body?.authorization?.split(" ")[1] || req.headers?.authorization?.split(" ")[1];
        
    if(!authToken){
        return res.status(401).send({message: "UnAuthorization User"})
    }
    jwt.verify(authToken, process.env.ACCESS_TOKEN, function(err, decoded) {
                
        if(err){
            return res.status(403).send({message: "Forbidden Request"})
        }
        req.decoded = decoded;
        next();
    });
    
}


/* listen the port */
app.listen(port, ()=> {
    console.log(`SERVER RUNNING ON ${port}`);
    
})








