const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const passport = require('passport');
const restify = require('express-restify-mongoose');
const router = express.Router();
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const stripe = require("stripe")("sk_test_4eC39HqLyjWDarjtT1zdp7dc");

const Book = mongoose.model('Book', { name: String, id: String, orders_counter: Number });
const UserBooks = mongoose.model('UserBooks', {name: String, pass : String, googleId: String});
const Orders = mongoose.model("Orders", {productref:{ type: mongoose.Schema.Types.ObjectId, ref: 'Book'}, userref: { type: mongoose.Schema.Types.ObjectId, ref: 'UserBoks'}, date: String, price: Number});

const bcrypt_saltrounds = 10;

passport.use(new GoogleStrategy({
    clientID: "130839017404-fkmhf5uccocbk9a1594klaenjcnhi57u.apps.googleusercontent.com",
    clientSecret: "MulxdYDE9AocU2QQqhM3a9e-",
    callbackURL: "http://gloob.eu/auth/google/callback"
}, function(token, tokenSecret, profile, done){
    console.log(profile);
    UserBooks.findOneAndUpdate({googleId: profile.id}, {"name": profile.displayName, pass:""}, {upsert:true}, function(err,user){
        
        return done(err,user);
    });
}));
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });



app.use(express.static('public'))
app.use(cookieParser())
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017');

restify.serve(router, Book);

app.use(router);
app.set('view engine', 'ejs');




app.get('/', function (req, res){

    console.log(req.user);

        Book.find(function(err,books){
            res.render('index', {'products': books});
        })

});


/**
 * add order avec Promise.all
 */
app.addOrder = function(productid, userid){

    var bookP = new Promise((resolve, reject) => {
        Book.findOne({"name":productid}, function(err,book){  resolve(book)});
    });

    var userP = new Promise((resolve, reject) => {
        UserBooks.findOne({"name":userid}, function(err,user){  resolve(user)});
    });

    Promise.all([bookP,userP]).then((res) => {
        order = new Orders({"productref":res[0]._id, "userref": res[1]._id, "date":new Date().toDateString(), "price":res[0].orders_counter });
        order.save();
    }).then((res) => console.log(res));
};

/**
 * get products avec async / await
 */
app.get('/products/:uid', async function(req, res){

    var orders = await new Promise((resolve, reject) => {
        Orders.find({userref:req.params.uid}).populate('productref').exec((err, products) => {
            if(err){ throw err}else{
                resolve(products);
            }
        })
    });

  res.send(JSON.stringify(orders));
    
})

/**
 * bcrypt et login 
 */
app.post('/register', function(req, res){

    hash = bcrypt.hash(req.body.pass, bcrypt_saltrounds, (err,hash) =>{
        user = new UserBooks({"name":req.body.user, "pass": hash});
        user.save();
        res.send('ok');
    })

})

app.post('/login', function(req, res){
    UserBooks.findOne({'name':req.body.user}, (err,user) => {
        if(user){
            bcrypt.compare(req.body.pass, user.pass, (err, result) => {
                if(result){
                    bcrypt.hash(req.body.user + req.body.pass, bcrypt_saltrounds, (err, token) =>{
                        res.cookie('uname',req.body.user, { maxAge: 900000, httpOnly: true });
                        res.cookie('token',token, { maxAge: 900000, httpOnly: true });
                        res.send('ok ! <a href="/">retour</a>');
                    })
                    
                }else{
                    res.send('NOok ! <a href="/">retour</a>');
                }
            })
            
        }else{
            res.redirect('/')
        }
    });
});

/**
 * auth social avec passport
 */
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
      console.log(req.user);
    res.cookie('uname',req.user.name, { maxAge: 900000, httpOnly: true });
    res.cookie('token','googleId:'+req.googleId, { maxAge: 900000, httpOnly: true });
    res.redirect('/');
  });


app.get('/orders/:uid', function(req, res){
    var orderP = new Promise((resolve, reject) =>{
        Orders.find({'userref':req.params.uid}, function(err,orders){ resolve(orders)});
    }).then((ret) => {
        res.send(ret)
    })
})



app.get('/order/:id', function(req,res){
    if(
        (req.cookies.uname !== "" && req.cookies.uname !== null && req.cookies.token != "" && req.cookies.token != null)
        || (req.user !== null)
         ){

            // // Token is created using Checkout or Elements!
            // // Get the payment token ID submitted by the form:
             token = req.query.stripeToken; // Using Express

            const charge = stripe.charges.create({
            amount: 999,
            currency: 'usd',
            description: 'Example charge',
            source: token,
            });

            // le payment est synchrone


        UserBooks.findOne({"name":req.cookies.uname})


        UserBooks.findOne({'name':req.cookies.uname}, (err,user) => {
            if(user){

              
                        Book.find({'id':req.params.id}, function(err,books){

                            books.forEach(
                                element => {
                                    if(element.id == req.params.id){
                                        debugger;
                                        element.orders_counter++;
                                        element.save();
                                        app.addOrder(element.name, user.name);
                                       
                                    }
                                }
                            )
                            res.send('popo');
                        });
            }else{
                res.send('nok');
            }
        } );
    }else{
        res.send("nok");
    }
});


app.get('/signup', function(req, res){
    res.render('signup');
})


app.listen(80, function () {
    console.log('Example app listening on port 3000!')
})