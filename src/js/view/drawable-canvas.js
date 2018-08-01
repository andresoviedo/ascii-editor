function DrawableCanvas(canvas){
	this.class = "DrawableCanvas";
	this.canvas = canvas;
	this.grid = canvas.getGrid();
}

/**
 * Add text & line drawing capabilities to canvas
 */
DrawableCanvas.prototype = {
	/**
	 * Return true if the specified pixel has a drawing character
	 */
	isDrawChar : function(pixel) {
		if (pixel == null || pixel == undefined){
			return pixel;
		}
		return UC.isChar(pixel.getValue());
	}
	/**
	 * Returns the context of the specified pixel. That is, the status of the surrounding pixels
	 */
	, getPixelContext : function(coord) {
		var left = this.isDrawChar(this.canvas.getPixel(coord.add(leftCoord)));
		var right = this.isDrawChar(this.canvas.getPixel(coord.add(rightCoord)));
		var top = this.isDrawChar(this.canvas.getPixel(coord.add(topCoord)));
		var bottom = this.isDrawChar(this.canvas.getPixel(coord.add(bottomCoord)));
		return new PixelContext(left, right, top, bottom);
	}
	, drawLine : function(startCoord, endCoord, mode, pixelValue, ommitIntersections) {
		// console.log("Drawing line from "+startCoord+" to "+endCoord+" with value '"+pixelValue+"'...");
		if (mode == "best"){
			return this.drawLineImpl3(startCoord, endCoord, mode, pixelValue, ommitIntersections);
		}
		if (mode == "horizontal-horizontal" || mode == "vertical-vertical"
			|| mode == "vertical-horizontal" || mode == "vertical-horizontal"){
			return this.drawLineImpl2(startCoord, endCoord, mode, pixelValue, ommitIntersections);
		}
		return this.drawLineImpl(startCoord, endCoord, mode, pixelValue, ommitIntersections);
	}
	/**
	 * This functions draws a line of pixels from startCoord to endCoord. The line can be drawn 2 ways: either first horizontal line of first vertical line.
	 * For drawing boxes, the line should be drawn both ways.
	 */
	, drawLineImpl : function(startCoord, endCoord, drawHorizontalFirst, pixelValue, ommitIntersections) {
		// calculate box so we know from where to where we should draw the line
		var box = new Box(startCoord, endCoord), minX = box.minX, minY = box.minY, maxX = box.maxX, maxY = box.maxY;

		// calculate where to draw the horizontal line
		var yPosHorizontalLine = drawHorizontalFirst ? startCoord.y : endCoord.y
		for (;minX <= maxX; minX++) {
			var newCoord = new Coord(minX, yPosHorizontalLine), pixelContext = this.getPixelContext(new Coord(minX, yPosHorizontalLine));
			// stack pixels even if we are omiting intersections
			var finalValue = pixelValue;
			if (ommitIntersections && (pixelContext.top+pixelContext.bottom==2)) finalValue = null;
			this.grid.stackPixel(newCoord, finalValue);
		}
		// calculate where to draw the vertical line
		var xPosLine = drawHorizontalFirst ? endCoord.x : startCoord.x;
		for (;minY <= maxY; minY++) {
			var newCoord = new Coord(xPosLine, minY), pixelContext = this.getPixelContext(new Coord(xPosLine, minY));
			// stack pixels even if we are omiting intersections
			var finalValue = pixelValue;
			if (ommitIntersections && (pixelContext.left+pixelContext.right==2)) finalValue = null;
			this.grid.stackPixel(newCoord, pixelValue);
		}
	}
	// draw stepped line
	, drawLineImpl2 : function(startCoord, endCoord, drawMode, pixelValue, ommitIntersections) {
		if (drawMode == "horizontal-horizontal" || drawMode == "vertical-vertical"){
			var box = new Box(startCoord, endCoord), minX = box.minX, minY = box.minY, maxX = box.maxX, maxY = box.maxY;
			var midCoord1 = null;
			var midCoord2 = null;
			if (drawMode == "horizontal-horizontal") { midCoord1 = new Coord(box.midX, startCoord.y); midCoord2 = new Coord(box.midX, endCoord.y); }
			if (drawMode == "vertical-vertical") { midCoord1 = new Coord(startCoord.x, box.midY); midCoord2 = new Coord(endCoord.x, box.midY); }
			this.drawLineImpl(startCoord, midCoord1, drawMode == "horizontal-horizontal", pixelValue, ommitIntersections);
			this.drawLineImpl(midCoord1, midCoord2, drawMode != "horizontal-horizontal", pixelValue, ommitIntersections);
			this.drawLineImpl(midCoord2, endCoord, drawMode == "horizontal-horizontal", pixelValue, ommitIntersections);
		}
		else if (drawMode == "horizontal-vertical" || drawMode == "vertical-horizontal"){
			this.drawLineImpl(startCoord, endCoord, drawMode == "horizontal-vertical", pixelValue, ommitIntersections);
		}
	}
	, drawLineImpl3 : function(startCoord, endCoord, drawMode, pixelValue, ommitIntersections) {
		this.drawLineImpl2(startCoord, endCoord, "horizontal-horizontal", pixelValue, ommitIntersections);
	}
	, getTextStart : function(startCoord) {
		// guess where the text starts (leftmost col and upmost row)
		var startingColumn = startCoord.x;
		for (col=startingColumn; col>=0; col--){
			pixel = this.grid.getPixel(new Coord(col,startCoord.y));
			if (this.isDrawChar(pixel)){
				break;
			}
			previousPixelValue = pixel.getValue();
			if (previousPixelValue == null){
				if (col == 0){
					break;
				} else{
					pixel2 = this.grid.getPixel(new Coord(col-1,startCoord.y));
					previousPixelValue2 = pixel2.getValue();
					if (previousPixelValue2 == null || this.isDrawChar(pixel2)) break;
				}
			}
			startingColumn = col;
		}
		var startingRow = startCoord.y;
		for (row=startingRow; row>=0; row--){
			pixel = this.grid.getPixel(new Coord(startingColumn,row));
			previousPixelValue = pixel.getValue();
			if (previousPixelValue == null || this.isDrawChar(pixel)) break;
			startingRow = row;
		}
		return new Coord(startingColumn, startingRow);
	}, getTextColStart : function(startCoord) {
		// guess where the text starts
		var chars_found = 0;
		var startingColumn = startCoord.x;
		for (col=startingColumn; col>=0; col--){
			pixel = this.grid.getPixel(new Coord(col,startCoord.y));
			if (this.isDrawChar(pixel)){
				break;
			}
			previousPixelValue = pixel.getValue();
			if (previousPixelValue == null){
				if (col == 0){
					break;
				} else{
					pixel2 = this.grid.getPixel(new Coord(col-1,startCoord.y));
					previousPixelValue2 = pixel2.getValue();
					if (previousPixelValue2 == null || this.isDrawChar(pixel2)) break;
				}
			}
			else{
				chars_found++;
			}
			startingColumn = col;
		}
		if (chars_found==0) return null;
		return new Coord(startingColumn, startCoord.y);
	}

	/*
	 * TODO: implement trim function so we export just the necessary text
	 */
	/*function trimText(text){
		lines = text.split("\n");
		ret = "";
		for (e = 0;e < lines.length;e++) {
			ret += "\n";
			for (var g = lines[e], l = 0;l < g.length;l++) {
				var h = g.charAt(l);
				ret += h;
			}
		}
	}*/
	, getText : function(startCoord){
		pixel = this.grid.getPixel(startCoord);
		if (pixel == undefined) return undefined;

		pixelValue = pixel.getValue();
		if (pixelValue == undefined || pixelValue == null) return null;
		if (this.isDrawChar(pixel)) return null;

		var text = "";
		for (row=startCoord.y; row<this.grid.rows; row++){
			pixel = this.grid.getPixel(new Coord(startCoord.x,row));
			nextPixelValue = pixel.getValue();
			if (nextPixelValue == null || this.isDrawChar(pixel)) break;

			text += "\n";
			for (col=startCoord.x; col<this.grid.cols; col++){
				pixel = this.grid.getPixel(new Coord(col,row));
				if (this.isDrawChar(pixel)){
					break;
				}
				nextPixelValue = pixel.getValue();
				if (nextPixelValue != null){
					text += nextPixelValue;
					continue;
				}
				if (col > this.grid.cols-2){
					break;
				}

				pixel2 = this.grid.getPixel(new Coord(col+1,row));
				nextPixelValue2 = pixel2.getValue();
				if (this.isDrawChar(pixel2)){
					break;
				}

				if (nextPixelValue2 != null){
					text += " ";
					continue;
				}
			}
		}
		if (text.startsWith("\n")) text = text.substring(1);
		return text;
	}
	, getFinalCoords : function(coord, direction) {
		var ret = [];
	  for (i=0, currentCord = coord;;i++) {
	    var nextCoord = currentCord.add(direction);
	    if (!this.isDrawChar(this.canvas.getPixel(nextCoord))) {
	      if(!currentCord.equals(coord)) ret.push(currentCord);
				return ret;
	    }
	    currentCord = nextCoord;
	    if(this.getPixelContext(currentCord).getLength() >= 3){
				ret.push(currentCord);
			}
	  }
	}
	// Detect the final endpoint of a line. The line should not be necessarily straight
	, getFinalEndPoint : function(coord, direction) {
	  for (var i=0, currentCoord = coord, currentDirection = direction; i< 1000;i++) {
			var currentPixelContext = this.getPixelContext(currentCoord);
	    var nextCoord = currentCoord.add(currentDirection);
			var isNextPixelDrawChar = this.isDrawChar(this.canvas.getPixel(nextCoord));
			if(currentPixelContext.getLength() == 2 && isNextPixelDrawChar){ currentCoord = nextCoord; continue; }
			if(currentPixelContext.getLength() >= 3 && !currentCoord.equals(coord)) return currentCoord;
			if(currentPixelContext.left && currentDirection.add(leftCoord).getLength() != 0) { currentCoord = currentCoord.add(leftCoord); currentDirection = leftCoord; continue; }
			if(currentPixelContext.right && currentDirection.add(rightCoord).getLength() != 0) { currentCoord = currentCoord.add(rightCoord); currentDirection = rightCoord; continue; }
			if(currentPixelContext.top && currentDirection.add(topCoord).getLength() != 0) { currentCoord = currentCoord.add(topCoord); currentDirection = topCoord; continue; }
			if(currentPixelContext.bottom && currentDirection.add(bottomCoord).getLength() != 0) { currentCoord = currentCoord.add(bottomCoord); currentDirection = bottomCoord; continue; }
			return currentCoord.equals(coord)? null : currentCoord;
	  }
	}
	, getLinePoints : function(coord, direction) {
		var ret = [];
	  for (var i=0, currentCoord = coord, currentDirection = direction; i< 1000;i++) {
			var currentPixelContext = this.getPixelContext(currentCoord);
			var nextCoord = currentCoord.add(currentDirection);
			var isNextPixelDrawChar = this.isDrawChar(this.canvas.getPixel(nextCoord));
			if(currentPixelContext.length >= 3 && !currentCoord.equals(coord)) return ret;
			if(currentPixelContext.length >= 2 && isNextPixelDrawChar){ ret.push(currentCoord); currentCoord = currentCoord.add(currentDirection); continue; }
			if(currentPixelContext.left && !currentDirection.isOppositeDir(leftCoord)) { currentDirection = leftCoord; continue; }
			if(currentPixelContext.right && !currentDirection.isOppositeDir(rightCoord)) { currentDirection = rightCoord; continue; }
			if(currentPixelContext.top && !currentDirection.isOppositeDir(topCoord)) { currentDirection = topCoord; continue; }
			if(currentPixelContext.bottom && !currentDirection.isOppositeDir(bottomCoord)) { currentDirection = bottomCoord; continue; }
			return ret.length == 1? null : ret.push(currentCoord), ret;
	  }
	}
	, detectEndPoints : function(coord){
		endPointsInfo = [];
		for (direction in contextCoords) {
			endPoints = this.getFinalCoords(coord, contextCoords[direction]);
			for (endPointIndex in endPoints) {
				endPoint = endPoints[endPointIndex];
				isHorizontal = contextCoords[direction].x != 0;
				startWithArrow = arrowChars1.indexOf(this.canvas.getPixel(coord).getValue()) != -1;
				endWithArrow = arrowChars1.indexOf(this.canvas.getPixel(endPoint).getValue()) != -1;
				endPointInfo = new EndPointInfo(endPoint, this.getPixelContext(endPoint), isHorizontal, startWithArrow, endWithArrow);
				endPointsInfo.push(endPointInfo);
				if (length == 1) {
					//console.log("Found simple endpoint: "+endPointInfo);
				} else {
					// console.log("Found complex endpoint: "+endPointInfo);
					endPointInfo.childEndpoints = [];
					for (var direction2 in contextCoords) {
						// dont go backwards
						if (contextCoords[direction].add(contextCoords[direction2]).getLength() == 0) continue;
						// dont go in the same direction
						// if (contextCoords[direction].add(contextCoords[direction2]).getLength() == 2) continue;
						var endPoints2 = this.getFinalCoords(endPoint, contextCoords[direction2]);
						for (var endPointIndex2 in endPoints2){
							ep2 = new EndPointInfo(endPoints2[endPointIndex2], this.getPixelContext(endPoints2[endPointIndex2]), isHorizontal,
								startWithArrow, -1 != arrowChars1.indexOf(this.canvas.getPixel(endPoints2[endPointIndex2]).getValue()), endWithArrow);
							endPointInfo.childEndpoints.push(ep2);
							// console.log("Found child endpoint: "+ep2);
						}
					}
				}
			}
		}
		return endPointsInfo;
	}
	, detectBox(coord){
		if (!this.isDrawChar(this.canvas.getPixel(coord))) return null; // did you click on the right place?
		var loopCoords = {left:1, right:1, top:1, bottom:1};
		var firstDir = null;
		var pixelContext = this.getPixelContext(coord);
		if (pixelContext.right) firstDir = rightCoord;
		else if (pixelContext.bottom) firstDir = bottomCoord;
		else if (pixelContext.top) firstDir = topCoord;
		else if (pixelContext.left) firstDir = leftCoord;
		var points = [];
		for (var i=0, currentCoord = coord, currentDirection = firstDir; i< 1000;i++) {
			pixelContext = this.getPixelContext(currentCoord);
			if (pixelContext.getLength() < 2) return null; // dead end
	    var nextCoord = currentCoord.add(currentDirection); // let's try next char
			if (nextCoord.equals(coord)) return points; // loop complete :)
			var isNextPixelDrawChar = this.isDrawChar(this.canvas.getPixel(nextCoord));
			if (pixelContext.getLength() >= 2 && isNextPixelDrawChar) { points.push(currentCoord); currentCoord	= nextCoord; continue; }
			if (pixelContext.bottom && loopCoords["bottom"] && !currentDirection.isOppositeDir(bottomCoord)) { loopCoords["bottom"]=0; currentDirection = bottomCoord; continue; }
			if (pixelContext.left && loopCoords["left"] && !currentDirection.isOppositeDir(leftCoord)) { loopCoords["left"]=0; currentDirection = leftCoord; continue; }
			if (pixelContext.top && loopCoords["top"] && !currentDirection.isOppositeDir(topCoord)) { loopCoords["top"]=0; currentDirection = topCoord; continue; }
			if (pixelContext.right && loopCoords["right"] && !currentDirection.isOppositeDir(rightCoord)) { loopCoords["right"]=0; currentDirection = rightCoord; continue; }
			return null; // d'oh! loop incomplete
		}
	}
	, getBox(points){
		var minX=Number.MAX_VALUE,maxX=Number.MIN_VALUE, minY=Number.MAX_VALUE, maxY=Number.MIN_VALUE;
		for (i in points){ p = points[i]; minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
		return new Box(new Coord(minX,minY),new Coord(maxX,maxY));
	}
	, getEndPoints(points){
		var ret = [];
		for (i in points){ p = points[i]; if (this.getPixelContext(p).getLength() >= 3) ret.push(p); }
		return ret;
	}
	, isDrawCharArea: function(area){
		if (this.canvas.isOutOfBounds(area.min) || this.canvas.isOutOfBounds(area.max)) throw "OutOfBoundException";
		for (col = area.minX;col<=area.maxX;col++){
			for (row = area.minY;row<=area.maxY;row++){
				if (!this.isDrawChar(this.canvas.getPixel(new Coord(col,row)))) return false;
			}
		}
		return area.squareSize() > 0;
	}
}
