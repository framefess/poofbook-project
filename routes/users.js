var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/poofbook";
var moment = require('moment');
// เพิ่มหนังสือเข้าตะกร้า
router.get('/cart/add/:id', function (req, res, next) {
  const { id } = req.params;
  const cart = req.session.cart;
  // console.log(isDuplicate);
  // cart.push({id});
  if (req.params) {
    let dupp = 1;
    for (let index = 0; index < cart.length; index++) {
      if (cart[index].id == id) {
        dupp = 0;
      }
    }

    if (dupp != 0) {
      cart.push({ id });
    }
    // console.log(dupp);
    console.log(req.session.cart);
    res.redirect('/');
  } else {
    res.redirect('/');
  }

});

router.get('/cart', function (req, res, next) {
  const cart = req.session.cart;
 
  let idquery = [];
  cart.forEach(k => {
    idquery.push(ObjectId(k.id));
  });
  console.log(idquery);
  // console.log(cart);
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    const query = { _id: { $in: idquery } };
    console.log(query);
    dbo.collection("books").find(query).toArray(function (err, result) {
      if (err) throw err;
      console.log(result);
      db.close();
      const data = result;
      res.render('cart', { data });
    });
  });
});

router.get('/cart/clear', function (req, res, next) {
  req.session.cart = [];
  res.redirect('/users/cart');
});

router.get('/cart/delete/:id', function (req, res, next) {

  const { id } = req.params;
  let cart = req.session.cart;
  console.log(cart);
  for (let key in cart) {
    let res = cart[key].id;
    console.log(res + " " + id);
    if (res == id) {
      // console.log(res);
      cart.splice(key, 1);
      // console.log(cart);
      // console.log(cart[key].id);
    }
  }
  req.session.cart = cart;
  res.redirect('/users/cart');
});

router.get('/order', function (req, res, next) {
  const cart = req.session.cart;
  let idquery = [];
  cart.forEach(k => {
    idquery.push(ObjectId(k.id));
  });
  console.log(idquery);
  // console.log(cart);
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    const query = { _id: { $in: idquery } };
    console.log(query);
    dbo.collection("books").find(query).toArray(async (err, result) => {
      if (err) throw err;
      console.log(result);
      const data = result;
      data.orderid = Math.floor(1000000 + Math.random() * 900000);
      console.log(data.orderid);
      let n = 1;
      while (n == 1) {
        let reorder = await dbo.collection("orders").findOne({ order_id: data.orderid });
        if (reorder == null) {
          n = 0;
        }
      }
      let user = await dbo.collection("users").findOne({ email: req.session.email });
      data.userid = user._id;
      let query = { $and: [{ userid: req.session.userid.toString() }, { status: { $ne: "คืนเรียบร้อย" } }, { status: { $ne: "ยกเลิก" } }] };
      const ordercheck = await dbo.collection("orders").findOne(query);
      console.log("11");
      console.log(ordercheck);
      console.log(query);
      res.render('orderconfirm', { data, moment, ordercheck });
    });
  });
});

router.post('/order', function (req, res, next) {

  // console.log(req.body);
  const { orderid, payment_type, date_receive } = req.body;
  MongoClient.connect(url, async function (err, db) {
    if (err) throw err;

    var dbo = db.db("poofbook");

    let myobj = req.body;
    myobj.status = "รอชำระเงิน";
    myobj.items = [];
    // myobj.items[0] = 
    for (let index = 0; index < myobj.totalquantity; index++) {
      // const element = array[index];
      myobj.items[index] = {
        bookid: myobj.bookid[index],
        name: myobj.name[index],
        pricebook: myobj.pricebook[index],
        priceservice: myobj.priceservice[index]
      };
    }
    delete myobj["bookid"];
    delete myobj["name"];
    delete myobj["pricebook"];
    delete myobj["priceservice"];
    dbo.collection("orders").insertOne(myobj, function (err) {
      if (err) throw err;
      console.log(myobj);
      console.log("1 document inserted");
      db.close();
      req.session.cart = [];
      res.redirect('/users/orderlist');
    });
  });

});
router.get('/orderlist', (req, res) => {
  const userid = req.session.userid;
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    let query = { 'userid': userid.toString() };
    dbo.collection("orders").find(query).sort({ _id: -1 }).toArray(function (err, result) {
      if (err) throw err;
      console.log(query);
      console.log(result);
      db.close();
      const data = result;
      console.log(data);
      res.render('user_order', { data, moment });

    });
  });
});

router.get('/orderlist/cancel/:id', (req, res) => {
  // const userid = req.session.userid ;
  const { id } = req.params;

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    let dbo = db.db("poofbook");
    let myquery = { orderid: id };
    let newvalues = { $set: { status: "ยกเลิก" } };
    console.log(myquery);
    console.log(newvalues);
    dbo.collection("orders").updateOne(myquery, newvalues, function (err, result) {
      if (err) throw err;
      console.log(result.result.nModified);
      console.log("1 document updated");
      db.close();
      res.redirect('/users/orderlist');
    });
  });
});

router.get('/orderlist/detail/:id', (req, res) => {
  // const userid = req.session.userid ;
  const { id } = req.params;
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    let dbo = db.db("poofbook");
    dbo.collection("orders").findOne({ orderid: id }, function (err, result) {
      if (err) throw err;
      console.log(result);
      db.close();
      const data = result;
      res.render('user_order_detail', { data });
    });
  });
});

router.get('/orderlist/payment/:id', (req, res) => {
  const { id } = req.params
  const data = [];
  data.orderid = id;
  res.render('user_orderlist_payment', { data });
});


router.post('/orderlist/payment', (req, res) => {
  const data = req.body;
  console.log(data);
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    // var myobj = { name: "Company Inc", address: "Highway 37" };
    dbo.collection("payments").insertOne(data, function (err, result) {
      if (err) throw err;
      console.log("1 document inserted");
      let myquery = { orderid: data.orderid };
      let newvalues = { $set: { status: "รอตรวจสอบ" } };
      dbo.collection("orders").updateOne(myquery, newvalues, function (err, res2) {
        if (err) throw err;
        console.log("1 document updated");
        db.close();
        res.redirect('/users/orderlist');
      });
    });
  });
});

module.exports = router;