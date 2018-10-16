//-------------------------------------------------- COORD CLASS  ---------------------------------------------------//

/**
 * A simple pair of coordinates x,y for to use to locate any pixel
 */
class Coord {
	class = 'Coord';
	readonly x: number;
	readonly y: number;

	constructor(x: number, y: number){
		this.x = x;
		this.y = y;
	}
	toString()	{
			return "Coord["+this.x+","+this.y+"]";
	}
	add(other: Coord) {
		return new Coord(this.x + other.x, this.y + other.y);
	}
	equals(other: Coord){
		return this.x == other.x && this.y == other.y;
	}
	substract(other: Coord){
		return new Coord(this.x - other.x, this.y - other.y);
	}
	getLength() {
	  return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	clone() {
		return new Coord(this.x, this.y);
	}
	hasSameAxis(other: Coord) {
		return this.x == other.x || this.y == other.y;
	}
	isOppositeDir(other: Coord){
		return this.add(other).getLength() == 0;
	}
}
