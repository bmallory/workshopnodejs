
var fs = require('fs');
const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser')


var cookieParser = require('cookie-parser')


app.use(cookieParser())


const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017');

const Book = mongoose.model('Book', { name: String, id: String, orders_counter: Number });
const UserBooks = mongoose.model('UserBooks', {name: String, pass : String});


app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 


app.set('view engine', 'ejs');
app.use(express.static('public'))

app.get('/', function (req, res){

        Book.find(function(err,books){
            res.render('index', {'products': books});
        })
        
});

app.get('/order/:id', function(req,res){

    if(req.cookies.uname !== "" && req.cookies.uname !== null ){
        UserBooks.findOne({'name':req.cookies.uname}, (err,user) => {

            if(user){
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
           
                res.send('nok');
            }
            
        } );
        
    }

    

   
});


app.get('/signup', function(req, res){
    res.render('signup');
})

app.post('/register', function(req, res){

    user = new UserBooks({"name":req.body.user, "pass": req.body.pass});
    user.save();
    res.send('ok');

})

app.post('/login', function(req, res){
    UserBooks.findOne({'name':req.body.user,'pass':req.body.pass}, (err,user) => {
        if(user){
            res.cookie('uname',req.body.user, { maxAge: 900000, httpOnly: true });
            res.send('ok ! <a href="/">retour</a>');
        }else{
            req.send( "unamenok" )
        }
    });
});


app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
  })