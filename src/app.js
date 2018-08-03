"use strict";
var model;
(function (model) {
    /**
     * This class holds the pixels matrix and a stack for faster access to pixels being modified
     * The matrix is an array of cols x rows (x, y)
     */
    var Grid = /** @class */ (function () {
        /**
         * Initialize grid and restore previous user data if available
        */
        function Grid() {
            this.cols = constants.defaultNumberOfCols;
            this.rows = constants.defaultNumberOfRows;
            this.pixelsStack = [];
            this.changed = true;
            this.matrix = Array(this.cols);
            for (var a = 0; a < this.cols; a++) {
                this.matrix[a] = Array(this.rows);
                for (var b = 0; b < this.matrix[a].length; b++) {
                    this.matrix[a][b] = new model.Pixel();
                }
            }
            if (typeof (Storage) !== "undefined") {
                var previousData = localStorage.getItem("data");
                if (previousData != null) {
                    this.import(previousData, new model.Coord(0, 0), true, true);
                    this.commit();
                }
            }
        }
        Grid.prototype.isOutOfBounds = function (coord) {
            if (coord.x < 0 || coord.x >= this.cols) {
                return true;
            }
            if (coord.y < 0 || coord.y >= this.rows) {
                return true;
            }
            return false;
        };
        /**
         * Return the pixel located at the specified coord
         */
        Grid.prototype.getPixel = function (coord) {
            /*if (this.isOutOfBounds(coord)){
                return null;
            }*/
            return this.matrix[coord.x][coord.y];
        };
        /**
         * Clears/reset the whole matrix of pixels
         */
        Grid.prototype.clear = function (start, final) {
            console.log("Clearing grid from '" + start + "' to '" + final + "'...");
            var startRow = start ? start.x : 0;
            var finalRow = final ? final.x : this.matrix.length - 1;
            var startCol = start ? start.y : 0;
            var finalCol = final ? final.y : this.matrix[0].length - 1;
            for (var row = startRow; row <= finalRow; row++) {
                for (var col = startCol; col <= finalCol; col++) {
                    if (this.isOutOfBounds(new model.Coord(row, col)))
                        continue;
                    this.matrix[row][col].clear();
                }
            }
            this.changed = true;
        };
        Grid.prototype.stackPixel = function (coord, value) {
            if (this.isOutOfBounds(coord))
                return;
            if (value != null && value != "" && !constants.printableCharsRegex.test(value))
                throw new Error("Char non recognized [" + value.charCodeAt(0) + "]");
            var pixel = this.getPixel(coord);
            this.pixelsStack.push(new model.PixelPosition(coord, pixel));
            pixel.tempValue = value;
            this.changed = true;
        };
        Grid.prototype.stackArea = function (area) {
            for (var minX = area.minX; minX <= area.maxX; minX++) {
                for (var minY = area.minY; minY <= area.maxY; minY++) {
                    // get pixel we are moving
                    var pixelCoord = new model.Coord(minX, minY);
                    var pixelValue = this.getPixel(pixelCoord).getValue();
                    this.stackPixel(pixelCoord, " ");
                }
            }
        };
        Grid.prototype.savePixel = function (coord, value) {
            if (this.getPixel(coord).getValue() != value) {
                this.stackPixel(coord, value);
            }
        };
        /**
         * Clears the stack so we have no temporary pixels to be drawn
         */
        Grid.prototype.rollback = function () {
            // console.log("rollback");
            for (var b in this.pixelsStack) {
                this.pixelsStack[b].pixel.tempValue = undefined;
            }
            this.pixelsStack.length = 0;
            this.changed = true;
        };
        /**
         * Imports the specified text into the specified coordinates. The text can be multiline.
         * All the whitespace characters will be replaced for nulls and it means we want to delete the pixel
         */
        Grid.prototype.import = function (text, coord, ommitBlanks, ommitUnrecognized) {
            var lines = text.split("\n");
            for (var e = 0; e < lines.length; e++) {
                for (var g = lines[e], l = 0; l < g.length; l++) {
                    var h = g.charAt(l);
                    if (ommitBlanks && (h == "" || h == " "))
                        continue;
                    try {
                        this.stackPixel(new model.Coord(l, e).add(coord), h);
                    }
                    catch (e) {
                        if (ommitUnrecognized)
                            continue;
                        throw e;
                    }
                }
            }
        };
        Grid.prototype.moveArea = function (area, diff) {
            // stack the area we are moving
            this.stackArea(area);
            // move the area to new position
            for (var minX = area.minX; minX <= area.maxX; minX++) {
                for (var minY = area.minY; minY <= area.maxY; minY++) {
                    // get pixel we are moving
                    var pixelCoord = new model.Coord(minX, minY);
                    // get current pixel value
                    var pixelValue = this.getPixel(pixelCoord).value;
                    // get pixel we are overwriting
                    var pixelCoord2 = pixelCoord.add(diff);
                    // check if pixel is inside canvas
                    if (this.isOutOfBounds(pixelCoord2))
                        continue;
                    // get pixel value we are overwriting
                    var pixelValue2 = this.getPixel(pixelCoord2).getValue();
                    // stack the pixel we are overwriting
                    this.stackPixel(pixelCoord2, pixelValue != null ? pixelValue : pixelValue2 != null && pixelValue2 != "" ? pixelValue2 : " ");
                }
            }
        };
        Grid.prototype.export = function () {
            var data = "";
            for (var row = 0; row < this.rows; row++) {
                data += "\n";
                for (var col = 0; col < this.cols; col++) {
                    var pixel = this.getPixel(new model.Coord(col, row));
                    var pixelValue = pixel.getValue();
                    data += pixelValue == null ? " " : pixelValue;
                }
            }
            if (data.indexOf("\n") == 0) {
                data = data.substring(1);
            }
            return data;
        };
        Grid.prototype.commit = function () {
            for (var b in this.pixelsStack) {
                var pixel = this.pixelsStack[b].pixel;
                var newValue = pixel.getValue();
                pixel.value = newValue == " " || newValue == "" ? undefined : newValue;
            }
            this.rollback();
            // save data to local storage
            if (typeof (Storage) !== "undefined") {
                localStorage.setItem("data", this.export());
            }
            else {
                // Sorry! No Web Storage support..
            }
        };
        Grid.class = 'Grid';
        return Grid;
    }());
    model.Grid = Grid;
})(model || (model = {}));
/// <reference path="model/grid.ts" />
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
/*
 * Initialize canvas and use the Decorator Pattern to add more features (single responsability chain).
 * In order to implement Decorator Pattern, I use jquery to extend objects ($.extend()).
 * Since the wrapper mechanism is emulated (based on copying object properties), I have to make use of this.$ variable to reference the real 'this'.
 */
function init() {
    // initialize grid
    console.log(model);
    var grid = new model.Grid();
    // initialize canvas
    /*var canvas = delegateProxy(new ASCIICanvas(document.getElementById("ascii-canvas"),grid),"grid");
    canvas.init();
    // add canvas movability
    canvas = new MovableCanvas(canvas, "#canvas-container");
    // add canvas zoom feature
    canvas = delegateProxy(new ZoomableCanvas(canvas), "canvas");
    canvas.init();
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
    animate(canvas);*/
}
/*function animate(canvas : Canvas){
    if (canvas.hasChanged()){
        canvas.redraw();
        canvas.setChanged(false);
    }
    window.requestAnimationFrame(function() {
        animate(canvas);
    });
}*/
var hello = "blablah";
var model;
(function (model) {
    //--------------------------------------------- DRAW CLASSES ------------------------------------------------------- //
    /**
     * Calculates the mins and max given 2 coordinates
     */
    var Box = /** @class */ (function () {
        function Box(coordA, coordB) {
            this.minX = Math.min(coordA.x, coordB.x);
            this.minY = Math.min(coordA.y, coordB.y);
            this.maxX = Math.max(coordA.x, coordB.x);
            this.maxY = Math.max(coordA.y, coordB.y);
            this.min = new model.Coord(this.minX, this.minY);
            this.max = new model.Coord(this.maxX, this.maxY);
            this.midX = Math.floor((this.maxX + this.minX) / 2);
            this.midY = Math.floor((this.maxY + this.minY) / 2);
            this.mid = new model.Coord(this.midX, this.midY);
        }
        Box.prototype.contains = function (coord) {
            return coord && coord.x >= this.minX && coord.x <= this.maxX && coord.y >= this.minY && coord.y <= this.maxY;
        };
        Box.prototype.add = function (coord) {
            return new Box(this.min.add(coord), this.max.add(coord));
        };
        Box.prototype.squareSize = function () {
            // +1 because boxes include bounds
            return (this.maxX - this.minX + 1) * (this.maxY - this.minY + 1);
        };
        Box.prototype.toString = function () {
            return "Box: ('" + this.min + "'->'" + this.max + "', mid:" + this.mid + ")";
        };
        Box.class = 'Box';
        return Box;
    }());
    model.Box = Box;
})(model || (model = {}));
var model;
(function (model) {
    /**
     * A simple pair of coordinates x,y for to use to locate any pixel
    */
    var Coord = /** @class */ (function () {
        function Coord(x, y) {
            this.x = x;
            this.y = y;
        }
        Coord.prototype.toString = function () {
            return "Coord[" + this.x + "," + this.y + "]";
        };
        Coord.prototype.add = function (other) {
            return new Coord(this.x + other.x, this.y + other.y);
        };
        Coord.prototype.equals = function (other) {
            return this.x == other.x && this.y == other.y;
        };
        Coord.prototype.substract = function (other) {
            return new Coord(this.x - other.x, this.y - other.y);
        };
        Coord.prototype.getLength = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };
        Coord.prototype.clone = function () {
            return new Coord(this.x, this.y);
        };
        Coord.prototype.hasSameAxis = function (other) {
            return this.x == other.x || this.y == other.y;
        };
        Coord.prototype.isOppositeDir = function (other) {
            return this.add(other).getLength() == 0;
        };
        return Coord;
    }());
    model.Coord = Coord;
})(model || (model = {}));
var util;
(function (util) {
    var UnicodeChars = /** @class */ (function () {
        function UnicodeChars() {
        }
        UnicodeChars.initialize = function () {
            var allChars = [];
            var boxChars = [];
            for (var field in Object.getOwnPropertyNames(this)) {
                var char = UnicodeChars[field];
                allChars.push(char);
                if (field.indexOf("BOX") == 0) {
                    boxChars.push(char);
                }
            }
            UnicodeChars.CHARS = allChars;
            UnicodeChars.BOX_CHARS = boxChars;
        };
        UnicodeChars.isChar = function (char) {
            return UnicodeChars.CHARS.indexOf(char) != -1;
        };
        UnicodeChars.LATIN_PLUS_SIGN = "+";
        UnicodeChars.LATIN_HYPHEN_MINUS = "-";
        UnicodeChars.LATIN_VERTICAL_LINE = "|";
        UnicodeChars.BOX_HORIZONTAL = "─";
        UnicodeChars.BOX_VERTICAL = "│";
        UnicodeChars.BOX_CROSS = "┼";
        UnicodeChars.BOX_CORNER_TOP_LEFT = "┌";
        UnicodeChars.BOX_CORNER_TOP_RIGHT = "┐";
        UnicodeChars.BOX_CORNER_BOTTOM_LEFT = "└";
        UnicodeChars.BOX_CORNER_BOTTOM_RIGHT = "┘";
        UnicodeChars.BOX_HORIZONTAL_LIGHT_UP = "┴";
        UnicodeChars.BOX_HORIZONTAL_LIGHT_DOWN = "┬";
        UnicodeChars.BOX_VERTICAL_LIGHT_RIGHT = "├";
        UnicodeChars.BOX_VERTICAL_LIGHT_LEFT = "┤";
        UnicodeChars.CHARS = [];
        UnicodeChars.BOX_CHARS = [];
        UnicodeChars.isBoxChar = function (char) {
            return UnicodeChars.BOX_CHARS.indexOf(char) != -1;
        };
        return UnicodeChars;
    }());
    util.UnicodeChars = UnicodeChars;
    UnicodeChars.initialize();
    util.UC = UnicodeChars;
})(util || (util = {}));
/// <reference path="coord.ts" />
/// <reference path="../util/unicode-chars.ts" />
var UC = util.UC;
var Coord = model.Coord;
var constants;
(function (constants) {
    // Default font for drawing the ASCII pixels
    constants.defaultFont = "10px Courier New";
    // Default canvas zoom. Canvas can be zoomed from 1x (not zoomed) to 4x (zoomed)
    constants.defaultZoom = 1;
    // Number of rows for the grid
    constants.defaultNumberOfRows = 100;
    // Number of cols for the grid
    constants.defaultNumberOfCols = 200;
    // list of characters we use for drawing boxes
    constants.boxChars1 = UC.BOX_CHARS;
    constants.boxChars1.push(UC.LATIN_PLUS_SIGN);
    constants.boxChars1.push(UC.LATIN_HYPHEN_MINUS);
    constants.boxChars1.push(UC.LATIN_VERTICAL_LINE);
    // list of characters we use for drawing arrows
    constants.arrowChars1 = [">", "<", "^", "v"];
    // Draw styles
    constants.drawStyles = {};
    constants.drawStyles["0"] = { "horizontal": "-", "vertical": "|", "corner": "+", "cross": "+" };
    constants.drawStyles["1"] = { "horizontal": UC.BOX_HORIZONTAL, "vertical": UC.BOX_VERTICAL, "corner": UC.BOX_CROSS, "cross": UC.BOX_CROSS,
        "corner-top-left": UC.BOX_CORNER_TOP_LEFT, "corner-top-right": UC.BOX_CORNER_TOP_RIGHT, "corner-bottom-left": UC.BOX_CORNER_BOTTOM_LEFT, "corner-bottom-right": UC.BOX_CORNER_BOTTOM_RIGHT,
        "horizontal-light-up": UC.BOX_HORIZONTAL_LIGHT_UP, "horizontal-light-down": UC.BOX_HORIZONTAL_LIGHT_DOWN,
        "vertical-light-right": UC.BOX_VERTICAL_LIGHT_RIGHT, "vertical-light-left": UC.BOX_VERTICAL_LIGHT_LEFT
    };
    // ascii|latin-1-supplement|lat-extended-a|latin-extended-b|arrows|box-drawing|
    constants.printableCharsRegex = /[ -~]|[¡-ÿ]|[Ā-ſ]|[ƀ-ɏ]|[←-⇿]|[─-╿]/iu;
    // Basic constants
    constants.zeroCoord = new Coord(0, 0), constants.leftCoord = new Coord(-1, 0), constants.rightCoord = new Coord(1, 0), constants.topCoord = new Coord(0, -1), constants.bottomCoord = new Coord(0, 1);
    constants.contextCoords = [constants.leftCoord, constants.rightCoord, constants.topCoord, constants.bottomCoord];
})(constants || (constants = {}));
var model;
(function (model) {
    var PixelPosition = /** @class */ (function () {
        function PixelPosition(coord, pixel) {
            this.coord = coord;
            this.pixel = pixel;
        }
        return PixelPosition;
    }());
    model.PixelPosition = PixelPosition;
})(model || (model = {}));
var model;
(function (model) {
    var Pixel = /** @class */ (function () {
        function Pixel() {
        }
        /**
         * Get the pixel value to be drawn to the canvas. Always draw the temporary value if any
         */
        Pixel.prototype.getValue = function () {
            return this.tempValue != undefined ? this.tempValue : this.value;
        };
        Pixel.prototype.clear = function () {
            this.value = undefined;
            this.tempValue = undefined;
        };
        Pixel.prototype.isEmpty = function () {
            return this.value == undefined && this.tempValue == undefined;
        };
        Pixel.class = "Pixel";
        return Pixel;
    }());
    model.Pixel = Pixel;
})(model || (model = {}));
//# sourceMappingURL=app.js.map