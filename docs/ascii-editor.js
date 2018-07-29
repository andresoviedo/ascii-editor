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
	, getLength : function() {
	  return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	, clone : function() {
		return new Coord(this.x, this.y);
	}
	, hasSameAxis : function(other) {
		return this.x == other.x || this.y == other.y;
	}
	, isOppositeDir: function(other){
		return this.add(other).getLength() == 0;
	}
}

// Basic constants
var zeroCoord = new Coord(0,0), leftCoord = new Coord(-1, 0), rightCoord = new Coord(1, 0), topCoord = new Coord(0, -1), bottomCoord = new Coord(0, 1);
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
				this.stackPixel(pixelCoord2, pixelValue != null? pixelValue : pixelValue2 != null && pixelValue2 != ""? pixelValue2 : " ");
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
	this.midX = Math.floor((this.maxX + this.minX) / 2)
	this.midY = Math.floor((this.maxY + this.minY) / 2)
	this.mid = new Coord(this.midX, this.midY);
}

Box.prototype = {
	contains : function(coord){
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
		return "Box: ('"+this.min+"'->'"+this.max+"', mid:"+this.mid+")";
	}
}

/**
 * Encapsulates data for the surrounding pixels
 */
class PixelContext {
	constructor(left, right, top, bottom){
		this.class = 'PixelContext';
		this.left = left;
		this.right = right;
		this.bottom = bottom;
		this.top = top;
		this.length = this.left + this.right + this.bottom + this.top;
	}
	getLength() {
		return this.length;
	}
	toString() {
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
	, mouseLeave : function(){
		this.canvas.mouseLeave();
		this.setPointerCell(null);
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
		if (eventObject.keyCode == KeyEvent.DOM_VK_LEFT){
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

// ---------------------------------------------- CANVAS CHAR DECORATOR -------------------------------------------- //

/**
 * This tool handles the cursor position & movement (arrow keys) and pointer hovering.
 * This tool also supports the writing and the edition of the text (Backspace & Delete are supported)
 */
function WritableCanvas(canvas){
	this.class = "WritableCanvas";
	this.canvas = canvas;
}

WritableCanvas.prototype = {

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
			if (this.canvas.getPixel(this.canvas.getSelectedCell().add(leftCoord)) != undefined){
				this.canvas.setSelectedCell(this.canvas.getSelectedCell().add(leftCoord));
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
		// jump to next line
		else if (eventObject.keyCode == KeyEvent.DOM_VK_RETURN){
			var startOfText = this.canvas.getTextColStart(this.canvas.getSelectedCell());
			if (startOfText && startOfText.add(bottomCoord)){
				this.canvas.setSelectedCell(startOfText.add(bottomCoord));
			}
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

// -------------------------------------------- MOVABLE CANVAS DECORATOR ------------------------------------------- //

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

// ---------------------------------------------- CANVAS TOOL ------------------------------------------------------ //

/**
 * Abstract tool
 */
class CanvasTool {
	constructor(toolId){
		this.toolId = toolId;
		this.enabled = false;
	}
	getId(){ return this.toolId; }
	isEnabled(){ return this.enabled; }
	setEnabled(enabled){ this.enabled = enabled; }
	click() {}
	mouseDown(eventObject) {	}
	mouseMove(eventObject) {	}
	mouseUp() {	}
	mouseEnter() { }
	mouseLeave() { }
	cellDown(coord) { }
	cellMove(coord) { }
	cellUp(coord) { }
	keyDown(eventObject){	}
	keyPress(eventObject){ }
	keyUp(eventObject){ }
	cursor(){}
}

// ---------------------------------------------- MOVE FEATURE ----------------------------------------------------- //

class SelectTool extends CanvasTool {
	constructor(toolId, canvas){
		super(toolId);
		this.canvas = canvas;
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
	cursor(){
		return "pointer";
	}
	hasChanged(){
		return this.canvas.hasChanged() || this.changed;
	}
	setChanged(changed){
		this.canvas.setChanged(changed)
		this.changed = changed;
	}
	keyDown(eventObject){
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
	keyUp(eventObject){
		// capture control key event
		if (eventObject.keyCode == KeyEvent.DOM_VK_CONTROL){
			this.controlKeyEnabled = false;
		}
	}
	cellDown(coord){
		this.startCoord = coord;
		this.startTime = this.currentTime = new Date().getTime();
		this.mouseStatus = "down";
		this.process();
	}
	cellMove(coord){
		this.currentCoord = coord;
		this.currentTime = new Date().getTime();
		this.mouseStatus = this.mouseStatus == "down" || this.mouseStatus == "dragging"? "dragging" : "hover";
		this.process();
	}
	cellUp(coord){
		this.currentCoord = coord;
		this.currentTime = new Date().getTime();
		this.mouseStatus = "up";
		this.process();
	}
	mouseLeave(){
		this.mouseStatus = "leave";
		this.process();
	}
	process(){
		var coord = this.currentCoord;
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
	getNextAction(){
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
		if (this.mouseStatus == "leave") return "rollback";
		return undefined;
	}
	selectArea (coord){
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
 			if (this.finalBox == null || !this.finalBox.contains(coord)){
				this.finalBox = null;
				this.selectionArea = null;
				this.canvas.rollback();
			}
			// user is going to move the selection
			return;
		}

		if (this.mouseStatus == "dragging") {
			// user is moving selection
			if (this.finalBox != null && this.finalBox.contains(coord)	|| this.finalMove != null && this.finalMove.contains(coord)){
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
			for (var minX = this.selectionArea.minX; minX <= this.selectionArea.maxX; minX++) {
				for (var minY = this.selectionArea.minY; minY <= this.selectionArea.maxY; minY++) {
					var pixelCoord = new Coord(minX, minY);
					var pixelValue = this.canvas.getPixel(pixelCoord).getValue();
					this.canvas.stackPixel(pixelCoord, pixelValue != null? pixelValue : " ");
				}
			}
		}
		this.changed = true;
	}
	selectShape (coord){
		if (this.mouseStatus == "down") {
				this.endPointsInfo = this.canvas.detectEndPoints(this.startCoord);
				this.selectedBox = this.detectBox(coord);
				this.detectConnectedBoxes(this.selectedBox);
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
		this.drawConnections(this.selectedBox,zeroCoord,"");
		this.canvas.moveArea(this.selectedBox.box,coord.substract(this.startCoord));
		this.drawConnections(this.selectedBox,coord.substract(this.startCoord),"-");
		this.changed = true;
	}
	detectBox(coord){
		var boxPoints = this.canvas.detectBox(coord);
		if (boxPoints == null) return null;
		var box = this.canvas.getBox(boxPoints);
		var endPoints = this.canvas.getEndPoints(boxPoints);
		// for (var point in boxPoints){ this.canvas.stackPixel(boxPoints[point],'-');	} // debug
		// this.canvas.stackPixel(box.min,'+'); this.canvas.stackPixel(box.max,'+'); // debug
		// for (var point in endPoints){ this.canvas.stackPixel(endPoints[point],'+');	} // debug
		return new BoxInfo(boxPoints, box, endPoints);
	}
	detectConnectedBoxes(boxInfo){
		if (boxInfo == null || boxInfo.connectors.length == 0) return; // no T or + connections
		var connectors = boxInfo.connectors;
		var connections = boxInfo.connections;
		for (var i in connectors){
			var start = connectors[i];
			for (var j in contextCoords){
				var dir = contextCoords[j];
				var next = start.add(dir);
				if (boxInfo.box.contains(next)) continue;
				var linePoints = this.canvas.getLinePoints(start, dir)
				/*for (var k in linePoints){
					this.canvas.stackPixel(linePoints[k],'?');
				}*/
				if (linePoints == null) continue; // error somewhere!
				connections.push(new Connection(linePoints));
			}
		}
	}
	detectBox_with_endPoints(coord){
		// detect corner endpoints & connection endpoints
		var cornerEndPoints = [];
		var connectionEndPoints = [];
		if (this.endPointsInfo.length >= 2){
			for (var endPointIdx in endPointsInfo){
				var endPointInfo = endPointsInfo[endPointIdx];
				if (endPointInfo.isCorner()){
					cornerEndPoints.push(endPointInfo);
				} else if (endPointInfo.context.length >= 3){
					connectionEndPoints.push(endPointInfo);
				}
				if (endPointInfo.childEndpoints.length > 0){
					for (var endPointIdx2 in endPointInfo.childEndpoints){
						var endPointInfo2 = endPointInfo.childEndpoints[endPointIdx2];
						if (endPointInfo2.context.length >= 3){
							connectionEndPoints.push(endPointInfo2);
						}
					}
				}
			}
		}
		// we need at least 2 corners to start detecting the box
		if (cornerEndPoints.length < 2) return;
		var epCorner1 = cornerEndPoints[0], epCorner2 = cornerEndPoints[1];
		// get child corners
		var childCorners1 = epCorner1.getCorners(), childCorners2 = epCorner2.getCorners();
		if (!childCorners1 || !childCorners2 || childCorners1.length == 0 || childCorners2.length == 0) return;
		// we need both childs to be in the same axis
		if (!childCorners1[0].position.hasSameAxis(childCorners2[0].position)) return;
		// test whether the clicked coord its in a corner
		var startCoordIsCorner = epCorner1.isHorizontal != epCorner2.isHorizontal;
		// test if both childs are the opposite corner
		if (startCoordIsCorner && childCorners1[0].position.equals(childCorners2[0].position)){
			console.log("Detected box type 1");
			return new BoxInfo(new Box(null, this.startCoord,childCorners1[0].position),connectionEndPoints);
		}
		// test whether the user click on a side of the box
		if (!startCoordIsCorner && this.canvas.isDrawCharArea(new Box(childCorners1[0].position,childCorners2[0].position))){
			console.log("Detected box type 2");
			return new BoxInfo(new Box(null, epCorner1.position, childCorners2[0].position),connectionEndPoints);
		}
		return null;
	}
	detectConnectedBoxes_with_endpoints(boxInfo){
		if (boxInfo == null) return null;
		var connectorEndPoints = boxInfo.connectors;
		var possibleBoxEndpoints = [];
		for (var endPointIdx in connectorEndPoints){
			var endPoint = connectorEndPoints[endPointIdx];
			// TODO: handle tables
			if (endPoint.context.length == 3){
				var tDirection = this.getTDirection(endPoint.context);
				var possibleBoxConnection = this.canvas.getLinePoints(endPoint.position, tDirection);
				if (possibleBoxConnection != null){
					boxInfo.connections.push(new Connection(possibleBoxConnection));
				}
			}
		}
	}
	getTDirection(pixelContext){
		if (pixelContext.length != 3) throw new Error("This is not a T connected pixel");
		if (!pixelContext.left) return rightCoord;
		if (!pixelContext.right) return leftCoord;
		if (!pixelContext.top) return bottomCoord;
		if (!pixelContext.bottom) return topCoord;
	}
	drawConnections(boxInfo,coordDiff,value){
		if (boxInfo == null || boxInfo.connections.length == 0) return;
		for (var i in boxInfo.connections){
			var connection = boxInfo.connections[i];
			var horizontalLength = connection.getDirection().add(rightCoord).getLength();
			var horizontalLength2 = connection.getEndDirection().add(rightCoord).getLength();
			var dir = horizontalLength == 0 || Math.abs(horizontalLength) >= 2;
			var dir2 = horizontalLength2 == 0 || Math.abs(horizontalLength2) >= 2;
			var lineType = null;
			if (dir && dir2) lineType = "horizontal-horizontal";
			if (!dir && !dir2) lineType = "vertical-vertical";
			if (dir && !dir2) lineType = "horizontal-vertical";
			if (!dir && dir2) lineType = "vertical-horizontal";
			this.canvas.drawLine(connection.points[0].add(coordDiff), connection.points[connection.points.length-1], lineType, value);
		}
	}
}

// ------------------------------------------------- TOOLS DECORATORS ---------------------------------------------- //

class ClearCanvasTool extends CanvasTool {
	constructor(toolId, canvas){
		super(toolId);
		this.canvas = canvas;
	}
	click(){
		this.canvas.clear();
		this.canvas.commit();
	}
}

class EditTextTool extends CanvasTool {
	constructor(toolId,canvas){
		super(toolId);
		this.canvas = canvas;
		this.mouseCoord = null;
	 	this.startCoord = null;
	 	this.currentText = null;
	 	this.init();
	}
	init(){
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
	mouseDown(eventObject) {
		this.mouseCoord = eventObject;
	}
	cellDown(startCoord) {
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
	refresh() {
		var newValue = $("#text-input").val();
		this.canvas.rollback();
		if (this.currentText != null){
			this.canvas.getGrid().import(this.currentText.replace(/./g," "),this.startCoord);
		}
		try{
			this.canvas.getGrid().import(newValue,this.startCoord);
		}catch(e){
			console.log(e.stack);
		}
		this.canvas.setChanged(true);
	}
	close() {
		$("#text-input").val("");
		$("#text-widget").hide();
		this.canvas.getGrid().rollback();
	}
	cursor() {
  	return "text";
	}
}

class EndPointInfo {
	constructor(position,context,isHorizontal,startWithArrow, endWithArrow, endWithArrow2){
	  this.class = "EndPointInfo";
	  this.position = position;
		this.context = context;
	  this.isHorizontal = isHorizontal;
	  this.startWithArrow = startWithArrow;
	  this.endWithArrow = endWithArrow;
	  this.endWithArrow2 = endWithArrow2;
		this.childEndpoints = null;
	}
	isCorner(){
		return this.context.length == 2 && this.context.bottom != this.context.top && this.context.left != this.context.rigth;
	}
	getCorners(){
		if (this.childEndpoints == null) return null;
		var cornerEndPoints = [];
		for (var endPointIdx in this.childEndpoints){
			if (this.childEndpoints[endPointIdx].isCorner()){
				cornerEndPoints.push(this.childEndpoints[endPointIdx]);
			}
		}
		return cornerEndPoints;
	}
	toString(){
		return "EndPointInfo: position '"+this.position+"', context '"+this.context+"', isHorizontal '"+this.isHorizontal
		+"', startWithArrow '"+this.startWithArrow+"', endWithArrow '"+this.endWithArrow+"', endWithArrow2 '"+this.endWithArrow2
		+"', childEndpoints '"+this.childEndpoints+"'";
	}
}

class BoxInfo {
	constructor(points, box,connectors){
		this.points = points;
		this.box = box;
		this.connectors = connectors;
		this.connections = [];
	}
}

class Connection {
	constructor(points){
		this.points = points;
	}
	getDirection(){
		return this.points[1].substract(this.points[0]);
	}
	getEndDirection(){
		return this.points[this.points.length-1].substract(this.points[this.points.length-2]);
	}
}

/**
 * This is the function to draw boxes. Basically it needs 2 coordinates: startCoord and endCoord.
 */
class BoxDrawerTool extends CanvasTool {
	constructor(toolId,canvas) {
		super(toolId);
		this.canvas = canvas;
		this.startCoord = null;
		this.endCoord = null;
		this.mouseStatus = null;
		this.mode = null;
		this.endPointsInfo = null;
	}
	cellDown(coord) {
		this.mouseStatus = "down";
		this.startCoord = coord;
		this.endPointsInfo = this.canvas.detectEndPoints(coord);
	}
	cellMove(coord) {
		// reset previous resizing data
		this.canvas.rollback();

		if (this.startCoord == null) {
			if (this.mouseStatus == null && this.mode == null){
				if (this.canvas.isDrawChar(this.canvas.getPixel(this.canvas.getPointerCell()))){
					this.endPointsInfo = this.canvas.detectEndPoints(coord);
					if (this.endPointsInfo != null){
						if (this.endPointsInfo.length == 2 && this.endPointsInfo[0].context.length == 1 && this.endPointsInfo[1].context.length == 1
							&& this.endPointsInfo[0].position.hasSameAxis(this.endPointsInfo[1].position)){
							var ep1 = this.endPointsInfo[0], ep2 = this.endPointsInfo[1];
							console.log("Highlighting line from '"+ep1.position+"' to '"+ep2.position+"'...");
							this.canvas.drawLine(ep1.position, ep2.position, ep1.isHorizontal, "+", true);
						}
					}
				}
			}
			return;
		};

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

			// what we are doing?
			var action = null;
			// detect whether we are moving a line or doing something else
			if (this.endPointsInfo.length == 2 && this.endPointsInfo[0].context.length == 1 && this.endPointsInfo[1].context.length == 1
				&& this.endPointsInfo[0].position.hasSameAxis(this.endPointsInfo[1].position)){
				action = "moving-line";
			} else if (this.endPointsInfo.length == 2 && this.endPointsInfo[0].context.length == 2 && this.endPointsInfo[1].context.length == 2
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
				var ep1 = this.endPointsInfo[0], ep2 = this.endPointsInfo[1];
				this.canvas.drawLine(ep1.position, ep2.position, ep1.isHorizontal, "", true);
				this.canvas.drawLine(ep1.position.add(coord.substract(this.startCoord)), ep2.position.add(coord.substract(this.startCoord)), ep1.isHorizontal, "-", false);
				// this.canvas.moveArea(new Box(ep1.position,ep2.position), coord.substract(this.startCoord));
			}	else if (action == "resizing-side"){
				// delete the lines we are resizing ("" so its no drawn as uncommited change)
				this.canvas.drawLine(this.startCoord, this.endPointsInfo[0].childEndpoints[0].position, this.endPointsInfo[0].isHorizontal, "", true);
				this.canvas.drawLine(this.startCoord, this.endPointsInfo[1].childEndpoints[0].position, this.endPointsInfo[1].isHorizontal, "", true);
				// draw lines at new position, displacing only over 1 coordinate if moving a side
				var sideCoord = this.endPointsInfo[0].isHorizontal? new Coord(this.startCoord.x, coord.y) : new Coord(coord.x, this.startCoord.y);
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
	cellUp(coord) {
		// When the user releases the mouse, we know the second coordinate so we draw the box
		this.startCoord = null;

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
		this.mouseStatus = null;
		this.mode = null;

		// update canvas
		this.canvas.setChanged(true);
	}
	mouseLeave() {
		// If the mouse leaves the canvas, we dont want to draw nothing
		this.canvas.getGrid().rollback();
		this.mouseStatus = "out";
	}
	cursor() {
		return "crosshair";
	}
}

class LineTool extends CanvasTool {
	constructor(toolId, canvas){
		super(toolId);
		this.canvas = canvas;
		this.startCoord = null;
		this.mouseStatus = null;
	}
	cellDown(coord) {
		this.mouseStatus = "down";
		this.startCoord = coord;
	}
	cellMove(coord) {
		if (this.mouseStatus == "down"){
			this.canvas.rollback();
			this.canvas.drawLine(this.startCoord, coord, "best", "-");
		}
	}
	cellUp(){
		// perform changes
		this.canvas.getGrid().commit();
		// update status
		this.mouseStatus = "up";
		// update canvas
		this.canvas.setChanged(true);
	}
}

/**
 * This tool allows exporting the grid text so user can copy/paste from there
 */
class ExportASCIITool extends CanvasTool {
 	constructor(toolId, canvas, canvasWidgetSelectorId, widgetSelectorId){
		super(toolId);
		this.canvas = canvas;
		this.toolId = toolId;
		this.canvasWidget = $(canvasWidgetSelectorId);
		this.exportWidget = $(widgetSelectorId);
		this.mode = 0;
		this.init();
	}
	init(){
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
	click(){
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
  close() {
		$(this.exportWidget).hide();
		$(this.canvasWidget).show();
		$("#dialog-textarea").val("");
		this.mode = 0;
	}
}
//------------------------------------------------- MOUSE CONTROLLER ------------------------------------------------//

function CanvasController(canvas) {
	this.class = 'CanvasController';
	this.canvas = canvas;
	this.tools = {};
	this.shiftKeyEnabled = false;
	this.dummyTool = new CanvasTool();
	this.canvasHTML = canvas.getCanvasHTML();
	this.init();
	this.lastPointerCoord = null;
	// visual only: adapt canvas container
	$("#canvas-container").width(this.canvas.getWidth());
	// select first cell, so user can start writing right from start
	this.canvas.setSelectedCell(new Coord(0,0));
}

CanvasController.prototype = {
	init : function() {
		$("#tools > button.tool").click(function(eventObject) {
			// active tool
			this.setActiveTool(eventObject.target.id);
		}.bind(this));
		// bind mouse action for handling the drawing
		$(this.canvas.getCanvasHTML()).mousedown(function(eventObject) {
			// propagate event
			this.canvas.mouseDown(eventObject);
			this.lastPointerCoord = this.getGridCoord(eventObject);
			this.canvas.cellDown(this.lastPointerCoord);
			// invoke active tool
			try{
				this.getActiveTool().mouseDown(eventObject);
				this.getActiveTool().cellDown(this.lastPointerCoord);
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mouseup(function() {
			// propagate event
			this.canvas.mouseUp();
			this.canvas.cellUp(this.lastPointerCoord);
			try{
				this.getActiveTool().mouseUp();
				this.getActiveTool().cellUp(this.lastPointerCoord);
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mouseenter(function() {
			this.canvas.getCanvasHTML().style.cursor = this.canvas.cursor();
			this.canvas.mouseEnter();
			try{
				this.getActiveTool().mouseEnter();
				this.canvas.getCanvasHTML().style.cursor = this.getActiveTool().cursor();
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mousemove(function(eventObject) {
			// propagate event
			this.canvas.mouseMove(eventObject);
			this.lastPointerCoord = this.getGridCoord(eventObject);
			this.canvas.cellMove(this.lastPointerCoord);
			try{
				this.getActiveTool().mouseMove(eventObject);
				this.getActiveTool().cellMove(this.lastPointerCoord);
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mouseleave(function() {
			this.canvas.mouseLeave();
			try{
				this.getActiveTool().mouseLeave();
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(window).keydown(function(eventObject) {
			if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
				this.shiftKeyEnabled = true;
			}
			this.canvas.keyDown(eventObject);
			try{
				this.getActiveTool().keyDown(eventObject);
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(document).keypress(function(eventObject) {
			this.canvas.keyPress(eventObject);
			try{
				this.getActiveTool().keyPress(eventObject);
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(window).keyup(function(eventObject) {
			if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
				this.shiftKeyEnabled = false;
			}
			this.canvas.keyUp(eventObject);
			try{
				this.getActiveTool().keyUp(eventObject);
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
	}
	,addTool : function(tool){
		this.tools[tool.getId()] = tool;
	}
	,getActiveTool : function(){
		if (this.shiftKeyEnabled) return this.dummyTool;
		for (var tool in this.tools){
			if (this.tools[tool].isEnabled()){
					return this.tools[tool];
			}
		}
		return null;
	}
	,setActiveTool : function(elementId){
		try {
			// toggle active button (visual feature only)
			$("#tools > button.tool").removeClass("active");
			$("#" + elementId).toggleClass("active");
			// enable tool
			for (var tool in this.tools){
				this.tools[tool].setEnabled(this.tools[tool].getId() == elementId);
			}
			this.getActiveTool().click();
		}catch(e){
			console.error(e.stack);
		}
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
	// initialize grid
	var grid = new Grid();
	// initialize canvas
	var canvas = delegateProxy(new ASCIICanvas(document.getElementById("ascii-canvas"),grid),"grid");
	// add canvas movability
	canvas = delegateProxy(new MovableCanvas(canvas, "#canvas-container"), "canvas");
	// add canvas zoom feature
	canvas = delegateProxy(new ZoomableCanvas(canvas), "canvas");
	// add ascii drawing capabilities
	canvas = delegateProxy(new DrawableCanvas(canvas), "canvas");
	// add ascii drawing capabilities with style
	canvas = delegateProxy(new StylableCanvas(canvas), "canvas");
	// add cursor decorator
	canvas = delegateProxy(new PointerDecorator(canvas, "pointer-button"), "canvas");
	// add char writing capabilities
	canvas = delegateProxy(new WritableCanvas(canvas), "canvas");
	// instantiate canvas controller (mouse control, keyboard control, tools, etc)
	var controller = new CanvasController(canvas);
	// add clear canvas capabilities
	controller.addTool(new ClearCanvasTool("clear-button",canvas));
	// add set/edit text capabilities
	controller.addTool(new EditTextTool("text-button",canvas));
	// add export to ascii capabilities
	controller.addTool(new ExportASCIITool("export-button", canvas, "#canvas-container", "#dialog-widget"));
	// add draw box capabilities
	controller.addTool(new BoxDrawerTool("box-button", canvas));
	// add line drawing capabilities
	controller.addTool(new LineTool("line-button", canvas));
	// add selection capabilities
	controller.addTool(new SelectTool("select-button", canvas));
	// set default tool
	controller.setActiveTool("select-button");
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
