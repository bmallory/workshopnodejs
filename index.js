
var fs = require('fs');
const express = require('express');
const app = express();
const ejs = require('ejs');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017');

const Book = mongoose.model('Book', { name: String, id: String, orders_counter: Number });

// const kitty = new Cat({ name: 'Zildjian' });
// kitty.save().then(() => console.log('meow'));

app.set('view engine', 'ejs');
app.use(express.static('public'))

app.get('/', function (req, res){
    getAllProducts(function(err, products){
        if(err){
            console.log(err);
            return
        }

    //    products.forEach(element =>{
    //        book = new Book( {'name':element.name, 'id':element.id, 'orders_counter':element.orders_counter});
    //        book.save();
    //    })

        Book.find(function(err,books){
            res.render('index', {'products': books});
        })
        
      })
    
});

app.get('/order/:id', function(req,res){
     Book.find(function(err,books){
        products.forEach(
            element => {
                if(element.id == req.params.id){
                    element.orders_counter++;
                    console.log(`Commande terminée, Voici votre fichier : ${element.file_link}`);
                }
            }
        )

        fs.writeFile('./products.json', JSON.stringify(products), function(err){
            if(err)console.log(err)
        }  );
        res.send('popo');
    });
});


app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
  })









function getAllProducts( callback ){

    fs.readFile('./products.json', 'utf8', (err,file) => {
        products = JSON.parse(file);
        callback(err, products);

    });

    
}
