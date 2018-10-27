class DrawableCanvas {
	class = "DrawableCanvas";
	grid: Grid;

	constructor(grid: Grid){
		this.grid = grid;
	}

	/**
	 * Return true if the specified pixel has a drawing character
	 */
	isDrawChar(pixel:Pixel | null | undefined) {
		if (pixel == null || pixel == undefined){
			return null;
		}
		return UC.isChar(pixel.getValue());
	}
	/**
	 * Returns the context of the specified pixel. That is, the status of the surrounding pixels
	 */
	getPixelContext(coord: Coord) {
		var left = this.isDrawChar(this.grid.getPixel(coord.add(leftCoord)));
		var right = this.isDrawChar(this.grid.getPixel(coord.add(rightCoord)));
		var top = this.isDrawChar(this.grid.getPixel(coord.add(topCoord)));
		var bottom = this.isDrawChar(this.grid.getPixel(coord.add(bottomCoord)));
		return new PixelContext(Number(left), Number(right), Number(top), Number(bottom));
	}
	drawLine(startCoord:Coord, endCoord:Coord, mode:string | boolean, pixelValue:string, ommitIntersections?:boolean) {
		// console.log("Drawing line from "+startCoord+" to "+endCoord+" with value '"+pixelValue+"'...");
		if (mode == "best"){
			return this.drawLineImpl3(startCoord, endCoord, mode, pixelValue, ommitIntersections);
		}
		if (mode == "horizontal-horizontal" || mode == "vertical-vertical"
			|| mode == "vertical-horizontal" || mode == "vertical-horizontal"){
			return this.drawLineImpl2(startCoord, endCoord, mode, pixelValue, ommitIntersections);
		}
		return this.drawLineImpl(startCoord, endCoord, Boolean(mode), pixelValue, ommitIntersections);
	}
	/**
	 * This functions draws a line of pixels from startCoord to endCoord. The line can be drawn 2 ways: either first horizontal line of first vertical line.
	 * For drawing boxes, the line should be drawn both ways.
	 */
	drawLineImpl(startCoord:Coord, endCoord:Coord, drawHorizontalFirst:boolean, pixelValue:string, ommitIntersections:boolean) {
		// calculate box so we know from where to where we should draw the line
		var box = new Box(startCoord, endCoord), minX = box.minX, minY = box.minY, maxX = box.maxX, maxY = box.maxY;

		// calculate where to draw the horizontal line
		var yPosHorizontalLine = drawHorizontalFirst ? startCoord.y : endCoord.y
		for (;minX <= maxX; minX++) {
			var newCoord = new Coord(minX, yPosHorizontalLine), pixelContext = this.getPixelContext(new Coord(minX, yPosHorizontalLine));
			// stack pixels even if we are omiting intersections
      var finalValue: string | null = pixelValue;
			if (ommitIntersections && (pixelContext.top+pixelContext.bottom==2)) finalValue = null;
			this.grid.stackPixel(newCoord, finalValue);
		}
		// calculate where to draw the vertical line
		var xPosLine = drawHorizontalFirst ? endCoord.x : startCoord.x;
		for (;minY <= maxY; minY++) {
			var newCoord = new Coord(xPosLine, minY), pixelContext = this.getPixelContext(new Coord(xPosLine, minY));
			// stack pixels even if we are omiting intersections
      var finalValue: string | null = pixelValue;
			if (ommitIntersections && (pixelContext.left+pixelContext.right==2)) finalValue = null;
			this.grid.stackPixel(newCoord, pixelValue);
		}
	}
	// draw stepped line
	drawLineImpl2(startCoord:Coord, endCoord:Coord, drawMode:string, pixelValue: string, ommitIntersections: boolean) {
		if (drawMode == "horizontal-horizontal" || drawMode == "vertical-vertical"){
			var box = new Box(startCoord, endCoord), minX = box.minX, minY = box.minY, maxX = box.maxX, maxY = box.maxY;
			let midCoord1;
			let midCoord2;
			if (drawMode == "horizontal-horizontal") { midCoord1 = new Coord(box.midX, startCoord.y); midCoord2 = new Coord(box.midX, endCoord.y); }
			else /*(drawMode == "vertical-vertical")*/ { midCoord1 = new Coord(startCoord.x, box.midY); midCoord2 = new Coord(endCoord.x, box.midY); }
			this.drawLineImpl(startCoord, midCoord1, drawMode == "horizontal-horizontal", pixelValue, ommitIntersections);
			this.drawLineImpl(midCoord1, midCoord2, drawMode != "horizontal-horizontal", pixelValue, ommitIntersections);
			this.drawLineImpl(midCoord2, endCoord, drawMode == "horizontal-horizontal", pixelValue, ommitIntersections);
		}
		else if (drawMode == "horizontal-vertical" || drawMode == "vertical-horizontal"){
			this.drawLineImpl(startCoord, endCoord, drawMode == "horizontal-vertical", pixelValue, ommitIntersections);
		}
	}
	drawLineImpl3(startCoord: Coord, endCoord: Coord, drawMode: string, pixelValue: string, ommitIntersections: boolean) {
		this.drawLineImpl2(startCoord, endCoord, "horizontal-horizontal", pixelValue, ommitIntersections);
	}
	getTextStart(startCoord:Coord) {
		// guess where the text starts (leftmost col and upmost row)
		var startingColumn = startCoord.x;
		for (let col=startingColumn; col>=0; col--){
			let pixel = this.grid.getPixel(new Coord(col,startCoord.y));
			if (this.isDrawChar(pixel)){
				break;
			}
			let previousPixelValue = pixel.getValue();
			if (previousPixelValue == null){
				if (col == 0){
					break;
				} else{
					let pixel2 = this.grid.getPixel(new Coord(col-1,startCoord.y));
					let previousPixelValue2 = pixel2.getValue();
					if (previousPixelValue2 == null || this.isDrawChar(pixel2)) break;
				}
			}
			startingColumn = col;
		}
		var startingRow = startCoord.y;
		for (let row=startingRow; row>=0; row--){
			let pixel = this.grid.getPixel(new Coord(startingColumn,row));
			let previousPixelValue = pixel.getValue();
			if (previousPixelValue == null || this.isDrawChar(pixel)) break;
			startingRow = row;
		}
		return new Coord(startingColumn, startingRow);
	}
	getTextColStart(startCoord: Coord) {
		// guess where the text starts
		var chars_found = 0;
		var startingColumn = startCoord.x;
		for (let col=startingColumn; col>=0; col--){
			let pixel = this.grid.getPixel(new Coord(col,startCoord.y));
			if (this.isDrawChar(pixel)){
				break;
			}
			let previousPixelValue = pixel.getValue();
			if (previousPixelValue == null){
				if (col == 0){
					break;
				} else{
					let pixel2 = this.grid.getPixel(new Coord(col-1,startCoord.y));
					let previousPixelValue2 = pixel2.getValue();
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
	getText(startCoord: Coord){
		let pixel = this.grid.getPixel(startCoord);
		if (pixel == undefined) return undefined;

		let pixelValue = pixel.getValue();
		if (pixelValue == undefined || pixelValue == null) return null;
		if (this.isDrawChar(pixel)) return null;

		var text = "";
		for (let row=startCoord.y; row<this.grid.rows; row++){
			pixel = this.grid.getPixel(new Coord(startCoord.x,row));
			let nextPixelValue = pixel.getValue();
			if (nextPixelValue == null || this.isDrawChar(pixel)) break;

			text += "\n";
			for (let col=startCoord.x; col<this.grid.cols; col++){
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

				let pixel2 = this.grid.getPixel(new Coord(col+1,row));
				let nextPixelValue2 = pixel2.getValue();
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
	getFinalCoords(coord:Coord, direction:Coord): Coord[] {
		var ret:Coord[] = [];
	  for (let i=0, currentCord = coord;;i++) {
	    var nextCoord = currentCord.add(direction);
	    if (!this.isDrawChar(this.grid.getPixel(nextCoord))) {
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
	getFinalEndPoint(coord: Coord, direction: Coord) {
	  for (var i=0, currentCoord = coord, currentDirection = direction; i< 1000;i++) {
			var currentPixelContext = this.getPixelContext(currentCoord);
	    var nextCoord = currentCoord.add(currentDirection);
			var isNextPixelDrawChar = this.isDrawChar(this.grid.getPixel(nextCoord));
			if(currentPixelContext.getLength() == 2 && isNextPixelDrawChar){ currentCoord = nextCoord; continue; }
			if(currentPixelContext.getLength() >= 3 && !currentCoord.equals(coord)) return currentCoord;
			if(currentPixelContext.left && currentDirection.add(leftCoord).getLength() != 0) { currentCoord = currentCoord.add(leftCoord); currentDirection = leftCoord; continue; }
			if(currentPixelContext.right && currentDirection.add(rightCoord).getLength() != 0) { currentCoord = currentCoord.add(rightCoord); currentDirection = rightCoord; continue; }
			if(currentPixelContext.top && currentDirection.add(topCoord).getLength() != 0) { currentCoord = currentCoord.add(topCoord); currentDirection = topCoord; continue; }
			if(currentPixelContext.bottom && currentDirection.add(bottomCoord).getLength() != 0) { currentCoord = currentCoord.add(bottomCoord); currentDirection = bottomCoord; continue; }
			return currentCoord.equals(coord)? null : currentCoord;
	  }
	}
	getLinePoints(coord: Coord, direction: Coord) {
		var ret = [];
	  for (var i=0, currentCoord = coord, currentDirection = direction; i< 1000;i++) {
			var currentPixelContext = this.getPixelContext(currentCoord);
			var nextCoord = currentCoord.add(currentDirection);
			var isNextPixelDrawChar = this.isDrawChar(this.grid.getPixel(nextCoord));
			if(currentPixelContext.length >= 3 && !currentCoord.equals(coord)) return ret;
			if(currentPixelContext.length >= 2 && isNextPixelDrawChar){ ret.push(currentCoord); currentCoord = currentCoord.add(currentDirection); continue; }
			if(currentPixelContext.left && !currentDirection.isOppositeDir(leftCoord)) { currentDirection = leftCoord; continue; }
			if(currentPixelContext.right && !currentDirection.isOppositeDir(rightCoord)) { currentDirection = rightCoord; continue; }
			if(currentPixelContext.top && !currentDirection.isOppositeDir(topCoord)) { currentDirection = topCoord; continue; }
			if(currentPixelContext.bottom && !currentDirection.isOppositeDir(bottomCoord)) { currentDirection = bottomCoord; continue; }
			return ret.length == 1? null : ret.push(currentCoord), ret;
	  }
	}
	detectEndPoints(coord: Coord){
		let endPointsInfo = [];
		for (let direction in window.contextCoords) {
			let endPoints = this.getFinalCoords(coord, window.contextCoords[direction]);
			for (let endPointIndex in endPoints) {
				let endPoint = endPoints[endPointIndex];
				let isHorizontal = window.contextCoords[direction].x != 0;
				let startWithArrow = window.arrowChars1.indexOf(this.grid.getPixel(coord).getValue()) != -1;
				let endWithArrow = window.arrowChars1.indexOf(this.grid.getPixel(endPoint).getValue()) != -1;
				let endPointInfo = new EndPointInfo(endPoint, this.getPixelContext(endPoint), isHorizontal, startWithArrow, endWithArrow);
				endPointsInfo.push(endPointInfo);
				if (length == 1) {
					//console.log("Found simple endpoint: "+endPointInfo);
				} else {
					// console.log("Found complex endpoint: "+endPointInfo);
					endPointInfo.childEndpoints = [];
					for (var direction2 in window.contextCoords) {
						// dont go backwards
						if (window.contextCoords[direction].add(window.contextCoords[direction2]).getLength() == 0) continue;
						// dont go in the same direction
						// if (contextCoords[direction].add(contextCoords[direction2]).getLength() == 2) continue;
						var endPoints2 = this.getFinalCoords(endPoint, window.contextCoords[direction2]);
						for (var endPointIndex2 in endPoints2){
							let ep2 = new EndPointInfo(endPoints2[endPointIndex2], this.getPixelContext(endPoints2[endPointIndex2]), isHorizontal,
								startWithArrow, -1 != window.arrowChars1.indexOf(this.grid.getPixel(endPoints2[endPointIndex2]).getValue()), endWithArrow);
							endPointInfo.childEndpoints.push(ep2);
							// console.log("Found child endpoint: "+ep2);
						}
					}
				}
			}
		}
		return endPointsInfo;
	}

  detectBox(coord: Coord): Coord[] | null {
		if (!this.isDrawChar(this.grid.getPixel(coord))) return null; // did you click on the right place?
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
			var isNextPixelDrawChar = this.isDrawChar(this.grid.getPixel(nextCoord));
			if (pixelContext.getLength() >= 2 && isNextPixelDrawChar) { points.push(currentCoord); currentCoord	= nextCoord; continue; }
			if (pixelContext.bottom && loopCoords["bottom"] && !currentDirection.isOppositeDir(bottomCoord)) { loopCoords["bottom"]=0; currentDirection = bottomCoord; continue; }
			if (pixelContext.left && loopCoords["left"] && !currentDirection.isOppositeDir(leftCoord)) { loopCoords["left"]=0; currentDirection = leftCoord; continue; }
			if (pixelContext.top && loopCoords["top"] && !currentDirection.isOppositeDir(topCoord)) { loopCoords["top"]=0; currentDirection = topCoord; continue; }
			if (pixelContext.right && loopCoords["right"] && !currentDirection.isOppositeDir(rightCoord)) { loopCoords["right"]=0; currentDirection = rightCoord; continue; }
			return null; // d'oh! loop incomplete
		}
	}
	getBox(points: Coord[]): Box{
		var minX=Number.MAX_VALUE,maxX=Number.MIN_VALUE, minY=Number.MAX_VALUE, maxY=Number.MIN_VALUE;
		for (let i in points){ let p = points[i]; minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
		return new Box(new Coord(minX,minY),new Coord(maxX,maxY));
	}
	getEndPoints(points: Coord[]): Coord[]{
		var ret = [];
		for (let i in points){ let p = points[i]; if (this.getPixelContext(p).getLength() >= 3) ret.push(p); }
		return ret;
	}
	isDrawCharArea(area: Box){
		if (this.grid.isOutOfBounds(area.min) || this.grid.isOutOfBounds(area.max)) throw "OutOfBoundException";
		for (let col = area.minX;col<=area.maxX;col++){
			for (let row = area.minY;row<=area.maxY;row++){
				if (!this.isDrawChar(this.grid.getPixel(new Coord(col,row)))) return false;
			}
		}
		return area.squareSize() > 0;
	}
}
