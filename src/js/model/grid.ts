//-------------------------------------------------- GRID CLASS -----------------------------------------------------//

/**
 * This class holds the pixels matrix and a stack for faster access to pixels being modified
 * The matrix is an array of cols x rows (x, y)
 */
class Grid {
	class = 'Grid';
	cols = window.defaultNumberOfCols;
	rows = window.defaultNumberOfRows;
	matrix: Pixel[][] = Array(this.cols);
	pixelsStack: PixelPosition[] = [];
	changed = true;

	constructor(){
		for (let a = 0;a < this.matrix.length;a++) {
			this.matrix[a] = Array(this.rows);
			for (let b = 0;b < this.matrix[a].length;b++) {
				this.matrix[a][b] = new Pixel;
			}
		}
		if(typeof(Storage) !== "undefined") {
			let previousData = localStorage.getItem("data");
			if (previousData != null){
				this.import(previousData, new Coord(0,0), true, true);
				this.commit();
			}
		}
	}

  isOutOfBounds(coord: Coord): boolean{
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
  getPixel(coord: Coord){
			if (this.isOutOfBounds(coord)){
				return undefined;
			}
			return this.matrix[coord.x][coord.y];
	}
	/**
	 * Clears/reset the whole matrix of pixels
	 */
  clear(start?: Coord, final?: Coord) {
		 	console.log("Clearing grid from '"+start+"' to '"+final+"'...");
		 	let startRow = start? start.x : 0;
			let finalRow = final? final.x : this.matrix.length -1;
			let startCol = start? start.y : 0;
			let finalCol = final? final.y : this.matrix[0].length -1
			for (var row = startRow; row <= finalRow; row++) {
				for (var col = startCol; col <= finalCol; col++) {
					if (this.isOutOfBounds(new Coord(row,col))) continue;
					this.matrix[row][col].clear();
				}
			}
			this.changed = true;
	}
  stackPixel(coord: Coord, value: string|null) {
		if (this.isOutOfBounds(coord)) return;
		if (value != null && value != "" && !window.printableCharsRegex.test(value)) throw new Error("Char non recognized ["+value.charCodeAt(0)+"]");
		let pixel = this.getPixel(coord);
		this.pixelsStack.push(new PixelPosition(coord, pixel));
		pixel.tempValue = value;
		this.changed = true;
	}
  stackArea(area: Box, value?: undefined) {
		for (let minX = area.minX; minX <= area.maxX; minX++) {
			for (let minY = area.minY; minY <= area.maxY; minY++) {
				// get pixel we are moving
				let pixelCoord = new Coord(minX, minY);
				let pixelValue = this.getPixel(pixelCoord).getValue();
				this.stackPixel(pixelCoord, " ");
			}
		}
	}
  savePixel(coord: Coord, value: string) {
		if (this.getPixel(coord).getValue() != value){
			this.stackPixel(coord, value);
		}
	}
	/**
	 * Clears the stack so we have no temporary pixels to be drawn
	 */
  rollback() {
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
  import(text:string, coord:Coord, ommitBlanks?:boolean, ommitUnrecognized?:boolean) {
		let lines = text.split("\n");
		for (let e = 0;e < lines.length;e++) {
			for (let g = lines[e], l = 0;l < g.length;l++) {
				let h = g.charAt(l);
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
  moveArea(area: Box, diff: Coord) {
		// stack the area we are moving
		this.stackArea(area);
		// move the area to new position
		for (let minX = area.minX; minX <= area.maxX; minX++) {
			for (let minY = area.minY; minY <= area.maxY; minY++) {
				// get pixel we are moving
				let pixelCoord = new Coord(minX, minY);
				// get current pixel value
				let pixelValue = this.getPixel(pixelCoord).value;
				// get pixel we are overwriting
				let pixelCoord2 = pixelCoord.add(diff);
				// check if pixel is inside canvas
				if (this.isOutOfBounds(pixelCoord2)) continue;
				// get pixel value we are overwriting
				let pixelValue2 = this.getPixel(pixelCoord2).getValue();
				// stack the pixel we are overwriting
				this.stackPixel(pixelCoord2, pixelValue != null? pixelValue : pixelValue2 != null && pixelValue2 != ""? pixelValue2 : " ");
			}
		}
	}
  export(){
		let data = "";
		for (let row=0; row<this.rows; row++){
			data += "\n";
			for (let col=0; col<this.cols; col++){
				let pixel = this.getPixel(new Coord(col, row));
				let pixelValue = pixel.getValue();
				data += pixelValue == null? " " : pixelValue;
			}
		}
		if (data.startsWith("\n")){
			data = data.substring(1);
		}
		return data;
	}
  commit() {
		for (let b in this.pixelsStack) {
			let pixel = this.pixelsStack[b].pixel;
			let newValue = pixel.getValue();
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
