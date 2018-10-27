//------------------------------------------------- CANVAS CLASS ----------------------------------------------------//

class ASCIICanvas {
  readonly class = 'ASCIICanvas';
  readonly $canvas: JQuery<HTMLCanvasElement>;
  readonly canvasHTML: HTMLCanvasElement;
  readonly canvasContext: CanvasRenderingContext2D;
  readonly grid: Grid;
  readonly events = new CanvasEvents();
  font = window.defaultFont;
  cellWidth: number | null = null;
  cellHeight: number | null = null;
  cellDescend: number | null = null;
  zoom = window.defaultZoom;
  changed = true;

  constructor($canvas: JQuery<HTMLCanvasElement>, grid: Grid) {
    this.class = 'ASCIICanvas';
    this.$canvas = $canvas;
    this.canvasHTML = $canvas.get(0);
    this.canvasContext = this.canvasHTML.getContext("2d");
    this.grid = grid;
  }

  init() {
    let events = this.events;
    events.onKeyDown(this.keyDown.bind(this));
    events.onKeyPress(this.keyPress.bind(this));
    events.onResize(this.resize.bind(this));

    $(window).resize(events.triggerResize.bind(events));
    this.resize();
  }

  getWidth() {
    return this.canvasHTML.width
  }

  getGrid() {
    return this.grid
  }

  getCellWidth() {
    return this.cellWidth
  }

  getCellHeight() {
    return this.cellHeight
  }

  getZoom() {
    return this.zoom
  }

  setZoom(newZoom: number) {
    this.zoom = newZoom
  }

  isFocused() {
    return document.body == document.activeElement;
  }

  getGridCoord(mouseCoord: Coord) {
    // remove zoom
    let unzoomedCoord = new Coord(mouseCoord.x / this.zoom, mouseCoord.y / this.zoom);
    // get pixel located at the specified coordinate
    return new Coord(Math.floor(unzoomedCoord.x / this.cellWidth), Math.floor(unzoomedCoord.y / this.cellHeight));
  }

  setChanged(changed: boolean) {
    this.changed = changed;
  }

  drawRect(coord: Coord, width: number, height: number, style: string) {
    this.canvasContext.fillStyle = style;
    this.canvasContext.fillRect(coord.x * this.cellWidth, coord.y * this.cellHeight, width, height);
  }

  drawText(text: string, coord: Coord, style: string) {
    this.canvasContext.fillStyle = style;
    var canvasCoord = this.getTextLocation(coord);
    this.canvasContext.fillText(text, canvasCoord.x, canvasCoord.y);
  }

  cursor() {
    return "crosshair";
  }

  hasChanged() {
    return this.changed;
  }

  getTextLocation(coord: Coord) {
    return new Coord(coord.x * this.cellWidth, coord.y * this.cellHeight + this.cellHeight - this.cellDescend);
  }

  recalculateCellDimensions() {
    if (this.cellWidth == null) {
      this.cellWidth = getTextWidth(this.canvasContext, window.defaultFont);
      console.log("Cell width '" + this.cellWidth + "'");
    }
    if (this.cellHeight == null) {
      let heightMetrics = getTextHeight(this.canvasContext, this.font, 0, 0, 100, 100);
      this.canvasContext.clearRect(0, 0, 100, 100);
      this.cellHeight = heightMetrics[0];
      this.cellDescend = heightMetrics[1];
      if (this.cellHeight == 0) {
        this.cellHeight = this.cellWidth * 1.5;
      }
      console.log("Cell height '" + this.cellHeight + "', cell descend '" + this.cellDescend + "'");
    }
  }

  private resize() {
    this.recalculateCellDimensions();
    this.canvasHTML.width = this.grid.cols * Math.round(this.cellWidth) * this.zoom;
    this.canvasHTML.height = this.grid.rows * Math.round(this.cellHeight) * this.zoom;
    $("#canvas-container").width(this.canvasHTML.width);
    this.changed = true;
    // console.log("New canvas size ("+this.grid.cols+","+this.grid.rows+","+this.grid.zoom+") '"+this.canvasHTML.width+"/"+this.canvasHTML.height+"'");
  }

  redraw() {

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
    this.canvasContext.lineWidth = 1;
    this.canvasContext.strokeStyle = "#DDDDDD";

    // draw rows
    for (let i = 0; i < this.grid.rows; i++) {
      this.canvasContext.beginPath();
      this.canvasContext.moveTo(0, i * this.cellHeight);
      this.canvasContext.lineTo(this.canvasHTML.width, i * this.cellHeight);
      this.canvasContext.stroke();
    }

    // draw cols
    for (let i = 0; i < this.grid.cols; i++) {
      this.canvasContext.beginPath();
      this.canvasContext.moveTo(i * this.cellWidth, 0);
      this.canvasContext.lineTo(i * this.cellWidth, this.canvasHTML.height);
      this.canvasContext.stroke();
    }

    // print something
    // paint(this.canvasContext,this.font,this.cellWidth);

    // draw uncommited changes
    this.canvasContext.fillStyle = "#669999";
    for (let col = 0; col < this.grid.cols; col++) {
      for (let row = 0; row < this.grid.rows; row++) {
        var pixel = this.grid.getPixel(new Coord(col, row));
        if (pixel.tempValue != null && pixel.tempValue != "") {
          this.canvasContext.fillRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
        }
      }
    }

    // draw pixels
    this.canvasContext.font = window.defaultFont;
    this.canvasContext.fillStyle = "#000000"
    for (let col = 0; col < this.grid.cols; col++) {
      for (let row = 0; row < this.grid.rows; row++) {
        var pixel = this.grid.getPixel(new Coord(col, row));
        var pixelValue = pixel.getValue();
        if (pixelValue != null && pixelValue != "") {
          // for drawing a char it must be at least cellWidth in y axis
          var canvasCoord = this.getTextLocation(new Coord(col, row));
          this.canvasContext.fillText(pixelValue, canvasCoord.x, canvasCoord.y);
        }
      }
    }
    this.canvasContext.stroke();
  }

  private keyDown(eventObject: JQuery.Event) {
    if (this.isFocused() && eventObject.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
      eventObject.preventDefault();
    }
  }

  private keyPress(eventObject: JQuery.Event) {
    if (eventObject.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
      eventObject.preventDefault();
    }
  }
}
