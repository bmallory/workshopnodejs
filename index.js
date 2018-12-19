const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

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

app.set('view engine', 'ejs');

app.get('/', function (req, res){
        Book.find(function(err,books){
            res.render('index', {'products': books});
        })
});

app.get('/order/:id', function(req,res){
    if(req.cookies.uname !== "" && req.cookies.uname !== null && req.cookies.token != "" && req.cookies.token != null ){
        UserBooks.findOne({'name':req.cookies.uname}, (err,user) => {
            if(user){
debugger;
                bcrypt.compare(user.name + user.pass, req.cookies.token, (err, result) => {
                    if(result){
                        Book.find({'id':req.params.id}, function(err,books){

                            books.forEach(
                                element => {
                                    if(element.id == req.params.id){
                                        element.orders_counter++;
                                        element.save();
                                        console.log(`Commande terminée, Voici votre fichier : ${element.file_link}`);
                                    }
                                }
                            )
                            res.send('popo');
                        });
                    }else{
                        res.send('nokopopop');
                    }
                })

                
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