interface Window {
  defaultFont: string
  defaultZoom: number
  defaultNumberOfRows: number;
  defaultNumberOfCols: number;
  boxChars1: string[];
  arrowChars1: string[];
  drawStyles: Record<string, DrawStyle>
  printableCharsRegex: RegExp
  zeroCoord: Coord
  contextCoords: [Coord, Coord, Coord, Coord]
}

interface DrawStyle {
  horizontal: string
  vertical: string
  corner: string
  cross: string
  "corner-top-left"?:string,
  "corner-top-right"?:string,
  "corner-bottom-left"?:string,
  "corner-bottom-right"?:string,
  "horizontal-light-up"?:string,
  "horizontal-light-down"?:string,
  "vertical-light-right"?:string,
  "vertical-light-left"?:string,

}
