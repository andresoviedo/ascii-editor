//--------------------------------------------- DRAW CLASSES ------------------------------------------------------- //

/**
 * Calculates the mins and max given 2 coordinates
 */
class Box{
	class = 'Box';
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	midX: number;
	midY: number;
	min: Coord;
	max: Coord;
	mid: Coord;

	constructor(coordA: Coord, coordB: Coord) {
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

	contains(coord: Coord){
		return coord && coord.x >= this.minX && coord.x <= this.maxX && coord.y >= this.minY && coord.y <= this.maxY;
	}
	add(coord: Coord){
		return new Box(this.min.add(coord),this.max.add(coord));
	}
	squareSize(){
		// +1 because boxes include bounds
		return (this.maxX-this.minX+1)*(this.maxY-this.minY+1);
	}
	toString(){
		return "Box: ('"+this.min+"'->'"+this.max+"', mid:"+this.mid+")";
	}
}
