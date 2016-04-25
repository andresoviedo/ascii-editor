/**
 * ┌─┐┌─┐┌─┐┌─┐┌─┐   ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐
 * │A││S││C││I││I│-->│E││d││i││t││o││r│
 * └─┘└─┘└─┘└─┘└─┘   └─┘└─┘└─┘└─┘└─┘└─┘
 *
 * This is the main code for drawing the ASCII code (pixels from now on) into the HTML canvas.
 * Basically there is a Canvas object holding a Grid object holding of matrix of Pixels.
 *
 * Features implemented so far:
 * - a grid is drawn into the canvas
 * - canvas can be zoomed
 * - boxes can be drawn
 * - tools has an associated mouse cursor
 * - pixels integration
 * - canvas can be cleared
 *
 * TODO: fix text tool so its not drawn outside the bounds of the canvas
 */

// Default font for drawing the ASCII pixels
var defaultFont = "10px Courier New";
// Default canvas zoom. Canvas can be zoomed from 1x (not zoomed) to 4x (zoomed)
var defaultZoom = 1;
// Number of rows for the grid
var defaultNumberOfRows = 100;
// Number of cols for the grid
var defaultNumberOfCols = 200;



// list of characters we use for drawing boxes
var boxChars1 = UC.BOX_CHARS;
boxChars1.push(UC.LATIN_PLUS_SIGN);
boxChars1.push(UC.LATIN_HYPHEN_MINUS);
boxChars1.push(UC.LATIN_VERTICAL_LINE);

// list of characters we use for drawing arrows
var arrowChars1 = [">", "<", "^", "v"];

// Draw styles
var drawStyles = {};
drawStyles["0"] = {"horizontal":"-", "vertical":"|", "corner":"+", "cross":"+"};
drawStyles["1"] = {"horizontal":UC.BOX_HORIZONTAL, "vertical":UC.BOX_VERTICAL, "corner":UC.BOX_CROSS, "cross":UC.BOX_CROSS,
"corner-top-left":UC.BOX_CORNER_TOP_LEFT, "corner-top-right":UC.BOX_CORNER_TOP_RIGHT, "corner-bottom-left":UC.BOX_CORNER_BOTTOM_LEFT, "corner-bottom-right":UC.BOX_CORNER_BOTTOM_RIGHT,
"horizontal-light-up":UC.BOX_HORIZONTAL_LIGHT_UP, "horizontal-light-down":UC.BOX_HORIZONTAL_LIGHT_DOWN,
"vertical-light-right":UC.BOX_VERTICAL_LIGHT_RIGHT, "vertical-light-left":UC.BOX_VERTICAL_LIGHT_LEFT
};

// ascii|latin-1-supplement|lat-extended-a|latin-extended-b|arrows|box-drawing|
var printableCharsRegex = /[ -~]|[¡-ÿ]|[Ā-ſ]|[ƀ-ɏ]|[←-⇿]|[─-╿]/iu;

//-------------------------------------------------- COORD CLASS  ---------------------------------------------------//

/**
 * A simple pair of coordinates x,y for to use to locate any pixel
 */
function Coord(x, y) {
	this.class = 'Coord';
	this.x = x;
	this.y = y;
}

Coord.prototype = {
	toString : function()	{
			return "Coord["+this.x+","+this.y+"]";
	}
	, add : function(other) {
		return new Coord(this.x + other.x, this.y + other.y);
	}
	, equals : function(other){
		return this.x == other.x && this.y == other.y;
	}
	, substract : function(other){
		return new Coord(this.x - other.x, this.y - other.y);
	}
	, length : function() {
	  return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	, clone : function() {
		return new Coord(this.x, this.y);
	}
	, hasSameAxis : function(other) {
		return this.x == other.x || this.y == other.y;
	}
}

// Basic constants
var leftCoord = new Coord(-1, 0), rightCoord = new Coord(1, 0), topCoord = new Coord(0, -1), bottomCoord = new Coord(0, 1);
var contextCoords = [leftCoord, rightCoord, topCoord, bottomCoord];

//------------------------------------------------- PIXEL CLASS -----------------------------------------------------//

function Pixel() {
	this.class = "Pixel";
	// value of the pixel (drawchar or text)
	this.value = null;
	// temp value while the user is still using the tool
	this.tempValue = null;
}
/**
 * Get the pixel value to be drawn to the canvas. Always draw the temporary value if any
 */
Pixel.prototype = {
	getValue : function() {
		return this.tempValue != null? this.tempValue : this.value;
	}
	, clear : function() {
		this.value = null;
		this.tempValue = null;
	}
	, isEmpty : function() {
		return this.value == null && this.tempValue == null;
	}
}

//---------------------------------------------- PIXEL POSITION CLASS -----------------------------------------------//

function PixelPosition(coord, pixel) {
	this.coord = coord;
	this.pixel = pixel;
}

//-------------------------------------------------- GRID CLASS -----------------------------------------------------//

/**
 * This class holds the pixels matrix and a stack for faster access to pixels being modified
 * The matrix is an array of cols x rows (x, y)
 */
function Grid() {
	this.class = 'Grid';
	this.cols = defaultNumberOfCols;
	this.rows = defaultNumberOfRows;
	this.matrix = Array(this.cols);
	this.pixelsStack = [];
	this.changed = true;
	this.init();
}

/**
 * Initialize grid and restore previous user data if available
 */
Grid.prototype = {
	init : function(){
		for (var a = 0;a < this.matrix.length;a++) {
			this.matrix[a] = Array(this.rows);
			for (var b = 0;b < this.matrix[a].length;b++) {
				this.matrix[a][b] = new Pixel;
			}
		}
		if(typeof(Storage) !== "undefined") {
			previousData = localStorage.getItem("data");
			if (previousData != null){
				this.import(previousData, new Coord(0,0), true, true);
				this.commit();
			}
		}
	}
	, isOutOfBounds : function(coord){
		if (coord.x < 0 || coord.x >= this.cols){
			return true;
		}
		if (coord.y < 0 || coord.y >= this.rows){
			return true;
		}
		return false;
	}
	/**
	 * Return the pixel located at the specified coord
	 */
	, getPixel : function(coord) {
			if (this.isOutOfBounds(coord)){
				return undefined;
			}
			return this.matrix[coord.x][coord.y];
	}
	/**
	 * Clears/reset the whole matrix of pixels
	 */
	 , clear : function(start,final) {
		 	console.log("Clearing grid from '"+start+"' to '"+final+"'...");
		 	startRow = start? start.x : 0;
			finalRow = final? final.x : this.matrix.length -1;
			startCol = start? start.y : 0;
			finalCol = final? final.y : this.matrix[0].length -1
			for (var row = startRow; row <= finalRow; row++) {
				for (var col = startCol; col <= finalCol; col++) {
					if (this.isOutOfBounds(new Coord(row,col))) continue;
					this.matrix[row][col].clear();
				}
			}
			this.changed = true;
	}
	, stackPixel : function(coord, value) {
		if (this.isOutOfBounds(coord)) return;
		if (value != null && value != "" && !printableCharsRegex.test(value)) throw new Error("Char non recognized ["+value.charCodeAt(0)+"]");
		var pixel = this.getPixel(coord);
		this.pixelsStack.push(new PixelPosition(coord, pixel));
		pixel.tempValue = value;
		this.changed = true;
	}
	, stackArea : function(area, value) {
		for (minX = area.minX; minX <= area.maxX; minX++) {
			for (minY = area.minY; minY <= area.maxY; minY++) {
				// get pixel we are moving
				pixelCoord = new Coord(minX, minY);
				pixelValue = this.getPixel(pixelCoord).getValue();
				this.stackPixel(pixelCoord, " ");
			}
		}
	}
	, savePixel : function(coord, value) {
		if (this.getPixel(coord).getValue() != value){
			this.stackPixel(coord, value);
		}
	}
	/**
	 * Clears the stack so we have no temporary pixels to be drawn
	 */
	, rollback : function() {
		// console.log("rollback");
		for (var b in this.pixelsStack) {
			this.pixelsStack[b].pixel.tempValue = null;
		}
		this.pixelsStack.length = 0;
		this.changed = true;
	}
	/**
	 * Imports the specified text into the specified coordinates. The text can be multiline.
	 * All the whitespace characters will be replaced for nulls and it means we want to delete the pixel
	 */
	, import : function(text, coord, ommitBlanks, ommitUnrecognized) {
		lines = text.split("\n");
		for (e = 0;e < lines.length;e++) {
			for (var g = lines[e], l = 0;l < g.length;l++) {
				var h = g.charAt(l);
				if (ommitBlanks && (h == "" || h == " ")) continue;
				try{
					this.stackPixel(new Coord(l,e).add(coord), h);
				}catch(e){
					if (ommitUnrecognized) continue;
					throw e;
				}
			}
		}
	}
	, moveArea : function(area, diff) {
		// stack the area we are moving
		this.stackArea(area);
		// move the area to new position
		for (minX = area.minX; minX <= area.maxX; minX++) {
			for (minY = area.minY; minY <= area.maxY; minY++) {
				// get pixel we are moving
				pixelCoord = new Coord(minX, minY);
				// get current pixel value
				pixelValue = this.getPixel(pixelCoord).value;
				// get pixel we are overwriting
				pixelCoord2 = pixelCoord.add(diff);
				// check if pixel is inside canvas
				if (this.isOutOfBounds(pixelCoord2)) continue;
				// get pixel value we are overwriting
				pixelValue2 = this.getPixel(pixelCoord2).getValue();
				// stack the pixel we are overwriting
				this.stackPixel(pixelCoord2, pixelValue != null? pixelValue : pixelValue2 != null? pixelValue2 : " ");
			}
		}
	}
	, export : function(){
		var data = "";
		for (row=0; row<this.rows; row++){
			data += "\n";
			for (col=0; col<this.cols; col++){
				var pixel = this.getPixel(new Coord(col, row));
				var pixelValue = pixel.getValue();
				data += pixelValue == null? " " : pixelValue;
			}
		}
		if (data.startsWith("\n")){
			data = data.substring(1);
		}
		return data;
	}
	, commit : function(b) {
		for (var b in this.pixelsStack) {
			var pixel = this.pixelsStack[b].pixel;
			var newValue = pixel.getValue();
			pixel.value = newValue == " " || newValue == ""? null: newValue;
		}
		this.rollback();

		// save data to local storage
		if(typeof(Storage) !== "undefined") {
	    	localStorage.setItem("data", this.export());
		} else {
	    	// Sorry! No Web Storage support..
		}
	}
}

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
	this.init();
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
	, canvasMouseLeave : function() { }
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
	, resize : function (){
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

// -------------------------------------------- ZOOMABLE CANVAS ---------------------------------------------------- //

function ZoomableCanvas(canvas){
	this.canvas = canvas;
	this.shiftKeyEnabled = false;
	this.init();
}

ZoomableCanvas.prototype = {
	init : function(){
		// bind mousewheel for zooming into the canvas
		$(this.canvas.getCanvasHTML()).bind("mousewheel", this.onMouseWheel.bind(this));
	}
	, keyDown : function(eventObject){
		this.canvas.keyDown(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = true;
		}
	}
	, keyUp: function(eventObject){
		this.canvas.keyUp(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = false;
		}
	}
	, onMouseWheel: function(eventObject) {
		if (!this.shiftKeyEnabled) return;
		var newZoom = this.canvas.getZoom() * (eventObject.originalEvent.wheelDelta > 0 ? 1.1 : 0.9);
		newZoom = Math.max(Math.min(newZoom, 4), 1);
		this.canvas.setZoom(newZoom);
		this.canvas.resize();
		return false;
	}
}

//--------------------------------------------- DRAW CLASSES ------------------------------------------------------- //

/**
 * Calculates the mins and max given 2 coordinates
 */
function Box(coordA, coordB) {
	this.class = 'Box';
	this.minX = Math.min(coordA.x, coordB.x);
	this.minY = Math.min(coordA.y, coordB.y);
	this.maxX = Math.max(coordA.x, coordB.x);
	this.maxY = Math.max(coordA.y, coordB.y);
	this.min = new Coord(this.minX, this.minY);
	this.max = new Coord(this.maxX, this.maxY);
}

Box.prototype = {
	containsCoord : function(coord){
		return coord && coord.x >= this.minX && coord.x <= this.maxX && coord.y >= this.minY && coord.y <= this.maxY;
	}
	, add : function(coord){
		return new Box(this.min.add(coord),this.max.add(coord));
	}
	, squareSize : function(){
		// +1 because boxes include bounds
		return (this.maxX-this.minX+1)*(this.maxY-this.minY+1);
	}
	, toString : function(){
		return "Box: ('"+this.min+"'->'"+this.max+"')";
	}
}

/**
 * Encapsulates data for the surrounding pixels
 */
function PixelContext(left, right, top, bottom) {
	this.class = 'PixelContext';
	this.left = left;
	this.right = right;
	this.bottom = bottom;
	this.top = top;
}

/**
 * Return the number of surrounding pixels
 */
PixelContext.prototype = {
	getLength : function() {
		return this.left + this.right + this.bottom + this.top;
	}
	, toString : function() {
			return "PixelContext["+this.left+","+this.right+","+this.bottom+","+this.top+"]";
	}
}

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
	/**
	 * This functions draws a line of pixels from startCoord to endCoord. The line can be drawn 2 ways: either first horizontal line of first vertical line.
	 * For drawing boxes, the line should be drawn both ways.
	 */
	, drawLine : function(startCoord, endCoord, drawHorizontalFirst, pixelValue, ommitIntersections) {
		// console.log("Drawing line from "+startCoord+" to "+endCoord+" with value '"+pixelValue+"'...");

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
	, getTextStart : function(startCoord) {
		// guess where the text starts
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
	, getFinalCoords : function(coord, diff) {
	  for (var coordCopy = coord.clone(), ret = [];;) {
	    var contextCoord = coordCopy.add(diff);
	    if (!this.isDrawChar(this.canvas.getPixel(contextCoord))) {
	      return coord.equals(coordCopy) || ret.push(coordCopy), ret;
	    }
	    coordCopy = contextCoord;
	    3 == this.getPixelContext(coordCopy).getLength() && ret.push(coordCopy);
	  }
	}
	, getFinalCoords2 : function(coord, diff) {
		var ret = [];
	  for (i=0, currentCord = coord;;i++) {
	    var nextCoord = currentCord.add(diff);
	    if (!this.isDrawChar(this.canvas.getPixel(nextCoord))) {
	      if(!currentCord.equals(coord)) ret.push(currentCord);
				return ret;
	    }
	    currentCord = nextCoord;
	    if(this.getPixelContext(currentCord).getLength() == 3){
				ret.push(currentCord);
			}
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
				contextLength = this.getPixelContext(endPoint).getLength();
				endPointInfo = new EndPointInfo(endPoint, contextLength, isHorizontal, startWithArrow, endWithArrow);
				endPointsInfo.push(endPointInfo);
				if (length == 1) {
					//console.log("Found simple endpoint: "+endPointInfo);
				} else {
					// console.log("Found complex endpoint: "+endPointInfo);
					endPointInfo.childEndpoints = [];
					for (var direction2 in contextCoords) {
						// dont go backwards or in the same direction
						if (contextCoords[direction].add(contextCoords[direction2]).length() == 0) continue;
						if (contextCoords[direction].add(contextCoords[direction2]).length() == 2) continue;
						var endPoints2 = this.getFinalCoords(endPoint, contextCoords[direction2]);
						if (endPoints2.length > 0){
							contextLength2 = this.getPixelContext(endPoints2[0]).getLength();
							ep2 = new EndPointInfo(endPoints2[0], contextLength2, isHorizontal, startWithArrow, -1 != arrowChars1.indexOf(this.canvas.getPixel(endPoints2[0]).getValue()), endWithArrow);
							endPointInfo.childEndpoints.push(ep2);
							// console.log("Found child endpoint: "+ep2);
						}
					}
				}
			}
		}
		return endPointsInfo;
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

// ----------------------------------------------- STYLE DECORATOR ------------------------------------------------- //

function StylableCanvas(canvas){
	this.class = "StylableCanvas";
	this.canvas = canvas;
}

StylableCanvas.prototype = {

	drawLine : function(startCoord, endCoord, drawHorizontalFirst, pixelValue, ommitIntersections) {
		this.canvas.drawLine(startCoord, endCoord, drawHorizontalFirst, pixelValue, ommitIntersections);
		// get drawing style
		drawStyle = $("#style-select").val();
		// fix line style
		for (index in this.canvas.pixelsStack){
			pixelPosition = this.canvas.pixelsStack[index];
			pixel = pixelPosition.pixel;
			pixelValue = this.getPixelValueIntegrated(pixelPosition.coord, drawStyle);
			pixel.tempValue = pixelValue;
		}
	}
	/**
	 * Here is the logic to integrate the pixels. This function return the best drawing character
	 * so its nicely integrated into the ASCII code
	 */
	, getPixelValueIntegrated : function(coord, drawStyle) {
		var pixel = this.canvas.getPixel(coord);
		var pixelValue = pixel.getValue();

		// test whether the pixel is either of the drawing characters
		var isBoxPixel = boxChars1.indexOf(pixelValue) != -1;
		var isArrowPixel = arrowChars1.indexOf(pixelValue) != -1;

		// if its not a drawing character just return. we have nothing to integrate
		if (!isBoxPixel && !isArrowPixel) {
			return pixelValue;
		}

		// get pixel context so we decide which is the best character for integration
		var pixelContext = this.canvas.getPixelContext(coord);

		// handle cases when we are drawing a box
		if (isBoxPixel){
			if (pixelContext.left && pixelContext.right && pixelContext.bottom && pixelContext.top) {
				return drawStyles[drawStyle]["cross"];
			}
			/* This handles this case:
		 	 *                            X - X
		 	 */
			if (pixelContext.left && pixelContext.right && !pixelContext.bottom && !pixelContext.top) {
				return drawStyles[drawStyle]["horizontal"];
			}
			/*
		 	 * This handles this case:	     X
		 	 *                               |
		 	 *                               X
		 	*/
			else if (!pixelContext.left && !pixelContext.right && pixelContext.bottom && pixelContext.top) {
				return drawStyles[drawStyle]["vertical"];
			}
			/*
		 	 * This handles this case:	     ┌X
		 	 *                               X
		 	*/
			else if (!pixelContext.left && pixelContext.right && !pixelContext.top && pixelContext.bottom) {
				cornerPixel = drawStyles[drawStyle]["corner-top-left"];
				return cornerPixel? cornerPixel : drawStyles[drawStyle]["corner"];
			}
			/*
		 	 * This handles this case:	     X┐
		 	 *                                X
		 	*/
			else if (pixelContext.left && !pixelContext.right && !pixelContext.top && pixelContext.bottom) {
				cornerPixel = drawStyles[drawStyle]["corner-top-right"];
				return cornerPixel? cornerPixel : drawStyles[drawStyle]["corner"];
			}
			/*
		 	 * This handles this case:	     X
		 	 *                               └X
		 	 *
		 	*/
			else if (!pixelContext.left && pixelContext.right && pixelContext.top && !pixelContext.bottom) {
				cornerPixel = drawStyles[drawStyle]["corner-bottom-left"];
				return cornerPixel? cornerPixel : drawStyles[drawStyle]["corner"];
			}
			/*
		 	 * This handles this case:	      X
		 	 *                               X┘
		 	 *
		 	*/
			else if (pixelContext.left && !pixelContext.right && pixelContext.top && !pixelContext.bottom) {
				cornerPixel = drawStyles[drawStyle]["corner-bottom-right"];
				return cornerPixel? cornerPixel : drawStyles[drawStyle]["corner"];
			}
			else if (pixelContext.left && pixelContext.right && pixelContext.top && !pixelContext.bottom) {
				pixelValue = drawStyles[drawStyle]["horizontal-light-up"];
				return pixelValue? pixelValue : drawStyles[drawStyle]["horizontal"];
			}
			else if (pixelContext.left && pixelContext.right && !pixelContext.top && pixelContext.bottom) {
				pixelValue = drawStyles[drawStyle]["horizontal-light-down"];
				return pixelValue? pixelValue : drawStyles[drawStyle]["horizontal"];
			}
			else if (!pixelContext.left && pixelContext.right && pixelContext.top && pixelContext.bottom) {
				pixelValue = drawStyles[drawStyle]["vertical-light-right"];
				return pixelValue? pixelValue : drawStyles[drawStyle]["corner"];
			}
			else if (pixelContext.left && !pixelContext.right && pixelContext.top && pixelContext.bottom) {
				pixelValue = drawStyles[drawStyle]["vertical-light-left"];
				return pixelValue? pixelValue : drawStyles[drawStyle]["corner"];
			}
			else if (pixelContext.top || pixelContext.bottom) {
				return drawStyles[drawStyle]["vertical"];
			}

		}
		// handle cases when we are drawing arrows
		else if (isArrowPixel) {
			if (pixelContext.getLength() == 1) {
				if (pixelContext.left) {
					return ">";
				}
				if (pixelContext.bottom) {
					return "v";
				}
				if (pixelContext.top) {
					return "^";
				}
				if (pixelContext.right) {
					return "<";
				}
			}
			else if (pixelContext.getLength() == 3) {
				/*
		 		 * This handles this case:		X
		 		 *                              < X
		 		 *                              X
		 		 */
				if (!pixelContext.left) {
					return "<";
				}
				/*
		 		 * This handles this case:		X
		 		 *                            X ^ X
		 		 *
		 		 */
				else if (!pixelContext.bottom) {
					return "^";
				}
				/*
		 		 * This handles this case:
		 		 *                            X v X
		 		 *                              X
		 		 */
				else if (!pixelContext.top) {
					return "v";
				}
				/*
		 		 * This handles this case:		X
		 		 *                            X >
		 		 *                              X
		 		 */
				if (!pixelContext.right) {
					return ">";
				}
			}
		}

		/*
		 * This handles this case:		X
		 *                            X - X
		 *                              X
		 */
		if (4 == pixelContext.getLength()) {
			return "-";
		}

		return pixelValue;
	}
}

// -------------------------------------------------- DECORATORS --------------------------------------------------- //

/**
 * This tool handles the cursor position & movement (arrow keys) and pointer hovering.
 * This tool also supports the writing and the edition of the text (Backspace & Delete are supported)
 */
function PointerDecorator(canvas, toolId){
	this.class = "PointerDecorator";
	this.canvas = canvas;
	this.toolId = toolId;
	this.selectedCell = null;
	this.pointerCell = null;
	this.drawSelectedCell = false;
	this.changed = false;
}

PointerDecorator.prototype = {

	getPointerCell : function() { return this.pointerCell }
	, setPointerCell : function(coord) { this.pointerCell = coord }
	, getDrawSelectedCell : function() { return this.drawSelectedCell }
	, setDrawSelectedCell : function(draw) { this.drawSelectedCell = draw }
	, getSelectedCell : function() { return this.selectedCell }
	, setSelectedCell : function(coord){
		if (this.canvas.getGrid().getPixel(coord) != undefined){
  		this.selectedCell = coord;
  	}
	}
	, hasChanged : function(){
		this.refresh();
		return this.canvas.hasChanged() || this.changed;
	}
	, setChanged : function(changed){
		this.canvas.setChanged(changed)
		this.changed = changed;
	}
	, redraw : function(){
		this.canvas.redraw();
		// draw selected cell
		if (this.getSelectedCell() != null && this.getDrawSelectedCell()){
			this.canvas.drawText("▏",this.getSelectedCell(),"#009900");
		}
		// draw pointer
		if (this.getPointerCell() != null){
			this.canvas.drawRect(this.getPointerCell(),this.canvas.getCellWidth(), this.canvas.getCellHeight(), "#009900");
		}
	}
	/**
 	 * implementation of intermitent cursor
 	 */
	, refresh : function(){
		var shouldDraw = this.getSelectedCell() != null && new Date().getTime() % 2000 < 1000;
		var changed = shouldDraw != this.getDrawSelectedCell();
		this.setDrawSelectedCell(shouldDraw);
		this.changed = this.changed || changed;
	}
	, cellDown : function(coord){
		this.canvas.cellDown(coord);
		this.mouseStatus = "down";
		this.setSelectedCell(coord);
		this.changed = true;
	}
	, cellMove : function(coord){
		this.canvas.cellMove(coord);
		this.mouseStatus = this.mouseStatus == "up" || this.mouseStatus == "hover"? "hover" : "moving";
		this.setPointerCell(coord);
		this.changed = true;
	}
	, cellUp : function(coord){
		this.canvas.cellUp(coord);
		this.mouseStatus = "up";
	}
	, canvasMouseLeave : function(){
		this.canvas.canvasMouseLeave();
		this.setPointerCell(null);
		if (this.canvas.getActiveTool() != this.toolId) return;
		this.canvas.rollback();
		this.changed = true;
	}
	/**
	 * This to prevent moving the document with the arrow keys
	 */
	, keyDown : function(eventObject){
		this.canvas.keyDown(eventObject);

		// check if canvas has the focus
		if (this.canvas.isFocused()){ return }

		// prevent from processing unwanted keys
		if (eventObject.keyCode == KeyEvent.DOM_VK_LEFT){
	  		eventObject.preventDefault();
	  	}
	  	else if (eventObject.keyCode == KeyEvent.DOM_VK_RIGHT){
	  		eventObject.preventDefault();
	  	}
	  	else if (eventObject.keyCode == KeyEvent.DOM_VK_UP){
	  		eventObject.preventDefault();
	  	}
	  	else if (eventObject.keyCode == KeyEvent.DOM_VK_DOWN){
	  		eventObject.preventDefault();
	  	}
	}

	, keyUp : function(eventObject){
		this.canvas.keyUp(eventObject);
		// check if we have the focus
		if (!this.canvas.isFocused()){ return }
		// check if there is the pointer is inside the canvas
		if (this.getSelectedCell() == null){ return; }
		// move selected cell with the arrows & backspace key
		if (eventObject.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
			if (this.canvas.getPixel(this.getSelectedCell().add(leftCoord)) != undefined){
				this.setSelectedCell(this.getSelectedCell().add(leftCoord));
			}
  	} else if (eventObject.keyCode == KeyEvent.DOM_VK_LEFT){
  		this.setSelectedCell(this.getSelectedCell().add(leftCoord));
  	}	else if (eventObject.keyCode == KeyEvent.DOM_VK_RIGHT){
  		this.setSelectedCell(this.getSelectedCell().add(rightCoord));
  	}	else if (eventObject.keyCode == KeyEvent.DOM_VK_UP){
  		this.setSelectedCell(this.getSelectedCell().add(topCoord));
  	}	else if (eventObject.keyCode == KeyEvent.DOM_VK_DOWN){
  		this.setSelectedCell(this.getSelectedCell().add(bottomCoord));
  	}
  	this.changed = true;
	}
}

// ---------------------------------------------- MOVE FEATURE ----------------------------------------------------- //

function SelectTool(canvas, toolId){
	this.class = "SelectTool";
	this.canvas = canvas;
	this.toolId = toolId;
	this.changed = false;
	// mouse action
	this.startCoord = null;
	this.currentCoord = null;
	this.startTime = null;
	this.currentTime = null;
	this.action = null;
	// area selection
	this.controlKeyEnabled = false;
	this.selectionArea = null;
	this.finalBox = null;
	this.finalMove = null;
	// shape selection
	this.endPointsInfo = null;
	this.selectedBox = null;
}

SelectTool.prototype = {

	hasChanged : function(){
		return this.canvas.hasChanged() || this.changed;
	}
	, setChanged : function(changed){
		this.canvas.setChanged(changed)
		this.changed = changed;
	}
	, keyDown : function(eventObject){
		// propagate event
		this.canvas.keyDown(eventObject);
		// capture event if this is the active tool
		if (this.canvas.getActiveTool() != this.toolId) return;
		// check if canvas has the focus
		if (!this.canvas.isFocused()) return;
		// capture control key event
		if (eventObject.keyCode == KeyEvent.DOM_VK_CONTROL){
			this.controlKeyEnabled = true;
		}
		// check if user is deleting the selection
		if (eventObject.keyCode == KeyEvent.DOM_VK_DELETE) {
			if (this.finalBox != null){
				console.log("Deleting selection '"+this.finalBox+"'...");
				this.canvas.clear(this.finalBox.min, this.finalBox.max);
				this.canvas.commit();
				this.finalBox = null;
				return;
		 }
	 }
	}
	, keyUp: function(eventObject){
		// propagate event
		this.canvas.keyUp(eventObject);
		// capture control key event
		if (eventObject.keyCode == KeyEvent.DOM_VK_CONTROL){
			this.controlKeyEnabled = false;
		}
	}
	, cellDown : function(coord){
		this.canvas.cellDown(coord);
		this.startCoord = coord;
		this.startTime = this.currentTime = new Date().getTime();
		this.mouseStatus = "down";
		this.process();
	}
	, cellMove : function(coord){
		this.canvas.cellMove(coord);
		this.currentCoord = coord;
		this.currentTime = new Date().getTime();
		this.mouseStatus = this.mouseStatus == "down" || this.mouseStatus == "dragging"? "dragging" : "hover";
		this.process();
	}
	, cellUp : function(coord){
		this.canvas.cellUp(coord);
		this.currentCoord = coord;
		this.currentTime = new Date().getTime();
		this.mouseStatus = "up";
		this.process();
	}
	, canvasMouseLeave : function(){
		this.canvas.canvasMouseLeave();
		this.mouseStatus = "leave";
		this.process();
	}
	, process : function(){
		coord = this.currentCoord;
		this.action = this.getNextAction();
		switch(this.action){
			case "select-area":
			case "select-area-in-progress": this.selectArea(coord); break;
			case "select-area-ready": this.selectArea(coord); break;
			case "select-area-moving": this.selectArea(coord); break;
			case "select-area-finalized": this.selectArea(coord); this.action = null; break;
			case "select-shape":
			case "select-shape-moving": this.selectShape(coord); break;
			case "select-shape-finalized": this.selectShape(coord); this.action = null; break;
			case "all": this.selectArea(coord); this.selectShape(coord); break;
			case "rollback": this.canvas.rollback(); this.action = null;
		}
	}
	, getNextAction : function(){
		// machine state for chossing the action to execute
		if (this.canvas.getActiveTool() != this.toolId) return undefined;
		if (this.mouseStatus == "hover") return this.action;
		if (this.mouseStatus == "down" && this.action == "select-area-ready") return "select-area-moving";
		if (this.mouseStatus == "down") return "all";
		if (this.mouseStatus == "dragging" && this.action == "select-area-moving") return "select-area-moving";
		if (this.mouseStatus == "dragging" && this.action == "select-area-in-progress") return "select-area-in-progress";
		if (this.mouseStatus == "dragging" && this.action == "select-shape-moving") return "select-shape-moving";
		if (this.mouseStatus == "dragging" && this.controlKeyEnabled) return "select-area-in-progress";
		if (this.mouseStatus == "dragging" && this.selectedBox != null) return "select-shape-moving";
		if (this.mouseStatus == "dragging") return "select-area-in-progress";
		if (this.mouseStatus == "up" && this.action == "select-shape-moving") return "select-shape-finalized";
		if (this.mouseStatus == "up" && this.action == "select-area-in-progress") return "select-area-ready";
		if (this.mouseStatus == "up" && this.action == "select-area-moving") return "select-area-finalized";
		if (this.mouseStatus == "leave") return "all";
		return undefined;
	}
	, selectArea : function(coord){
		// user finalized the selection
		if (this.mouseStatus == "up"){
			// only do it once (user may click several times on the final selection)
			if (this.finalBox == null){
				this.finalBox = this.selectionArea;
				this.selectionArea = null;
			} else if (this.finalMove != null){
				// user thas completed moving the selection
				this.canvas.commit();
				this.finalMove = null;
				this.finalBox = null;
				this.selectionArea = null;
			}
			return;
		}
		// user is selecting, either to start a new selection or to move selection
		if (this.mouseStatus == "down"){
			// check if user is starting new selection
 			if (this.finalBox == null || !this.finalBox.containsCoord(coord)){
				this.finalBox = null;
				this.selectionArea = null;
				this.canvas.rollback();
			}
			// user is going to move the selection
			return;
		}

		if (this.mouseStatus == "dragging") {
			// user is moving selection
			if (this.finalBox != null && this.finalBox.containsCoord(coord)	|| this.finalMove != null && this.finalMove.containsCoord(coord)){
				// move implementation
				this.canvas.rollback();
				// calculate movement difference
				var diffCoord = coord.substract(this.startCoord);
				// move selected area
				this.canvas.moveArea(this.finalBox, diffCoord);
				// update final box
				this.finalMove = this.finalBox.add(diffCoord);
				return;
			}
			// user is selecting...
			// check we are selecting at least 1 pixel
			if (this.startCoord == null || this.startCoord.equals(coord)){
				if (this.selectionArea != null){
					this.selectionArea = null;
					this.canvas.rollback();
				}
				return;
			}
			// calculate box so we know from where to where we should draw the line
			this.canvas.rollback();
			this.selectionArea = new Box(this.startCoord, coord);

			// stack non-empty pixel within the selected square
			for (minX = this.selectionArea.minX; minX <= this.selectionArea.maxX; minX++) {
				for (minY = this.selectionArea.minY; minY <= this.selectionArea.maxY; minY++) {
					pixelCoord = new Coord(minX, minY);
					pixelValue = this.canvas.getPixel(pixelCoord).getValue();
					this.canvas.stackPixel(pixelCoord, pixelValue != null? pixelValue : " ");
				}
			}
		}
		this.changed = true;
	}
	, selectShape : function(coord){
		if (this.mouseStatus == "down") {
				this.endPointsInfo = this.canvas.detectEndPoints(this.startCoord);
				this.selectedBox = this.detectBox(coord);
				return;
		}
		if (this.action != "select-shape" && this.action != "select-shape-moving" && this.action != "select-shape-finalized") return;
		if (this.mouseStatus == "leave") {
			this.endPointsInfo = null;
			this.selectedBox = null;
			this.canvas.rollback();
			return;
		}
		if (this.mouseStatus == "up") {
			this.canvas.commit();
			return
		};
		// box not detected
		if (this.selectedBox == null) return;
		// move box
		this.canvas.rollback();
		this.canvas.moveArea(this.selectedBox,coord.substract(this.startCoord));
		this.changed = true;
	}
	, detectBox: function(coord){
		// console.log("yupi! "+this.endPointsInfo);
		if (this.endPointsInfo.length == 2 && this.endPointsInfo[0].contextLength == 2 && this.endPointsInfo[1].contextLength == 2
			&& this.endPointsInfo[0].childEndpoints.length > 0 && this.endPointsInfo[1].childEndpoints.length > 0
			&& this.endPointsInfo[0].childEndpoints[0].position.hasSameAxis(this.endPointsInfo[1].childEndpoints[0].position)){
			if (this.endPointsInfo[0].childEndpoints[0].position.equals(this.endPointsInfo[1].childEndpoints[0].position)){
				// its a box
				return new Box(this.startCoord,this.endPointsInfo[0].childEndpoints[0].position);
			}
			else if (this.canvas.isDrawCharArea(new Box(this.endPointsInfo[0].childEndpoints[0].position,this.endPointsInfo[1].childEndpoints[0].position))){
				// its yet a box
				return new Box(this.endPointsInfo[0].position, this.endPointsInfo[1].childEndpoints[0].position);
			}
		}
		return null;
	}
}

// ---------------------------------------------- CANVAS CHAR DECORATOR -------------------------------------------- //

/**
 * This tool handles the cursor position & movement (arrow keys) and pointer hovering.
 * This tool also supports the writing and the edition of the text (Backspace & Delete are supported)
 */
function CharWriterDecorator(canvas){
	this.class = "CharWriterDecorator";
	this.canvas = canvas;
}

CharWriterDecorator.prototype = {

	// some chars are not sent to keypress like period or space
	keyDown : function(eventObject){
		this.canvas.keyDown(eventObject);
		// dont write anything unless canvas has the focus
		if (!this.canvas.isFocused()) return;
		// prevent space key to scroll down page
		if (eventObject.keyCode == KeyEvent.DOM_VK_SPACE) {
			eventObject.preventDefault();
			this.importChar(" ");
			this.canvas.setSelectedCell(this.canvas.getSelectedCell().add(rightCoord));
		} /*else if (eventObject.keyCode == KeyEvent.DOM_VK_PERIOD){
			this.importChar(".");
			this.canvas.setSelectedCell(this.canvas.getSelectedCell().add(rightCoord));
		}*/
		// delete previous character
		else if (eventObject.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
			// fix this: this is coupled to whether the pointer decorator is called first or after
			/*if (this.canvas.getPixel(this.canvas.getSelectedCell().add(leftCoord)) != undefined){
				this.canvas.import(" ",this.canvas.getSelectedCell().add(leftCoord));
			}*/
			if (this.canvas.getPixel(this.canvas.getSelectedCell()) != undefined){
				this.importChar(" ");
			}
  	}
		// delete next character
		else if (eventObject.keyCode == KeyEvent.DOM_VK_DELETE){
  		// get current text
			currentText = this.canvas.getText(this.canvas.getSelectedCell());
			if (currentText == null){ return;	}
			// delete first character and replace last with space (we are moving text to left)
			currentText = currentText.substring(1)+" ";
			this.importChar(currentText);
  	}
	}
	, keyPress : function(eventObject){
		// propagate event
		this.canvas.keyPress(eventObject);
		// dont write anything
		if (!this.canvas.isFocused()){ return }
		// write key
		if (this.canvas.getPixel(this.canvas.getSelectedCell().add(rightCoord)) != undefined){
			try{
				this.importChar(String.fromCharCode(eventObject.charCode));
				this.canvas.setSelectedCell(this.canvas.getSelectedCell().add(rightCoord));
				console.log(eventObject.charCode);
			}catch(e){
				console.log(e.message);
			}
  	}
	}
	, importChar : function(char){
		this.canvas.import(char,this.canvas.getSelectedCell());
		this.canvas.commit();
		this.canvas.setChanged(true);
	}
}

// -------------------------------------------------- TOOL DECORATOR ----------------------------------------------- //

/**
 * Abstract tool
 */

function ToolableCanvas(canvas){
	this.class = "ToolableCanvas";
	this.canvas = canvas;
	this.activeTool = null;
}

ToolableCanvas.prototype = {
	getId : function() { return this.toolId }
	, getActiveTool : function(){ return this.activeTool; }
	, click : function(elementId){
		console.log("Selected tool: "+elementId);
		this.activeTool = elementId;
	}
}

function MovableCanvas(canvas, htmlContainerSelectorId){
	this.class = "MovableCanvas";
	this.canvas = canvas;
	this.htmlContainerSelectorId = htmlContainerSelectorId;
	this.lastMouseEvent = null;
	this.shiftKeyEnabled = false;
}

MovableCanvas.prototype = {
		keyDown : function(eventObject){
		this.canvas.keyDown(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = true;
		}
	}
	, keyUp: function(eventObject){
		this.canvas.keyUp(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = false;
		}
	}
	, mouseDown : function(eventObject) {
		this.canvas.mouseDown(eventObject);
		this.lastMouseEvent = eventObject;
	}
	, mouseMove : function(eventObject){
		this.canvas.mouseMove(eventObject);
		if (!this.canvas.isFocused() || !this.shiftKeyEnabled) return;
		if (this.lastMouseEvent == null) return;
		$(this.htmlContainerSelectorId).scrollTop(Math.max(0,$(this.htmlContainerSelectorId).scrollTop() - (eventObject.clientY-this.lastMouseEvent.clientY)));
		$(this.htmlContainerSelectorId).scrollLeft(Math.max(0,$(this.htmlContainerSelectorId).scrollLeft()  - (eventObject.clientX-this.lastMouseEvent.clientX)));
		this.lastMouseEvent = eventObject;
	}
	, mouseUp : function(){
		this.canvas.mouseUp();
		this.lastMouseEvent = null;
	}
}

// ------------------------------------------------- TOOLS DECORATORS ---------------------------------------------- //

function ClearCanvasTool(canvas, toolId){
	this.class = "ClearCanvasTool";
	this.canvas = canvas;
	this.toolId = toolId;
}

ClearCanvasTool.prototype.click = function(elementId){
	this.canvas.click(elementId);
	if (this.canvas.getActiveTool() == this.toolId) {
		this.canvas.clear();
		this.canvas.commit();
	}
}


/**
 * This is the function for drawing text
 */
function TextEditTool(canvas, toolId) {
	this.class = 'TextEditTool';
	this.canvas = canvas;
	this.toolId = toolId;
	this.mouseCoord = null;
 	this.startCoord = null;
 	this.currentText = null;
 	this.init();
}

TextEditTool.prototype = {
	init : function(){
		$("#text-input").keyup(function(event) {
			if (event.keyCode == KeyEvent.DOM_VK_ESCAPE){
				this.close();
				return;
			}
			this.refresh();
		}.bind(this));
		$("#text-input").keypress(function(eventObject) {
			this.refresh();
		}.bind(this));
		$("#text-input").change(function() {
			this.refresh();
		}.bind(this));
		$("#text-input").blur(function() {
			// TODO: close on blur, but count that ok button is also trigerring blur
			// this.close();
		}.bind(this));
		$("#text-input-close").click(function() {
			this.close();
		}.bind(this));
		$("#text-input-OK").click(function() {
			this.refresh();
			this.canvas.getGrid().commit();
			this.close();
		}.bind(this));
	}
	, click : function(elementId){
		this.canvas.click(elementId);
		this.close();
	}
	, mouseDown : function(eventObject) {
		this.canvas.mouseDown(eventObject);
		this.mouseCoord = eventObject;
	}
	, cellDown : function(startCoord) {
		if (this.canvas.getActiveTool() == this.toolId) {
			// guess where the text exactly starts
			this.startCoord = this.canvas.getTextStart(startCoord);
			// show widget 50 pixels up
			$("#text-widget").css({"left":this.mouseCoord.clientX,"top":Math.max(0,this.mouseCoord.clientY-50)});
			// get current text
			this.currentText = this.canvas.getText(this.startCoord);
			// initialize widget
			$("#text-input").val(this.currentText != null? this.currentText : "");
			// show widget & set focus
			$("#text-widget").show(400, function() {
				$("#text-input").focus();
		  });
	  }
		return this.canvas.cellDown(startCoord);
	}
	, refresh : function() {
		var newValue = $("#text-input").val();
		this.canvas.rollback();
		if (this.currentText != null){
			this.canvas.getGrid().import(this.currentText.replace(/./g," "),this.startCoord);
		}
		try{
			this.canvas.getGrid().import(newValue,this.startCoord);
		}catch(e){
			console.log(e.message);
		}
		this.canvas.setChanged(true);
	}
	, close : function() {
		$("#text-input").val("");
		$("#text-widget").hide();
		this.canvas.getGrid().rollback();
	}
	, cursor : function() {
  		return "text";
	}
}

function EndPointInfo(position,contextLength,isHorizontal,startWithArrow, endWithArrow, endWithArrow2){
  this.class = "EndPointInfo";
  this.position = position;
	this.contextLength = contextLength;
  this.isHorizontal = isHorizontal;
  this.startWithArrow = startWithArrow;
  this.endWithArrow = endWithArrow;
  this.endWithArrow2 = endWithArrow2;
	this.childEndpoints = null;
}

EndPointInfo.prototype = {
	toString : function(){
		return "EndPointInfo: position '"+this.position+"', contextLength '"+this.contextLength+"', isHorizontal '"+this.isHorizontal
		+"', startWithArrow '"+this.startWithArrow+"', endWithArrow '"+this.endWithArrow+"', endWithArrow2 '"+this.endWithArrow2
		+"', childEndpoints '"+this.childEndpoints+"'";
	}
}


/**
 * This is the function to draw boxes. Basically it needs 2 coordinates: startCoord and endCoord.
 */
function BoxDrawerTool(canvas, toolId) {
	this.class = 'BoxDrawerTool';
	this.canvas = canvas;
	this.toolId = toolId;
	this.startCoord = null;
	this.endCoord = null;
	this.mouseStatus = null;
	this.mode = null;
	this.endPointsInfo = null;
}

BoxDrawerTool.prototype = {
	cellDown : function(coord) {
		this.canvas.cellDown(coord);
		this.mouseStatus = "down";
		this.startCoord = coord;
		this.endPointsInfo = this.canvas.detectEndPoints(coord);
	}
	,cellMove : function(coord) {
		this.canvas.cellMove(coord);
		if (this.canvas.getActiveTool() != this.toolId) return;
		if (this.startCoord == null) return;

		this.endCoord = coord;

		// update mouse status
		if (this.mouseStatus == "down"){
			this.mouseStatus = "moving";
		}
		else if (this.mouseStatus == "up"){
			this.mouseStatus = "hover";
		}

		// guess action
		if (this.mouseStatus == "moving"){
			if (this.mode == null){
				if (this.canvas.isDrawChar(this.canvas.getPixel(this.canvas.getSelectedCell()))){
						this.mode = "resizing";
				}	else {
						this.mode = "boxing";
				}
			}
		} else {
			this.mode = null;
		}

		// check whether the user is drawing a box or resizing it
		if (this.mode == "resizing" && this.endPointsInfo != null){
			// debug
			// console.log("Resizing..."+ this.endPointsInfo.length);
			// reset previous resizing data
			this.canvas.rollback();
			// what we are doing?
			var action = null;
			// detect whether we are moving a line or doing something else
			if (this.endPointsInfo.length == 2 && this.endPointsInfo[0].contextLength == 1 && this.endPointsInfo[1].contextLength == 1
				&& this.endPointsInfo[0].position.hasSameAxis(this.endPointsInfo[1].position)){
				action = "moving-line";
			} else if (this.endPointsInfo.length == 2 && this.endPointsInfo[0].contextLength == 2 && this.endPointsInfo[1].contextLength == 2
				&& this.endPointsInfo[0].childEndpoints.length > 0 && this.endPointsInfo[1].childEndpoints.length > 0
				&& this.endPointsInfo[0].childEndpoints[0].position.hasSameAxis(this.endPointsInfo[1].childEndpoints[0].position)){
				if (this.endPointsInfo[0].childEndpoints[0].position.equals(this.endPointsInfo[1].childEndpoints[0].position)){
					action = "resizing-box";
				} else{
					action = "resizing-side";
				}
			}

			if (action == "moving-line"){
				console.log("Moving line from '"+this.startCoord+"' to '"+coord.substract(this.startCoord)+"'...");
				ep1 = this.endPointsInfo[0], ep2 = this.endPointsInfo[1];
				this.canvas.drawLine(ep1.position, ep2.position, ep1.isHorizontal, "", true);
				this.canvas.drawLine(ep1.position.add(coord.substract(this.startCoord)), ep2.position.add(coord.substract(this.startCoord)), ep1.isHorizontal, "-", false);
				// this.canvas.moveArea(new Box(ep1.position,ep2.position), coord.substract(this.startCoord));
			}	else if (action == "resizing-side"){
				// delete the lines we are resizing ("" so its no drawn as uncommited change)
				this.canvas.drawLine(this.startCoord, this.endPointsInfo[0].childEndpoints[0].position, this.endPointsInfo[0].isHorizontal, "", true);
				this.canvas.drawLine(this.startCoord, this.endPointsInfo[1].childEndpoints[0].position, this.endPointsInfo[1].isHorizontal, "", true);
				// draw lines at new position, displacing only over 1 coordinate if moving a side
				sideCoord = this.endPointsInfo[0].isHorizontal? new Coord(this.startCoord.x, coord.y) : new Coord(coord.x, this.startCoord.y);
				this.canvas.drawLine(sideCoord, this.endPointsInfo[0].childEndpoints[0].position, this.endPointsInfo[0].isHorizontal, "+", false);
				this.canvas.drawLine(sideCoord, this.endPointsInfo[1].childEndpoints[0].position, this.endPointsInfo[1].isHorizontal, "+", false);
			}	else if (action == "resizing-box"){
				// delete the lines we are resizing ("" so its no drawn as uncommited change)
			  this.canvas.drawLine(this.startCoord, this.endPointsInfo[0].childEndpoints[0].position, this.endPointsInfo[0].isHorizontal, "", true);
				this.canvas.drawLine(this.startCoord, this.endPointsInfo[1].childEndpoints[0].position, this.endPointsInfo[1].isHorizontal, "", true);
				// draw lines at new position
				this.canvas.drawLine(coord, this.endPointsInfo[0].childEndpoints[0].position, this.endPointsInfo[0].isHorizontal, "+", false);
				this.canvas.drawLine(coord, this.endPointsInfo[1].childEndpoints[0].position, this.endPointsInfo[1].isHorizontal, "+", false);

				// draw arrows in case
			  /*for (endPointIdx in endPointsInfo) {
			    if (this.endPointsInfo[endPointIdx].startWithArrow) this.canvas.stackPixel(coord, "^");
					if (this.endPointsInfo[endPointIdx].endWithArrow) this.canvas.stackPixel(this.endPointsInfo[endPointIdx].position, "^");
			    this.endPointsInfo[endPointIdx].endWithArrow2 && this.canvas.stackPixel(new Coord(this.endPointsInfo[endPointIdx].isHorizontal ?
			      this.endPointsInfo[endPointIdx].position.x : coord.x, this.endPointsInfo[endPointIdx].isHorizontal ? coord.y : this.endPointsInfo[endPointIdx].position.y), "^");
			  }*/
			}
			this.canvas.setChanged(true);
		}	else if (this.mode == "boxing"){
			// reset stack so we start drawing box every time the user moves the mouse
			this.canvas.getGrid().rollback();
			// draw horizontal line first, then vertical line
			this.canvas.drawLine(this.startCoord, coord, true, '+', false);
			// draw vertical line first, then horizontal line
			this.canvas.drawLine(this.startCoord, coord, false, '+', false);
			// update canvas
			this.canvas.setChanged(true)
		}
	}
	/*
 	 * When the user releases the mouse, we know the second coordinate so we draw the box
 	 */
	, cellUp : function(coord) {
		this.canvas.cellUp(coord);
		this.startCoord = null;
		if (this.canvas.getActiveTool() != this.toolId) return;

		if (this.mode == "boxing"){
			// user has the mouse-up (normal situation)
		} else if (this.mode == "resizing"){
			// user has finished resizing
		} else{
			// if user is leaving the canvas, reset stack
			this.canvas.getGrid().rollback();
		}
		// perform changes
		this.canvas.getGrid().commit();

		// update status
		this.mouseStatus = "up";
		this.mode = null;

		// update canvas
		this.canvas.setChanged(true);
	}
	/**
 	 * If the mouse leaves the canvas, we dont want to draw nothing
 	 */
	, canvasMouseLeave : function() {
		return this.canvas.canvasMouseLeave();
		if (this.canvas.getActiveTool() == this.toolId){
			this.canvas.getGrid().rollback();
		}
		this.mouseStatus = "out";
	}
	, cursor : function() {
		return "crosshair";
	}
}

/**
 * This tool allows exporting the grid text so user can copy/paste from there
 */
function ExportASCIITool(canvas, toolId, canvasWidgetSelectorId, widgetSelectorId){
	this.canvas = canvas;
	this.toolId = toolId;
	this.canvasWidget = $(canvasWidgetSelectorId);
	this.exportWidget = $(widgetSelectorId);
	this.mode = 0;
	this.init();
}

ExportASCIITool.prototype = {
	init : function(){
		$(this.widget).hide();
		$("#dialog-textarea").keyup(function(event) {
			if (event.keyCode == KeyEvent.DOM_VK_ESCAPE){
				if (this.mode == 1){
					this.close();
					return;
				}
				return;
			}
		}.bind(this));
		/*$("#dialog-widget-close").click(function() {
			this.close();
		}.bind(this));*/
	}
	, click : function(elementId){
		this.canvas.click(elementId);
		if (this.canvas.getActiveTool() != this.toolId) return;
		if (this.mode == 1){
			this.close();
			return;
		}
		$("#dialog-textarea").val(this.canvas.getGrid().export());
		$(this.canvasWidget).hide();
		this.mode = 1;
    $(this.exportWidget).show();
    /*$("#dialog-textarea").focus(function(){
			var $this = $(this);
	    $this.select();
		});*/
  }
  , close : function() {
		$(this.exportWidget).hide();
		$(this.canvasWidget).show();
		$("#dialog-textarea").val("");
		this.mode = 0;
	}
}

//------------------------------------------------- MOUSE CONTROLLER ------------------------------------------------//

function MouseController(canvas) {
	this.class = 'MouseController';
	this.canvas = canvas;
	this.canvasHTML = canvas.getCanvasHTML();
	this.init();
	this.setActiveElement("select-button");
	this.lastPointerCoord = null;
}

MouseController.prototype = {
	init : function() {
		$("#tools > button.tool").click(function(eventObject) {
			// get id of clicked button
			elementId = eventObject.target.id;
			// visual effect: set active button
			this.setActiveElement(elementId);
			// invoke tool
			this.canvas.click(elementId);
		}.bind(this));
		// bind mouse action for handling the drawing
		$(this.canvas.getCanvasHTML()).mousedown(function(eventObject) {
			// propagate event
			this.canvas.mouseDown(eventObject);
			this.lastPointerCoord = this.getGridCoord(eventObject);
			this.canvas.cellDown(this.lastPointerCoord);
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mouseup(function() {
			// propagate event
			this.canvas.mouseUp();
			this.canvas.cellUp(this.lastPointerCoord);
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mouseenter(function() {
			this.canvas.getCanvasHTML().style.cursor = this.canvas.cursor();
			this.canvas.mouseEnter();
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mousemove(function(eventObject) {
			// propagate event
			this.canvas.mouseMove(eventObject);
			this.lastPointerCoord = this.getGridCoord(eventObject);
			this.canvas.cellMove(this.lastPointerCoord);
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mouseleave(function() {
			this.canvas.canvasMouseLeave();
		}.bind(this));
		$(window).keydown(function(eventObject) {
			this.canvas.keyDown(eventObject);
		}.bind(this));
		$(document).keypress(function(eventObject) {
			this.canvas.keyPress(eventObject);
		}.bind(this));
		$(window).keyup(function(eventObject) {
			this.canvas.keyUp(eventObject);
		}.bind(this));
	}
	,setActiveElement : function(elementId){
		// toggle active button (visual feature only)
		$("#tools > button.tool").removeClass("active");
		$("#" + elementId).toggleClass("active");
	}
	, getGridCoord: function(mouseEvent){
		// get HTML canvas relative coordinates
		canvasHTMLCoord = this.getCanvasHTMLCoord(mouseEvent);
		// get canvas coord
		return this.canvas.getGridCoord(canvasHTMLCoord);
	}
	, getCanvasHTMLCoord : function(mouseEvent){
		var x;
		var y;
		if (mouseEvent.pageX || mouseEvent.pageY) {
			x = mouseEvent.pageX;
			y = mouseEvent.pageY;
		}	else {
			x = mouseEvent.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = mouseEvent.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		x -= this.canvasHTML.offsetLeft;
		y -= this.canvasHTML.offsetTop;
		// are we inside a scrollable div?
		// TODO: should this be handled by MovableTool? (it know there is a container)
		var parent = $(this.canvasHTML).parent();
		if (parent){
			x += parent.scrollLeft();
			y += parent.scrollTop();
		}
		return new Coord(x,y);
	}
}

// ---------------------------------------------------- INIT ------------------------------------------------------- //

/*
 * Initialize canvas and use the Decorator Pattern to add more features (single responsability chain).
 * In order to implement Decorator Pattern, I use jquery to extend objects ($.extend()).
 * Since the wrapper mechanism is emulated (based on copying object properties), I have to make use of this.$ variable to reference the real 'this'.
 */
function init(){

	var grid = new Grid();

	// initialize canvas
	var canvas = delegateProxy(new ASCIICanvas(document.getElementById("ascii-canvas"),grid),"grid");
	// add canvas movability
	canvas = delegateProxy(new MovableCanvas(canvas, "#canvas-container"), "canvas");
	// add canvas zoom feature
	canvas = delegateProxy(new ZoomableCanvas(canvas), "canvas");
	// add click, keyboard & mouse capabilities
	canvas = delegateProxy(new ToolableCanvas(canvas), "canvas");
	// add ascii drawing capabilities
	canvas = delegateProxy(new DrawableCanvas(canvas), "canvas");
	// add ascii drawing capabilities with style
	canvas = delegateProxy(new StylableCanvas(canvas), "canvas");
	// add cursor decorator
	canvas = delegateProxy(new PointerDecorator(canvas, "pointer-button"), "canvas");
	// add selection capabilities
	canvas = delegateProxy(new SelectTool(canvas, "select-button"), "canvas");
	// add char writing capabilities
	canvas = delegateProxy(new CharWriterDecorator(canvas), "canvas");
	// add clear canvas capabilities
	canvas = delegateProxy(new ClearCanvasTool(canvas, "clear-button"), "canvas");
	// add set/edit text capabilities
	canvas = delegateProxy(new TextEditTool(canvas, "text-button"), "canvas");
	// add draw box capabilities
	canvas = delegateProxy(new BoxDrawerTool(canvas, "box-button"), "canvas");
	// add export capabilities
	canvas = delegateProxy(new ExportASCIITool(canvas, "export-button", "#canvas-container", "#dialog-widget"), "canvas");
	// initialize mouse controller
	new MouseController(canvas);
	// visual only: adapt canvas container
	$("#canvas-container").width(canvas.getWidth());
	// select first cell, so user can start writing right from start
	canvas.setSelectedCell(new Coord(0,0));
	// start animation loop
	animate(canvas);
}

function animate(canvas){
	if (canvas.hasChanged()){
		canvas.redraw();
		canvas.setChanged(false);
	}
	window.requestAnimationFrame(function() {
		animate(canvas);
	});
}
