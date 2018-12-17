var fs = require('fs');


fs.readFile('./products.json', 'utf8', (err,file) => {
    let products = JSON.parse(file);
    console.log(products);
})