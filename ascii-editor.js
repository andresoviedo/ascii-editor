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


//--------------------------------------------- DRAW METHODS --------------------------------------------------------//

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
PixelContext.prototype.getLength = function() {
	return this.left + this.right + this.bottom + this.top;
}

PixelContext.prototype.toString = function() {
		return "PixelContext["+this.left+","+this.right+","+this.bottom+","+this.top+"]";
}

/**
 * Return true if the specified pixel has a drawing character
 */
function isDrawChar(pixel) {
	if (pixel == null || pixel == undefined){
		return pixel;
	}
	return UC.isChar(pixel.getValue());
}

/**
 * This functions draws a line of pixels from startCoord to endCoord. The line can be drawn 2 ways: either first horizontal line of first vertical line.
 * For drawing boxes, the line should be drawn both ways.
 */
function drawLine(grid, startCoord, endCoord, drawHorizontalFirst, pixelValue) {
	// debug("Drawing line from "+startCoord+" to "+endCoord+" with value '"+pixelValue+"'...");

	// calculate box so we know from where to where we should draw the line
	var box = new Box(startCoord, endCoord), minX = box.minX, minY = box.minY, maxX = box.maxX, maxY = box.maxY;
	
	// calculate where to draw the horizontal line
	var yPosHorizontalLine = drawHorizontalFirst ? startCoord.y : endCoord.y
	for (;minX <= maxX; minX++) {
		var newCoord = new Coord(minX, yPosHorizontalLine), pixelContext = grid.getPixelContext(new Coord(minX, yPosHorizontalLine));
		grid.stackPixel(newCoord, pixelValue);
	}
	// calculate where to draw the vertical line
	var xPosLine = drawHorizontalFirst ? endCoord.x : startCoord.x;
	for (;minY <= maxY; minY++) {
		var newCoord = new Coord(xPosLine, minY), pixelContext = grid.getPixelContext(new Coord(xPosLine, minY));
		grid.stackPixel(newCoord, pixelValue);
	}
}

function modifyStyle(grid, drawStyle){
	for (index in grid.pixelsStack){
		pixelPosition = grid.pixelsStack[index];
		pixel = pixelPosition.pixel;
		pixelValue = getPixelValueIntegrated(grid,pixelPosition.coord, drawStyle);
		pixel.tempValue = pixelValue;
	}
}

function getTextStart(grid,startCoord) {
	// guess where the text starts
	var startingColumn = startCoord.x;
	for (col=startingColumn; col>=0; col--){
		pixel = grid.getPixel(new Coord(col,startCoord.y));
		if (isDrawChar(pixel)){
			break;
		}
		previousPixelValue = pixel.getValue();
		if (previousPixelValue == null){
			if (col == 0){
				break;
			} else{
				pixel2 = grid.getPixel(new Coord(col-1,startCoord.y));
				previousPixelValue2 = pixel2.getValue();
				if (previousPixelValue2 == null || isDrawChar(pixel2)) break;
			}
		}
		startingColumn = col;
	}
	var startingRow = startCoord.y;
	for (row=startingRow; row>=0; row--){
		pixel = grid.getPixel(new Coord(startingColumn,row));
		previousPixelValue = pixel.getValue();
		if (previousPixelValue == null || isDrawChar(pixel)) break;
		startingRow = row;
	}
	return new Coord(startingColumn, startingRow);	
}

function getText(grid, startCoord){
	pixel = grid.getPixel(startCoord);
	if (pixel == undefined) return undefined;
	
	pixelValue = pixel.getValue();
	if (pixelValue == undefined || pixelValue == null) return null;
	if (isDrawChar(pixel)) return null;
	
	var text = "";
	for (row=startCoord.y; row<grid.rows; row++){
		pixel = grid.getPixel(new Coord(startCoord.x,row));
		nextPixelValue = pixel.getValue();
		if (nextPixelValue == null || isDrawChar(pixel)) break;

		text += "\n";
		for (col=startCoord.x; col<grid.cols; col++){
			pixel = grid.getPixel(new Coord(col,row));
			if (isDrawChar(pixel)){
				break;
			}
			nextPixelValue = pixel.getValue();
			if (nextPixelValue != null){
				text += nextPixelValue;
				continue;
			}
			if (col > grid.cols-2){
				break;
			}
			
			pixel2 = grid.getPixel(new Coord(col+1,row));
			nextPixelValue2 = pixel2.getValue();
			if (isDrawChar(pixel2)){
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

/**
 * Here is the logic to integrate the pixels. This function return the best drawing character 
 * so its nicely integrated into the ASCII code
 */
function getPixelValueIntegrated(grid, coord, drawStyle) {
	var pixel = grid.getPixel(coord);
	var pixelValue = pixel.getValue();
	
	// test whether the pixel is either of the drawing characters
	var isBoxPixel = boxChars1.indexOf(pixelValue) != -1;
	var isArrowPixel = arrowChars1.indexOf(pixelValue) != -1;
	
	// if its not a drawing character just return. we have nothing to integrate
	if (!isBoxPixel && !isArrowPixel) {
		return pixelValue;
	}
	
	// get pixel context so we decide which is the best character for integration 
	var pixelContext = grid.getPixelContext(coord);
	
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

// --------------------------------------------------- TOOLS ------------------------------------------------------- //

function CanvasPointer(canvas){
	this.canvas = canvas;
}

CanvasPointer.prototype.canvasMouseMove = function(coord){
	this.canvas.selectedCoord = coord;
	this.canvas.changed = true;
}

CanvasPointer.prototype.canvasMouseLeave = function(){
	this.canvas.selectedCoord = null;
	this.canvas.changed = true;
}

function ClearTool(grid){
	this.grid = grid;
}

ClearTool.prototype.click = function(){
	this.grid.clear();
	this.grid.commit();
}

/**
 * This is the function for drawing text
 */
function TextTool(grid) {
	this.class = 'TextTool';
	this.grid = grid;
 	this.startCoord = null;
 	this.currentText = null;
 	this.init();
}

TextTool.prototype.init = function(){
	$("#text-input").keyup(function(event) {
		if (event.keyCode == KeyEvent.DOM_VK_ESCAPE){
			this.close();
		} else {
			this.refresh();
		}
	}.bind(this));
	$("#text-input").change(function() {
		this.refresh();
	}.bind(this));
	$("#text-input-close").click(function() {
		this.close();
	}.bind(this));
	$("#text-input-OK").click(function() {
		this.refresh();		
		this.grid.commit();
		this.close();
	}.bind(this));
}

TextTool.prototype.canvasMouseDown = function(startCoord) {

	// guess where the text exactly starts
	this.startCoord = getTextStart(this.grid,startCoord);
	
	// show widget 50 pixels up 
	$("#text-widget").css({"left":clickCoords.x,"top":Math.max(0,clickCoords.y-50)});
	
	// get current text
	this.currentText = getText(this.grid,this.startCoord);
	
	// initialize widget
	$("#text-input").val(this.currentText != null? this.currentText : "");
	
	// show widget & set focus
	$("#text-widget").show(400, function() {
		$("#text-input").focus();
    });
}

TextTool.prototype.click = function() {
	this.close();
}

TextTool.prototype.unselect = function() {
	this.close();
}

TextTool.prototype.refresh = function() {
	var newValue = $("#text-input").val();
	this.grid.resetStack();
	if (this.currentText != null){
		this.grid.import(this.currentText.replace(/./g," "),this.startCoord);
	}
	this.grid.import(newValue,this.startCoord);
}

TextTool.prototype.close = function() {
	$("#text-input").val("");
	$("#text-widget").hide();
}

TextTool.prototype.cursor = function() {
  return "text";
};

/**
 * This is the function to draw boxes. Basically it needs 2 coordinates: startCoord and endCoord.
 */
function BoxDrawer(grid) {
	this.class = 'BoxDrawer';
	this.grid = grid;
	this.mode = null;
	this.startCoord = null;
	this.endCoord = null;
}

BoxDrawer.prototype.canvasMouseDown = function(coord) {
	this.startCoord = coord;
}

BoxDrawer.prototype.canvasMouseMove = function(coord) {
	this.endCoord = coord;
	
	// check whether the user has the mouse down
	if (this.mode == 1){
		// reset stack so we start drawing box every time the user moves the mouse
		this.grid.resetStack();
		// get drawing style
		drawStyle = $("#style-select").val();
		// draw horizontal line first, then vertical line
		drawLine(this.grid, this.startCoord, coord, true, '+');
		// draw vertical line first, then horizontal line
		drawLine(this.grid, this.startCoord, coord, false, '+');
		// fix line style
		modifyStyle(this.grid, drawStyle);
	}
};

/*
 * When the user releases the mouse, we know the second coordinate so we draw the box
 */
BoxDrawer.prototype.canvasMouseUp = function() {
	if (this.mode == 2){
		// user has the mouse-up (normal situation)
	} else{
		// if user is leaving the canvas, reset stack
		this.grid.resetStack();
	}
	// perform changes
	this.grid.commit();
}

/**
 * If the mouse leaves the canvas, we dont want to draw nothing
 */
BoxDrawer.prototype.canvasMouseLeave = function() {
	this.grid.resetStack();
}

BoxDrawer.prototype.cursor = function() {
	return "crosshair";
}


//------------------------------------------------- COORD CLASS -----------------------------------------------------//

/**
 * A simple pair of coordinates x,y for to use to locate any pixel 
 */
function Coord(x, y) {
	this.class = 'Coord';
	this.x = x;
	this.y = y;
}
Coord.prototype.toString = function()
{
		return "Coord["+this.x+","+this.y+"]";
}

Coord.prototype.add = function(a) {
	return new Coord(this.x + a.x, this.y + a.y);
};

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
Pixel.prototype.getValue = function() {
	return this.tempValue != null? this.tempValue : this.value;
}

Pixel.prototype.clear = function() {
	this.value = null;
	this.tempValue = null;
}

Pixel.prototype.isEmpty = function() {
	return this.value == null && this.tempValue == null;
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
Grid.prototype.init = function(){
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
Grid.prototype.getPixel = function(coord) {
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
Grid.prototype.clear = function() {
	for (var a = 0;a < this.matrix.length;a++) {
		for (var b = 0;b < this.matrix[a].length;b++) {
			this.matrix[a][b].clear();
		}
	}
	this.changed = true;
}

Grid.prototype.stackPixel = function(coord, value) {
	var pixel = this.getPixel(coord);
	this.pixelsStack.push(new PixelPosition(coord, pixel));
	pixel.tempValue = value;
	this.changed = true;
}

Grid.prototype.savePixel = function(coord, value) {
	if (this.getPixel(coord).getValue() != value){
		this.stackPixel(coord, value);
	}
}

/**
 * Clears the stack so we have no temporary pixels to be drawn
 */
Grid.prototype.resetStack = function() {
	for (var b in this.pixelsStack) {
		this.pixelsStack[b].pixel.tempValue = null;
	}
	this.pixelsStack.length = 0;
	this.changed = true;
}

/**
 * Returns the context of the specified pixel. That is, the status of the surrounding pixels
 */
Grid.prototype.getPixelContext = function(coord) {
	var left = isDrawChar(this.getPixel(coord.add(leftCoord)));
	var right = isDrawChar(this.getPixel(coord.add(rightCoord)));
	var top = isDrawChar(this.getPixel(coord.add(topCoord)));
	var bottom = isDrawChar(this.getPixel(coord.add(bottomCoord)));
	return new PixelContext(left, right, top, bottom);
};


Grid.prototype.import = function(text, coord) {
	lines = text.split("\n");
	for (e = 0;e < lines.length;e++) {
		for (var g = lines[e], l = 0;l < g.length;l++) {
			var h = g.charAt(l);
			this.stackPixel(new Coord(l,e).add(coord), h == " "? null: h);
		}
	}
}

Grid.prototype.export = function(){
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

Grid.prototype.commit = function(b) {
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


//------------------------------------------------- CANVAS CLASS ----------------------------------------------------//

function Canvas() {
	this.class = 'Canvas';
	this.grid = new Grid();
	this.selectedCoord = null;
	this.canvasHTML = document.getElementById("ascii-canvas");
	this.canvasContext = this.canvasHTML.getContext("2d");
	this.font = defaultFont;
	this.cellWidth = null;
	this.cellHeight = null;
	this.cellDescend = null;
	this.zoom = defaultZoom;
	this.changed = true;
	this.linesMode = false;
	this.init();
}

Canvas.prototype.init = function(){
	canvas = this;
	$(window).resize(function() {
		canvas.resize();
	});
	this.resize();
}

Canvas.prototype.getTextLocation = function(coord){
	return new Coord(coord.x*this.cellWidth, coord.y*this.cellHeight+this.cellHeight-this.cellDescend);
}

Canvas.prototype.recalculateCellDimensions = function(){
	if (this.cellWidth == null){
		this.cellWidth = getTextWidth(this.canvasContext, defaultFont);
		debug("Cell width '"+this.cellWidth+"'");
	}
	if (this.cellHeight == null){
		heightMetrics = getTextHeight(this.canvasContext,this.font, 0, 0, 100, 100);
		this.canvasContext.clearRect(0, 0, 100, 100);
		this.cellHeight = heightMetrics[0];
		this.cellDescend = heightMetrics[1];
		if (this.cellHeight == 0) {
			this.cellHeight = this.cellWidth*1.5;
		}
		debug("Cell height '"+this.cellHeight+"', cell descend '"+this.cellDescend+"'");
	}
}

Canvas.prototype.resize = function (){
	this.recalculateCellDimensions(this.canvasContext);
	this.canvasHTML.width = this.grid.cols * Math.round(this.cellWidth) * this.zoom;
	this.canvasHTML.height = this.grid.rows * Math.round(this.cellHeight) * this.zoom;
	this.changed = true;
	debug("New canvas size '"+this.canvasHTML.width+"/"+this.canvasHTML.height+"'");	
}

Canvas.prototype.animate = function() {
	if (this.changed || this.grid.changed) {
		this.resize(); this.redraw();
		this.changed = false, this.grid.changed = false;
	}
	var canvas = this;
	window.requestAnimationFrame(function() {
		canvas.animate();
	});
};

Canvas.prototype.redraw = function() {

	// debug("Redrawing canvas... zoom '"+this.zoom+"'");
	
	this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
	this.canvasContext.scale(this.zoom, this.zoom);
	
	// clear everything so we dont have pixels drawn over pixels
	this.canvasContext.clearRect(0, 0, this.canvasHTML.width, this.canvasHTML.height);
	
	// Draw border
	drawBorder(this.canvasContext,this.canvasHTML.width, this.canvasHTML.height);

	// debug
	// debug("Drawing grid with font '"+this.font+"' & size '"+this.cellWidth+"/"+this.cellHeight+"'...");

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
	
	// draw pixel selected
	if (this.selectedCoord != null){
		this.canvasContext.fillStyle = "#009900";
		this.canvasContext.fillRect(this.selectedCoord.x*this.cellWidth,this.selectedCoord.y*this.cellHeight,this.cellWidth,this.cellHeight);
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




//------------------------------------------------- MOUSE CONTROLLER ------------------------------------------------//

function MouseController(canvas, tools) {
	this.class = 'MouseController';
	this.canvas = canvas;
	this.tools = tools;
	this.selectedTool = null;
	this.canvasPointer = new CanvasPointer(canvas);
	this.init();
}

MouseController.prototype.init = function() {
	var controller = this;
	$("#tools > button.tool").click(function(eventObject) {
	
		// toggle active button (visual feature only)		
		$("#tools > button.tool").removeClass("active");
		elementId = eventObject.target.id;
		$("#" + elementId).toggleClass("active");
		
		// get tool
		var toolId = elementId.substring(0,elementId.indexOf("-"));
		selectedTool = controller.tools[toolId];
		
		// unselect previous tool
		if (controller.selectedTool != null && selectedTool != controller.selectedTool){
			if (typeof(controller.selectedTool.unselect) == "function"){
				controller.selectedTool.unselect();
			}
		}
				
		// link new tool
		controller.selectedTool = selectedTool;
		
		// invoke tool
		if (typeof(controller.selectedTool.click) == "function"){
			controller.selectedTool.click();
		}
	});
	
	// bind mousewheel for zooming into the canvas
	$(this.canvas.canvasHTML).bind("mousewheel", function(eventObject) {
		var newZoom = this.canvas.zoom * (eventObject.originalEvent.wheelDelta > 0 ? 1.1 : 0.9);
		newZoom = Math.max(Math.min(newZoom, 4), 1);
		this.canvas.zoom = newZoom;
		this.canvas.changed = true;
		return false;
	}.bind(this));
	
	// bind mouse action for handling the drawing
	$(this.canvas.canvasHTML).mousedown(function(mouseEvent) {
		if (controller.selectedTool == null){
			alert("Select tool first");
			return;
		}
		
		// these are the client coordinates
		clickCoords = new Coord(mouseEvent.clientX, mouseEvent.clientY);

		// get client relative coordinates for canvas element
		var canvasCoord = getCanvasCoord(this.canvas.canvasHTML,mouseEvent);
		
		// get coordinates relative to actual zoom
		canvasCoord = getZoomedCanvasCoord(canvasCoord,this.canvas.zoom);
		
		// get pixel located at the specified coordinate
		var pixelCoord = new Coord(Math.floor(canvasCoord.x / this.canvas.cellWidth), Math.floor(canvasCoord.y / this.canvas.cellHeight));
		
		// prepare tool to start doing its job
		controller.selectedTool.mode = 1;
		controller.selectedTool.startCoord = pixelCoord;
		
		// invoke tool to do its job
		if (typeof(controller.selectedTool.canvasMouseDown) == "function"){
			controller.selectedTool.canvasMouseDown(pixelCoord);
		}
	 
	}.bind(this));
		
	$(this.canvas.canvasHTML).mouseup(function() {
		if (controller.selectedTool == null){
			return;
		}
		controller.selectedTool.mode = 2;
		
		if (typeof(controller.selectedTool.canvasMouseUp) == "function"){
			controller.selectedTool.canvasMouseUp();
		}
		
	}.bind(this));
	
	$(this.canvas.canvasHTML).mouseenter(function() {
		if (controller.selectedTool == null){
				this.canvas.canvasHTML.style.cursor = "text";
				return;
		}
		if (typeof(controller.selectedTool.cursor) == "function"){
			this.canvas.canvasHTML.style.cursor = controller.selectedTool.cursor();
		}			
	}.bind(this));
	
	$(this.canvas.canvasHTML).mousemove(function(mouseEvent) {
	
		// get canvas relative coordinates
		var canvasCoord = getCanvasCoord(this.canvas.canvasHTML,mouseEvent);
		
		canvasCoord = getZoomedCanvasCoord(canvasCoord,this.canvas.zoom);
		
		// get pixel located at the specified coordinate
		var pixelCoord = new Coord(Math.floor(canvasCoord.x / this.canvas.cellWidth), Math.floor(canvasCoord.y / this.canvas.cellHeight));
		
		// notify canvas tool
		controller.canvasPointer.canvasMouseMove(pixelCoord);
	
		if (controller.selectedTool == null){
			return;
		}
			
		if (typeof(controller.selectedTool.canvasMouseMove) != "function"){
			return;
		}
		
		controller.selectedTool.canvasMouseMove(pixelCoord);
	}.bind(this));
	
	$(this.canvas.canvasHTML).mouseleave(function() {
	
		// notify canvas tool
		controller.canvasPointer.canvasMouseLeave();
		
		if (controller.selectedTool == null){
			return;
		}
		controller.selectedTool.mode = 3;
		
		if (typeof(controller.selectedTool.canvasMouseLeave) != "function"){
			return;
		}
		
		controller.selectedTool.canvasMouseLeave();
	}.bind(this));
};

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

function init(){
	// initialize canvas
	var canvas = new Canvas(new Grid());
	
	// initialize tools
	var tools = {};
	tools["box"] = new BoxDrawer(canvas.grid);
	tools["text"] = new TextTool(canvas.grid);
	tools["clear"] = new ClearTool(canvas.grid);

	// initialize mouse controller
	new MouseController(canvas, tools);
	
	canvas.animate();
}


