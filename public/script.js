var clientSide = {
    onclick: function(id){
        $.get('/order/'+ id, function(data){
            alert(data);
        });
    }
}