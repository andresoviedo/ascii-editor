
let leftCoord: Coord;
let rightCoord: Coord;
let topCoord: Coord;
let bottomCoord: Coord;

function init_constants(){

  // Default font for drawing the ASCII pixels
  window.defaultFont = "10px Courier New";
  // Default canvas zoom. Canvas can be zoomed from 1x (not zoomed) to 4x (zoomed)
  window.defaultZoom = 1;


  // Number of rows for the grid
  window.defaultNumberOfRows = 100;
  // Number of cols for the grid
  window.defaultNumberOfCols = 200;


  // list of characters we use for drawing boxes
  window.boxChars1 = UC.BOX_CHARS;
  window.boxChars1.push(UC.LATIN_PLUS_SIGN);
  window.boxChars1.push(UC.LATIN_HYPHEN_MINUS);
  window.boxChars1.push(UC.LATIN_VERTICAL_LINE);

  // list of characters we use for drawing arrows
  window.arrowChars1 = [">", "<", "^", "v"];

  // Draw styles
  window.drawStyles = {};
  window.drawStyles["0"] = {"horizontal":"-", "vertical":"|", "corner":"+", "cross":"+"};
  window.drawStyles["1"] = {"horizontal":UC.BOX_HORIZONTAL, "vertical":UC.BOX_VERTICAL, "corner":UC.BOX_CROSS, "cross":UC.BOX_CROSS,
  "corner-top-left":UC.BOX_CORNER_TOP_LEFT, "corner-top-right":UC.BOX_CORNER_TOP_RIGHT, "corner-bottom-left":UC.BOX_CORNER_BOTTOM_LEFT, "corner-bottom-right":UC.BOX_CORNER_BOTTOM_RIGHT,
  "horizontal-light-up":UC.BOX_HORIZONTAL_LIGHT_UP, "horizontal-light-down":UC.BOX_HORIZONTAL_LIGHT_DOWN,
  "vertical-light-right":UC.BOX_VERTICAL_LIGHT_RIGHT, "vertical-light-left":UC.BOX_VERTICAL_LIGHT_LEFT
  };

  // ascii|latin-1-supplement|lat-extended-a|latin-extended-b|arrows|box-drawing|
  window.printableCharsRegex = /[ -~]|[¡-ÿ]|[Ā-ſ]|[ƀ-ɏ]|[←-⇿]|[─-╿]/iu;



  // Basic constants
  window.zeroCoord = new Coord(0,0)
  leftCoord = new Coord(-1, 0)
  rightCoord = new Coord(1, 0)
  topCoord = new Coord(0, -1)
  bottomCoord = new Coord(0, 1);
  window.contextCoords = [leftCoord, rightCoord, topCoord, bottomCoord];

}
