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
            this.matrix = [][0];
            this.pixelsStack = [];
            this.changed = true;
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
/// <reference path="coord.ts" />
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3JjL21vZGVsL2dyaWQudHMiLCJzcmMvYXBwLnRzIiwic3JjL21vZGVsL2JveC50cyIsInNyYy9tb2RlbC9jb29yZC50cyIsInNyYy9tb2RlbC9jb25zdGFudHMudHMiLCJzcmMvbW9kZWwvcGl4ZWwtcG9zaXRpb24udHMiLCJzcmMvbW9kZWwvcGl4ZWwudHMiLCJzcmMvdXRpbC91bmljb2RlLWNoYXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxJQUFVLEtBQUssQ0F3TGQ7QUF4TEQsV0FBVSxLQUFLO0lBQ2Q7OztPQUdHO0lBQ0g7UUFVQzs7VUFFRTtRQUNGO1lBVkEsU0FBSSxHQUFZLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztZQUM5QyxTQUFJLEdBQWEsU0FBUyxDQUFDLG1CQUFtQixDQUFDO1lBQy9DLFdBQU0sR0FBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0IsZ0JBQVcsR0FBcUIsRUFBRSxDQUFDO1lBQ25DLFlBQU8sR0FBYSxJQUFJLENBQUM7WUFPeEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFFO29CQUM3QyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksTUFBQSxLQUFLLEVBQUUsQ0FBQztpQkFDaEM7YUFDRDtZQUNELElBQUcsT0FBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFdBQVcsRUFB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