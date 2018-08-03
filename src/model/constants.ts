/// <reference path="coord.ts" />
/// <reference path="../util/unicode-chars.ts" />

import UC = util.UC;
import Coord = model.Coord;

namespace constants {
  
  // Default font for drawing the ASCII pixels
  export const defaultFont = "10px Courier New";
  // Default canvas zoom. Canvas can be zoomed from 1x (not zoomed) to 4x (zoomed)
  export const defaultZoom = 1;


  // Number of rows for the grid
  export const defaultNumberOfRows = 100;
  // Number of cols for the grid
  export const defaultNumberOfCols = 200;


  // list of characters we use for drawing boxes
  export const boxChars1 = UC.BOX_CHARS;
  boxChars1.push(UC.LATIN_PLUS_SIGN);
  boxChars1.push(UC.LATIN_HYPHEN_MINUS);
  boxChars1.push(UC.LATIN_VERTICAL_LINE);

  // list of characters we use for drawing arrows
  export const arrowChars1 = [">", "<", "^", "v"];

  // Draw styles
  export const drawStyles : any  = {};
  drawStyles["0"] = {"horizontal":"-", "vertical":"|", "corner":"+", "cross":"+"};
  drawStyles["1"] = {"horizontal":UC.BOX_HORIZONTAL, "vertical":UC.BOX_VERTICAL, "corner":UC.BOX_CROSS, "cross":UC.BOX_CROSS,
  "corner-top-left":UC.BOX_CORNER_TOP_LEFT, "corner-top-right":UC.BOX_CORNER_TOP_RIGHT, "corner-bottom-left":UC.BOX_CORNER_BOTTOM_LEFT, "corner-bottom-right":UC.BOX_CORNER_BOTTOM_RIGHT,
  "horizontal-light-up":UC.BOX_HORIZONTAL_LIGHT_UP, "horizontal-light-down":UC.BOX_HORIZONTAL_LIGHT_DOWN,
  "vertical-light-right":UC.BOX_VERTICAL_LIGHT_RIGHT, "vertical-light-left":UC.BOX_VERTICAL_LIGHT_LEFT
  };

  // ascii|latin-1-supplement|lat-extended-a|latin-extended-b|arrows|box-drawing|
  export const printableCharsRegex = /[ -~]|[¡-ÿ]|[Ā-ſ]|[ƀ-ɏ]|[←-⇿]|[─-╿]/iu;



  // Basic constants
  export const zeroCoord = new Coord(0,0), leftCoord = new Coord(-1, 0), rightCoord = new Coord(1, 0), topCoord = new Coord(0, -1), bottomCoord = new Coord(0, 1);
  export const contextCoords = [leftCoord, rightCoord, topCoord, bottomCoord];
}