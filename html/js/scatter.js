

var scattermatrix;
var count=0;
function createscatterplot(datatile){

  var image = new Image();
  image.src="data:image/png;base64,"+datatile['data'];
  var that = this;
  image.onload = function(){
    scattermatrix.addscatter(datatile['dim1'], datatile['dim2'], image);
    count++;
    console.log(count);
    if(count==8*8)
      scattermatrix.draw();
  }

  
}

function initialize(){
  
  scattermatrix = new scattergl(document.getElementById('scatterplotmatrix'));
  for(var i = 0; i<8; i++){
    for(var j = 0; j<8; j++){
      var postdata = {'dim1': i, 'dim2' : j};
      
      $.post('/data', postdata, createscatterplot);
    }
  }

  return;
  
}


window.onload = initialize;