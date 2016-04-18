//--------------------------------------------- UTIL FUNCTIONS ------------------------------------------------------//

function debug(data) {
	if (typeof data === 'string'){
	  console.log('\''+data+'\'');
	  return;
	}
	if (typeof data == 'number'){
	  console.log(data);
	  return;
	}
	var ok = false;
	for (var key in data) {
	  ok = true;
	  if (data.hasOwnProperty(key)) {
	    console.log(key+"="+data[key]);
	  }
	}
	if (!ok){
	  console.log(data);
	}
}

function getTextWidth(ctx, font){
	ctx.font = font;
	var textMetrics = ctx.measureText("+");
	var width = textMetrics.width;
	return width;
}

function getTextHeight(ctx, left, top, width, height) {

    // Draw the text in the specified area
    ctx.save();
    // ctx.translate(left, top + Math.round(height * 0.8));
    ctx.font = defaultFont;
    ctx.fillText('█',50,50);
    // ctx.mozDrawText('gM'); // This seems like tall text...  Doesn't it?
    ctx.restore();

    // Get the pixel data from the canvas
    var data = ctx.getImageData(left, top, width, height).data,
        first = false, 
        last = false,
        r = height,
        c = 0;

    // Find the last line with a non-white pixel
    while(!last && r) {
        r--;
        for(c = 0; c < width; c++) {
            if(data[r * width * 4 + c * 4 + 3]) {
                last = r;
                break;
            }
        }
    }
    
    var cellDescend = 0;
    if (last){
    	cellDescend = last - 50;
    } 

    // Find the first line with a non-white pixel
    while(r) {
        r--;
        for(c = 0; c < width; c++) {
            if(data[r * width * 4 + c * 4 + 3]) {
                first = r;
                break;
            }
        }

        // If we've got it then return the height
        if(first != r) return [last - first,cellDescend];
    }

    // We screwed something up...  What do you expect from free code?
    return [0,cellDescend];
}

function drawBorder(canvasContext, width, height){
	canvasContext.lineWidth = 5;
	canvasContext.strokeStyle = "#00FF00";
	canvasContext.beginPath();
	canvasContext.moveTo(0,0);
	canvasContext.lineTo(width,0);
	canvasContext.stroke();
	canvasContext.beginPath();
	canvasContext.moveTo(0,0);
	canvasContext.lineTo(0,height);
	canvasContext.stroke();
	canvasContext.beginPath();
	canvasContext.moveTo(0,height);
	canvasContext.lineTo(width,height);
	canvasContext.stroke();
	canvasContext.beginPath();
	canvasContext.moveTo(width,0);
	canvasContext.lineTo(width,height);
	canvasContext.stroke();
}

function paint(ctx,font,cellWidth){
	ctx.font = font;
	ctx.fillText('┌──┼──┐ █ ██', 0,cellHeight-cellDescend);
	ctx.fillText('├──┼──┤ █ ██', 0,cellHeight*2-cellDescend);
	ctx.fillText('└──┼──┘ █ ██', 0,cellHeight*3-cellDescend);
	ctx.fillText('+--+--+ █', 0,cellHeight*5-cellDescend);
	ctx.fillText('+--+--+ █ ██', 0,cellHeight*6-cellDescend);
	ctx.fillText('+--+--+ █ ██', 0,cellHeight*7-cellDescend);
}