//------------------------------------------------- CANVAS CLASS ----------------------------------------------------//

function ASCIICanvas(htmlCanvas, grid) {
	this.class = 'ASCIICanvas';
	this.canvasHTML = htmlCanvas;
	this.canvasContext = this.canvasHTML.getContext("2d");
	this.grid = grid;
	this.font = defaultFont;
	this.cellWidth = null;
	this.cellHeight = null;
	this.cellDescend = null;
	this.zoom = defaultZoom;
	this.changed = true;
	this.linesMode = false;
}

ASCIICanvas.prototype = {
	init : function(){
		$(window).resize(function() {
			this.resize();
		}.bind(this));
		this.resize();
	}
	,getWidth: function() { return this.getCanvasHTML().width }
	, getGrid : function() { return this.grid }
	, getCellWidth : function() { return this.cellWidth }
	, getCellHeight : function() { return this.cellHeight }
	, getZoom : function() { return this.zoom }
	, setZoom: function(newZoom) { this.zoom = newZoom }
	, getCanvasHTML : function() { return this.canvasHTML }
	, getCanvasContext : function() { return this.canvasContext }
	, isFocused : function(){
		return document.body == document.activeElement;
	}
	, getGridCoord: function(mouseCoord){
		// remove zoom
		unzoomedCoord = new Coord(mouseCoord.x/this.zoom,mouseCoord.y/this.zoom);
		// get pixel located at the specified coordinate
		return new Coord(Math.floor(unzoomedCoord.x / this.cellWidth), Math.floor(unzoomedCoord.y / this.cellHeight));
	}
	, setChanged : function(changed){
		this.changed = changed;
	}
	, drawRect : function(coord,width,height,style){
		this.canvasContext.fillStyle = style;
		this.canvasContext.fillRect(coord.x*this.cellWidth,coord.y*this.cellHeight,width,height);
	}
	, drawText : function(text,coord,style){
		this.getCanvasContext().fillStyle = style;
		var canvasCoord = this.getTextLocation(coord);
		this.getCanvasContext().fillText(text,canvasCoord.x,canvasCoord.y);
	}
	, mouseDown : function(eventObject) {	}
	, mouseMove : function(eventObject) {	}
	, mouseUp : function() {	}
	, mouseEnter : function() { }
	, cellDown : function(coord) {
		this.startCoord = coord;
	}
	, cellMove : function(coord) { }
	, cellUp : function(coord) { }
	, mouseLeave : function() { }
	, keyUp : function(eventObject){ }
	, keyDown : function(eventObject){
		if (this.isFocused() && eventObject.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
			eventObject.preventDefault();
		}
	}
	, keyPress : function(eventObject){
		if (eventObject.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
			eventObject.preventDefault();
		}
	}
	, cursor : function() { return "crosshair"; }
	, hasChanged : function(){
		return this.changed;
	}
	, getTextLocation : function(coord){
		return new Coord(coord.x*this.cellWidth, coord.y*this.cellHeight+this.cellHeight-this.cellDescend);
	}
	, recalculateCellDimensions : function(){
		if (this.cellWidth == null){
			this.cellWidth = getTextWidth(this.canvasContext, defaultFont);
			console.log("Cell width '"+this.cellWidth+"'");
		}
		if (this.cellHeight == null){
			heightMetrics = getTextHeight(this.canvasContext,this.font, 0, 0, 100, 100);
			this.canvasContext.clearRect(0, 0, 100, 100);
			this.cellHeight = heightMetrics[0];
			this.cellDescend = heightMetrics[1];
			if (this.cellHeight == 0) {
				this.cellHeight = this.cellWidth*1.5;
			}
			console.log("Cell height '"+this.cellHeight+"', cell descend '"+this.cellDescend+"'");
		}
	}
	, resize : function(){
		this.recalculateCellDimensions(this.canvasContext);
		this.canvasHTML.width = this.grid.cols * Math.round(this.cellWidth) * this.zoom;
		this.canvasHTML.height = this.grid.rows * Math.round(this.cellHeight) * this.zoom;
		$("#canvas-container").width(this.getCanvasHTML().width);
		this.changed = true;
		// console.log("New canvas size ("+this.grid.cols+","+this.grid.rows+","+this.grid.zoom+") '"+this.canvasHTML.width+"/"+this.canvasHTML.height+"'");
	}
	, redraw : function() {

		// console.log("Redrawing canvas... zoom '"+this.zoom+"'");

		this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
		this.canvasContext.scale(this.zoom, this.zoom);

		// clear everything so we dont have pixels drawn over pixels
		this.canvasContext.clearRect(0, 0, this.canvasHTML.width, this.canvasHTML.height);

		// Draw border
		// drawBorder(this.canvasContext,this.canvasHTML.width, this.canvasHTML.height);

		// debug
		// console.log("Drawing grid with font '"+this.font+"' & size '"+this.cellWidth+"/"+this.cellHeight+"'...");

		// set line width & color for the grid
		this.canvasContext.lineWidth = "1";
		this.canvasContext.strokeStyle = "#DDDDDD";

		// draw rows
		for (i=0; i<this.grid.rows; i++){
			this.canvasContext.beginPath();
			this.canvasContext.moveTo(0,i*this.cellHeight);
			this.canvasContext.lineTo(this.canvasHTML.width, i*this.cellHeight);
			this.canvasContext.stroke();
		}

		// draw cols
		for (i=0; i<this.grid.cols; i++){
			this.canvasContext.beginPath();
			this.canvasContext.moveTo(i*this.cellWidth,0);
			this.canvasContext.lineTo(i*this.cellWidth,this.canvasHTML.height);
			this.canvasContext.stroke();
		}

		// print something
		// paint(this.canvasContext,this.font,this.cellWidth);

		// draw uncommited changes
		this.canvasContext.fillStyle = "#669999";
		for (col=0; col<this.grid.cols; col++){
			for (row=0; row<this.grid.rows; row++){
				var pixel = this.grid.getPixel(new Coord(col, row));
				if (pixel.tempValue != null && pixel.tempValue != ""){
					this.canvasContext.fillRect(col*this.cellWidth,row*this.cellHeight,this.cellWidth,this.cellHeight);
				}
			}
		}

		// draw pixels
		this.canvasContext.font = defaultFont;
		this.canvasContext.fillStyle = "#000000"
		for (col=0; col<this.grid.cols; col++){
			for (row=0; row<this.grid.rows; row++){
				var pixel = this.grid.getPixel(new Coord(col, row));
				var pixelValue = pixel.getValue();
				if (pixelValue != null && pixelValue != ""){
					// for drawing a char it must be at least cellWidth in y axis
					var canvasCoord = this.getTextLocation(new Coord(col,row));
					this.canvasContext.fillText(pixelValue,canvasCoord.x,canvasCoord.y);
				}
			}
		}
		this.canvasContext.stroke();
	}
}
