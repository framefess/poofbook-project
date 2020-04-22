var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/poofbook";

//การอัพโหลดไฟล์
let upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      // ใช้งาน path module กำหนดโฟลเดอร์ที่จะบันทึกไฟล์
      cb(null, path.join(__dirname, '..', 'public/images'))
    },
    filename: function (req, file, cb) {
      // เปลี่ยนชื่อไฟล์ ในที่นี้ใช้เวลา timestamp ต่อด้วยชือ่ไฟล์เดิม
      // เช่นไฟล์เดิมเป็น bird.png ก็จะได้เป็น  1558631524415-bird.png
      // cb(null, Date.now() + '-' + file.originalname)
      // timestamp และมีนามสกุลไฟล์ เช่น 1558632811925.jpg
      let extArr = file.originalname.split('.')
      let ext = extArr[extArr.length - 1]
      cb(null, Date.now() + '.' + ext)
    }
  }),
  fileFilter: (req, file, cb) => {
    // ถ้าไม่ใช่ไฟล์รูปภาพ
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) { // ตรวจสอบชนิดไฟล์
      return cb(new Error('เฉพาะไฟล์รูปภาพเท่านั้น!'), false)
    }
    cb(null, true) // ถ้าเป็นไฟล์รูปภาพ ผ่านเงื่อนไขการตรวจสอบประเภทไฟล์
  },
  limits: {
    fileSize: 2000000 // กำหนดขนาดไฟล์ไม่เกิน 2 MB = 2000000 bytes
  }
}).any();

//หน้าแรก dashboard หลังบ้าน จัดการ ดูรายการหนังสือ
router.get('/', function (req, res, next) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    const dbo = db.db("poofbook");
    //ดึงข้อมูลหนังสือมาแสดง
    dbo.collection("books").find({}).sort({ category: 1 }).toArray(function (err, result) {
      if (err) throw err;
      console.log(result);
      const data = result;
      db.close();

      res.render('dashboard', { data });
    });
  });

});

//หน้าเพิ่มฟอร์ม แก้ไข หนังสือ
router.get('/book', function (req, res, next) {
  const id = req.query.id;
  if (id == undefined) {
    res.render('book');
  } else {
    MongoClient.connect(url, async function (err, db) {
      if (err) throw err;
      const dbo = db.db("poofbook");
      console.log(id);
      const result = await dbo.collection("books").findOne({ '_id': ObjectId(id) });
      if (result != null) {
        const data = result;
        console.log(result);
        res.render('book', { data });
      }
    });
  }
  console.log(req.query.id);
});

//ตรวจสอบค่าที่ส่งมาจากหน้า เพิ่มฟอร์ม แก้ไข หนังสือ นำมาบันทึกลงดาต้าเบส
router.post('/book', (req, res, next) => {
  // console.log(req.params);
  const id = req.query.id;
  console.log(id);
  if (id != undefined) {
    //แก้ไขหนังสือ
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // ไม่ผ่านเงื่อนไขการอัพโหลดไฟล์
        // res.send('book');
        console.log("fail");
        res.redirect('/dashboard/book');
      } else if (err) {
        // ไม่ผ่านเงื่อนไขอื่นๆ 
        res.render('book', { message: "เฉพาะไฟล์รูปภาพเท่านั้น!" });
        console.log("เฉพาะไฟล์รูปภาพเท่านั้น");
      } else {
        const imgname = (req.files.length > 0 ? req.files[0].filename : "");
        const imgpath = (req.files.length > 0 ? req.files[0].destination : "");
        const pathunlink = (req.files.length > 0 ? req.files[0].path : "");
        const { name, category, price, quantity } = req.body;
        MongoClient.connect(url, function (err, db) {
          if (err) throw err;
          const dbo = db.db("poofbook");
          dbo.collection("books").findOne({ _id: { $ne: ObjectId(id) }, name: name }, async function (err, result) {
            if (err) throw err;
            console.log("*****");
            console.log(result);
            if (result) {
              // console.log(imgname);
              if (req.files.length > 0) {
                fs.unlink(pathunlink, function (err) {
                  if (err) throw err;
                  console.log('File deleted!');
                });
              }
              const result1 = await dbo.collection("books").findOne({ '_id': ObjectId(id) });
              if (result1 != null) {
                const data = result1;
                console.log(result1);
                // res.render('book', { data });
                res.render('book', { message: "มีชื่อหนังสืออยู่ในระบบอยู่แล้ว!", data });
              } else {
                res.redirect('/dashboard');
              }
            } else {
              var myobj = { name: name, category: category, price: price, quantity: quantity, imgname: imgname };
              console.log(myobj);
              let newvalues;
              if (imgname == '') {
                newvalues = { $set: { name: name, category: category, price: price, quantity: quantity } };
              } else {
                newvalues = { $set: { name: name, category: category, price: price, quantity: quantity, imgname: imgname } };
              }

              const myquery = { _id: ObjectId(id) };
              // const newvalues = { $set: {name: name, category: category, price: price, quantity: quantity, imgname: imgname } };
              dbo.collection("books").updateOne(myquery, newvalues, function (err) {
                if (err) throw err;
                console.log("1 document updated");
                db.close();
                res.redirect('/dashboard');
              });
            }
            db.close();
          });
        });
      }
    });
  } else {
    //เพิ่มหนังสือ
    upload(req, res, function (err) {

      if (err instanceof multer.MulterError) {
        // ไม่ผ่านเงื่อนไขการอัพโหลดไฟล์
        // res.send('book');
        console.log("fail");
        res.redirect('/dashboard/book');
      } else if (err) {
        // ไม่ผ่านเงื่อนไขอื่นๆ 
        res.render('book', { message: "เฉพาะไฟล์รูปภาพเท่านั้น!" });
        console.log("เฉพาะไฟล์รูปภาพเท่านั้น");
      } else {
        console.log(req.files);
        const imgname = (req.files.length > 0 ? req.files[0].filename : "");
        const imgpath = (req.files.length > 0 ? req.files[0].destination : "");
        const pathunlink = (req.files.length > 0 ? req.files[0].path : "");
        const { name, category, price, quantity } = req.body;
        MongoClient.connect(url, function (err, db) {
          if (err) throw err;
          const dbo = db.db("poofbook");
          dbo.collection("books").findOne({ name: name }, async function (err, result) {
            if (err) throw err;
            if (result) {

              // console.log(imgname);
              if (req.files.length > 0) {
                fs.unlink(pathunlink, function (err) {
                  if (err) throw err;
                  console.log('File deleted!');
                });
              }
              const result = await dbo.collection("books").findOne({ '_id': ObjectId(id) });
              if (result != null) {
                const data = result;
                console.log(result);
                // res.render('book', { data });
                res.render('book', { message: "มีชื่อหนังสืออยู่ในระบบอยู่แล้ว!" });
              } else {
                res.redirect('/dashboard');
              }

            } else {
              var myobj = { name: name, category: category, price: price, quantity: quantity, imgname: imgname };
              console.log(myobj);
              dbo.collection("books").insertOne(myobj, function (err) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
                console.log(myobj);
                res.redirect('/dashboard');
              });
            }
            db.close();
          });
        });
      }
      // console.log(req.body);
      // console.log(req.files);
      // res.json(req.file);
      // ผ่านเงื่อนไข อัพโหลดไฟล์ได้ปกติ
    })
  }
});

//ลบข้อมูลหนังสือ
router.get('/book/delete/:id', (req, res) => {
  const { id } = req.params;

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    const dbo = db.db("poofbook");
    const myquery = { _id: ObjectId(id) };
    dbo.collection("books").deleteOne(myquery, function (err, obj) {
      if (err) throw err;
      console.log("1 document deleted");
      db.close();
      res.redirect('/dashboard');
    });
  });
});

//หน้ารายการสมาชิก แสดงรายการสมาชิก
router.get('/users', (req, res) => {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    const dbo = db.db("poofbook");
    dbo.collection("users").find({ user_stat: 'user' }).toArray(function (err, result) {
      if (err) throw err;
      // console.log(result);
      db.close();
      const data = result;
      res.render('users', { data });
    });
  });
});


//ลบข้อมูลสมาชิก
router.get('/users/delete/:id', (req, res) => {
  const { id } = req.params;
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    const dbo = db.db("poofbook");
    const myquery = { _id: ObjectId(id) };
    dbo.collection("users").deleteOne(myquery, function (err, obj) {
      if (err) throw err;
      console.log("1 document deleted");
      db.close();
      res.redirect('/dashboard/users');
    });
  });
});

router.get('/users/detail/:id', (req, res) => {
  const { id } = req.params;
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    const dbo = db.db("poofbook");
    const myquery = { _id: ObjectId(id) };
    dbo.collection("users").findOne(myquery, (err, result) => {
      if (err) throw err;
      console.log(result);
      
      const data = result;

      res.render('users_detail', { data });
      db.close();
    });
  });
});

module.exports = router;