const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const passport = require('passport');

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: "130839017404-fkmhf5uccocbk9a1594klaenjcnhi57u.apps.googleusercontent.com",
    clientSecret: "MulxdYDE9AocU2QQqhM3a9e-",
    callbackURL: "http://gloob.eu:3000"
}, function(token, tokenSecret, profile, done){
    UserBooks.findOrCreate({googleId: profile.id}, function(err,user){
        return done(err,user);
    });
}));

const bcrypt_saltrounds = 10;

app.use(express.static('public'))
app.use(cookieParser())
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


mongoose.connect('mongodb://localhost:27017');

const Book = mongoose.model('Book', { name: String, id: String, orders_counter: Number });
const UserBooks = mongoose.model('UserBooks', {name: String, pass : String});
const Orders = mongoose.model("Orders", {productref:{ type: mongoose.Schema.Types.ObjectId, ref: 'Book'}, userref: { type: mongoose.Schema.Types.ObjectId, ref: 'UserBoks'}, date: String, price: Number});


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


app.set('view engine', 'ejs');


app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/',passport.authenticate('google', { failureRedirect: '/login' }), function (req, res){

    console.log(req.user);

        Book.find(function(err,books){
            res.render('index', {'products': books});
        })

});


app.get('/orders/:uid', function(req, res){
    var orderP = new Promise((resolve, reject) =>{
        Orders.find({'userref':req.params.uid}, function(err,orders){ resolve(orders)});
    }).then((ret) => {
        res.send(ret)
    })
})

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

app.get('/order/:id', function(req,res){
    if(req.cookies.uname !== "" && req.cookies.uname !== null && req.cookies.token != "" && req.cookies.token != null ){


        UserBooks.findOne({"name":req.cookies.uname})


        UserBooks.findOne({'name':req.cookies.uname}, (err,user) => {
            if(user){

                // bcrypt.compare(user.name + user.pass, req.cookies.token, (err, result) => {
                //     if(result){
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
                    // }else{
                    //     res.send('nokopopop');
                    // }
             //   })

                
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
            //res.send( "unamenok" )
            res.redirect('/')
        }
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})