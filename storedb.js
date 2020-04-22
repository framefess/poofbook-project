const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
 
const url = 'mongodb://localhost:27017' // กำหนด url สำหรับ MongoDB Server
const dbName = 'poofbook' // กำหนดชื่อฐานข้อมูลที่จะใช้งาน
 
const store = new MongoDBStore({
    uri: url,
    databaseName: dbName,
    collection: 'mySession'
  },function(error) {
    if(error){
        console.log('Not connect to MongoDB')
    }
})
  
module.exports = store