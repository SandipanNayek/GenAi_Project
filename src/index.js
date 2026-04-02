import "dotenv/config";

import connectDB from "./db/index.js"
import { app } from "./app.js"

connectDB()
.then(() => {

  app.on("error", (error) => {
    console.error("Server error:", error)
    throw error
  })

  app.listen(process.env.PORT || 8000, () => {
    console.log(`server is running at port : ${process.env.PORT}`)
  })

})
.catch((err) => {
  console.log("MONGODB connection fail", err)
})









