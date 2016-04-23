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

// Basic constants
var leftCoord = new Coord(-1, 0), rightCoord = new Coord(1, 0), topCoord = new Coord(0, -1), bottomCoord = new Coord(0, 1);

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

// Location where the user has made click, so we can show widgets at that point
var clickCoords = null;


//------------------------------------------------- GRID CLASSES ----------------------------------------------------//

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
	, add : function(a) {
		return new Coord(this.x + a.x, this.y + a.y);
	}
}

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
				this.import(previousData, new Coord(0,0));
				this.commit();
			}
		}
	}
	/**
	 * Return the pixel located at the specified coord
	 */
	, getPixel : function(coord) {
		if (coord.x < 0 || coord.x >= this.cols){
			return undefined;
		}
		if (coord.y < 0 || coord.y >= this.rows){
			return undefined;
		}
		return this.matrix[coord.x][coord.y];
	}
	/**
	 * Clears/reset the whole matrix of pixels
	 */
	 , clear : function() {
		for (var a = 0;a < this.matrix.length;a++) {
			for (var b = 0;b < this.matrix[a].length;b++) {
				this.matrix[a][b].clear();
			}
		}
		this.changed = true;
	}
	, stackPixel : function(coord, value) {
		var pixel = this.getPixel(coord);
		this.pixelsStack.push(new PixelPosition(coord, pixel));
		pixel.tempValue = value;
		this.changed = true;
	}
	, savePixel : function(coord, value) {
		if (this.getPixel(coord).getValue() != value){
			this.stackPixel(coord, value);
		}
	}
	/**
	 * Clears the stack so we have no temporary pixels to be drawn
	 */
	, resetStack : function() {
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
	, import : function(text, coord) {
		lines = text.split("\n");
		for (e = 0;e < lines.length;e++) {
			for (var g = lines[e], l = 0;l < g.length;l++) {
				var h = g.charAt(l);
				this.stackPixel(new Coord(l,e).add(coord), h);
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
			pixel.value = newValue == " "? null: newValue;
		}
		this.resetStack();

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
			$("#canvas-container").width(this.getCanvasHTML().width);
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
	, clear : function() {
		this.grid.clear();
		this.grid.commit();
		this.changed = true;
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
	, mouseEnter : function() { }
	, canvasMouseDown : function(coord) {
		this.startCoord = coord;
	}
	, canvasMouseMove : function(coord) { }
	, canvasMouseUp : function() { }
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
		this.changed = true;
		console.log("New canvas size ("+this.grid.cols+","+this.grid.rows+","+this.grid.zoom+") '"+this.canvasHTML.width+"/"+this.canvasHTML.height+"'");
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

		// draw selection
		this.canvasContext.fillStyle = "#669999";
		for (col=0; col<this.grid.cols; col++){
			for (row=0; row<this.grid.rows; row++){
				var pixel = this.grid.getPixel(new Coord(col, row));
				if (pixel != null && pixel.tempValue != null && pixel.tempValue != "" && pixel.tempValue != " "){
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

//--------------------------------------------- DRAW CLASSES --------------------------------------------------------//

/**
 * Calculates the mins and max given 2 coordinates
 */
function Box(coordA, coordB) {
	this.class = 'Box';
	this.minX = Math.min(coordA.x, coordB.x);
	this.minY = Math.min(coordA.y, coordB.y);
	this.maxX = Math.max(coordA.x, coordB.x);
	this.maxY = Math.max(coordA.y, coordB.y);
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
	, drawLine : function(startCoord, endCoord, drawHorizontalFirst, pixelValue) {
		// console.log("Drawing line from "+startCoord+" to "+endCoord+" with value '"+pixelValue+"'...");

		// calculate box so we know from where to where we should draw the line
		var box = new Box(startCoord, endCoord), minX = box.minX, minY = box.minY, maxX = box.maxX, maxY = box.maxY;

		// calculate where to draw the horizontal line
		var yPosHorizontalLine = drawHorizontalFirst ? startCoord.y : endCoord.y
		for (;minX <= maxX; minX++) {
			var newCoord = new Coord(minX, yPosHorizontalLine), pixelContext = this.getPixelContext(new Coord(minX, yPosHorizontalLine));
			this.grid.stackPixel(newCoord, pixelValue);
		}
		// calculate where to draw the vertical line
		var xPosLine = drawHorizontalFirst ? endCoord.x : startCoord.x;
		for (;minY <= maxY; minY++) {
			var newCoord = new Coord(xPosLine, minY), pixelContext = this.getPixelContext(new Coord(xPosLine, minY));
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
}

// ----------------------------------------------- STYLE DECORATOR ------------------------------------------------- //

function StylableCanvas(canvas){
	this.class = "StylableCanvas";
	this.canvas = canvas;
}

StylableCanvas.prototype = {

	drawLine : function(startCoord, endCoord, drawHorizontalFirst, pixelValue) {
		this.canvas.drawLine(startCoord, endCoord, drawHorizontalFirst, pixelValue);
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
	this.toolId;
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
	, setChanged : function(changed){
		this.canvas.setChanged(changed);
		this.changed = changed;
	}
	, hasChanged : function(){
		this.refresh();
		return this.canvas.hasChanged() || this.changed;
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
		if (this.getSelectedCell() == null) return false;
		var shouldDraw = new Date().getMilliseconds() % 1000 < 500;
		var changed = shouldDraw != this.getDrawSelectedCell();
		this.setDrawSelectedCell(shouldDraw);
		this.changed = this.changed || changed;
	}
	, canvasMouseMove : function(coord){
		this.canvas.canvasMouseMove(coord);
		this.setPointerCell(coord);
		this.changed = true;
	}
	, canvasMouseDown : function(coord){
		this.canvas.canvasMouseDown(coord);
		this.setSelectedCell(coord);
		this.changed = true;
	}
	, canvasMouseLeave : function(){
		this.canvas.canvasMouseLeave();
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

	keyUp : function(eventObject){

		// dont process F1-F12 keys
		if (eventObject.keyCode >= KeyEvent.DOM_VK_F1 && eventObject.keyCode <= KeyEvent.DOM_VK_F24){ return;	}

		// dont write anything
		if (!this.canvas.isFocused()){ return }

		if (eventObject.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
			if (this.canvas.getPixel(this.canvas.getSelectedCell().add(leftCoord)) != undefined){
				this.canvas.import(" ",this.canvas.getSelectedCell().add(leftCoord));
			}
  	}	else if (eventObject.keyCode == KeyEvent.DOM_VK_DELETE){
  		// get current text
			currentText = this.canvas.getText(this.canvas.getSelectedCell());
			if (currentText == null){ return;	}
			// delete first character and replace last with space (we are moving text to left)
			currentText = currentText.substring(1)+" ";
			this.canvas.import(currentText,this.canvas.getSelectedCell());
  	}	else{
  		if (this.canvas.getPixel(this.canvas.getSelectedCell().add(rightCoord)) != undefined){
  			this.canvas.import(String.fromCharCode(eventObject.which),this.canvas.getSelectedCell());
 				this.canvas.setSelectedCell(this.canvas.getSelectedCell().add(rightCoord));
 			}
  	}
  	this.canvas.commit();
  	this.canvas.setChanged(true);

		// propagate event
		this.canvas.keyUp(eventObject);
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

// ------------------------------------------------- TOOLS DECORATORS ---------------------------------------------- //

function ClearCanvasTool(canvas, toolId){
	this.class = "ClearCanvasTool";
	this.canvas = canvas;
	this.toolId = toolId;
}

ClearCanvasTool.prototype.click = function(elementId){
	this.canvas.click(elementId);
	if (this.canvas.getActiveTool() == this.toolId) {
		this.canvas.getGrid().commit();
		this.canvas.clear();
	}
}


/**
 * This is the function for drawing text
 */
function TextEditTool(canvas, toolId) {
	this.class = 'TextEditTool';
	this.canvas = canvas;
	this.toolId = toolId;
 	this.startCoord = null;
 	this.currentText = null;
 	this.init();
}

TextEditTool.prototype = {
	init : function(){
		$("#text-input").keyup(function(event) {
			if (event.keyCode == KeyEvent.DOM_VK_ESCAPE){
				this.close();
			} else {
				this.refresh();
			}
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
	, canvasMouseDown : function(startCoord) {

		if (this.canvas.getActiveTool() == this.toolId) {

			// guess where the text exactly starts
			this.startCoord = this.canvas.getTextStart(startCoord);

			// show widget 50 pixels up
			$("#text-widget").css({"left":clickCoords.x,"top":Math.max(0,clickCoords.y-50)});

			// get current text
			this.currentText = this.canvas.getText(this.startCoord);

			// initialize widget
			$("#text-input").val(this.currentText != null? this.currentText : "");

			// show widget & set focus
			$("#text-widget").show(400, function() {
				$("#text-input").focus();
		    });
	    }

		return this.canvas.canvasMouseDown(startCoord);
	}
	, refresh : function() {
		var newValue = $("#text-input").val();
		if (this.currentText != null){
			this.canvas.getGrid().import(this.currentText.replace(/./g," "),this.startCoord);
		}
		this.canvas.getGrid().import(newValue,this.startCoord);
	}
	, close : function() {
		$("#text-input").val("");
		$("#text-widget").hide();
		this.canvas.getGrid().resetStack();
	}
	, cursor : function() {
  		return "text";
	}
}


/**
 * This is the function to draw boxes. Basically it needs 2 coordinates: startCoord and endCoord.
 */
function BoxDrawerTool(canvas, toolId) {
	this.class = 'BoxDrawerTool';
	this.canvas = canvas;
	this.toolId = toolId;
	this.mode = null;
	this.startCoord = null;
	this.endCoord = null;
	this.mouseStatus = null;
}

BoxDrawerTool.prototype = {
	canvasMouseDown : function(coord) {
		this.canvas.canvasMouseDown(coord);
		this.mouseStatus = "down";
		this.startCoord = coord;
	}
	,canvasMouseMove : function(coord) {
		if (this.canvas.getActiveTool() != this.toolId){
			return this.canvas.canvasMouseMove(coord);
		}
		this.endCoord = coord;

		// check whether the user has the mouse down
		if (this.mouseStatus == "down"){
			// reset stack so we start drawing box every time the user moves the mouse
			this.canvas.getGrid().resetStack();
			// draw horizontal line first, then vertical line
			this.canvas.drawLine(this.startCoord, coord, true, '+');
			// draw vertical line first, then horizontal line
			this.canvas.drawLine(this.startCoord, coord, false, '+');
			// update canvas
			this.canvas.setChanged(true);
		}
	}
	/*
 	 * When the user releases the mouse, we know the second coordinate so we draw the box
 	 */
	, canvasMouseUp : function() {
		if (this.canvas.getActiveTool() != this.toolId){
			return this.canvas.canvasMouseUp();
		}
		if (this.mouseStatus == "down"){
			// user has the mouse-up (normal situation)
		} else{
			// if user is leaving the canvas, reset stack
			this.canvas.getGrid().resetStack();
		}
		// perform changes
		this.canvas.getGrid().commit();

		// update status
		this.mouseStatus = "up";

		// update canvas
		this.canvas.setChanged(true);
	}
	/**
 	 * If the mouse leaves the canvas, we dont want to draw nothing
 	 */
	, canvasMouseLeave : function() {
		return this.canvas.canvasMouseLeave();
		if (this.canvas.getActiveTool() == this.toolId){
			this.canvas.getGrid().resetStack();
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
function ExportASCIITool(canvas, toolId){
	this.canvas = canvas;
	this.toolId = toolId;
	this.init();
}

ExportASCIITool.prototype = {
	init : function(){
		$("#dialog-widget").hide();
		$("#dialog-widget-close").click(function() {
			this.close();
		}.bind(this));
	}
	, click : function(elementId){
		this.canvas.click(elementId);
		if (this.canvas.getActiveTool() != this.toolId){
			return ;
		}
	    $("#dialog-textarea").val(this.canvas.getGrid().export());
	    $("#dialog-widget").show();
	    $("#dialog-textarea").focus(function(){
			var $this = $(this);
	    	$this.select();
		});
    }
    , close : function() {
		$("#dialog-textarea").val("");
		$("#dialog-widget").hide();
	}
}

//------------------------------------------------- MOUSE CONTROLLER ------------------------------------------------//

function MouseController(canvas) {
	this.class = 'MouseController';
	this.canvas = canvas;
	this.init();
	this.setActiveElement("select-button");
}

MouseController.prototype.init = function() {
	$("#tools > button.tool").click(function(eventObject) {

		// get id of clicked button
		elementId = eventObject.target.id;

		// visual effect: set active button
		this.setActiveElement(elementId);

		// invoke tool
		this.canvas.click(elementId);

	}.bind(this));

	// bind mousewheel for zooming into the canvas
	$(this.canvas.getCanvasHTML()).bind("mousewheel", function(eventObject) {
		var newZoom = this.canvas.zoom * (eventObject.originalEvent.wheelDelta > 0 ? 1.1 : 0.9);
		newZoom = Math.max(Math.min(newZoom, 4), 1);
		this.canvas.setZoom(newZoom);
		this.canvas.resize();
		$("#canvas-container").width(this.canvas.getCanvasHTML().width);
		return false;
	}.bind(this));

	// bind mouse action for handling the drawing
	$(this.canvas.getCanvasHTML()).mousedown(function(mouseEvent) {

		// these are the client coordinates
		clickCoords = new Coord(mouseEvent.clientX, mouseEvent.clientY);

		// get client relative coordinates for canvas element
		var canvasCoord = getCanvasCoord(this.canvas.getCanvasHTML(),mouseEvent);

		// get coordinates relative to actual zoom
		canvasCoord = getZoomedCanvasCoord(canvasCoord,this.canvas.getZoom());

		// get pixel located at the specified coordinate
		var pixelCoord = new Coord(Math.floor(canvasCoord.x / this.canvas.getCellWidth()), Math.floor(canvasCoord.y / this.canvas.getCellHeight()));

		// invoke tool to do its job
		this.canvas.canvasMouseDown(pixelCoord);

	}.bind(this));

	$(this.canvas.getCanvasHTML()).mouseup(function() {

		this.canvas.canvasMouseUp();

	}.bind(this));

	$(this.canvas.getCanvasHTML()).mouseenter(function() {

		this.canvas.getCanvasHTML().style.cursor = this.canvas.cursor();

		this.canvas.mouseEnter();

	}.bind(this));

	$(this.canvas.getCanvasHTML()).mousemove(function(mouseEvent) {

		// get canvas relative coordinates
		var canvasCoord = getCanvasCoord(this.canvas.getCanvasHTML(),mouseEvent);

		canvasCoord = getZoomedCanvasCoord(canvasCoord,this.canvas.getZoom());

		// get pixel located at the specified coordinate
		var pixelCoord = new Coord(Math.floor(canvasCoord.x / this.canvas.getCellWidth()), Math.floor(canvasCoord.y / this.canvas.getCellHeight()));

		this.canvas.canvasMouseMove(pixelCoord);
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
};

MouseController.prototype.setActiveElement = function(elementId){
	// toggle active button (visual feature only)
	$("#tools > button.tool").removeClass("active");
	$("#" + elementId).toggleClass("active");
}

function getCanvasCoord(canvas,mouseEvent){
	var x;
	var y;
	var parent = $(canvas).parent();
	var xp = parent? parent.scrollLeft() : 0;
	var yp = parent? parent.scrollTop() : 0;
	if (mouseEvent.pageX || mouseEvent.pageY) {
		x = mouseEvent.pageX + xp;
		y = mouseEvent.pageY + yp;
	}
	else {
		x = mouseEvent.clientX + document.body.scrollLeft + document.documentElement.scrollLeft + xp;
		y = mouseEvent.clientY + document.body.scrollTop + document.documentElement.scrollTop + yp;
	}
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;
	return new Coord(x,y);
}

function getZoomedCanvasCoord(coord,zoom){
	return new Coord(coord.x/zoom,coord.y/zoom);
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

	// add click, keyboard & mouse capabilities
	canvas = delegateProxy(new ToolableCanvas(canvas), "canvas");

	// add cursor decorator
	canvas = delegateProxy(new PointerDecorator(canvas, "pointer-button"), "canvas");

	// add ascii drawing capabilities
	canvas = delegateProxy(new DrawableCanvas(canvas), "canvas");

	// add ascii drawing capabilities with style
	canvas = delegateProxy(new StylableCanvas(canvas), "canvas");

	// add char writing capabilities
	canvas = delegateProxy(new CharWriterDecorator(canvas), "canvas");

	// add clear canvas capabilities
	canvas = delegateProxy(new ClearCanvasTool(canvas, "clear-button"), "canvas");

	// add set/edit text capabilities
	canvas = delegateProxy(new TextEditTool(canvas, "text-button"), "canvas");

	// add draw box capabilities
	canvas = delegateProxy(new BoxDrawerTool(canvas, "box-button"), "canvas");

	// add export capabilities
	canvas = delegateProxy(new ExportASCIITool(canvas, "export-button"), "canvas");

	// initialize mouse controller
	new MouseController(canvas);

	// visual only: adapt canvas container
	$("#canvas-container").width(canvas.getWidth());

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
