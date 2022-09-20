export function random(lower, upper) {
    return lower + Math.random(upper - lower)
}

export function axes(){
    stroke(220);

    // x axes 
    for (var j=0; j<=400; j=j+50){
      line(0,j, 400,j);
    }

    // y axis
    for (var i=0; i<=400 ; i=i+50){
      line(i,0,i,400);
    } 
}