namespace model {
	/**
	 * A simple pair of coordinates x,y for to use to locate any pixel
	*/
	export class Coord{

		constructor(public x : number, public y : number) {
		}		

		toString()	{
				return "Coord["+this.x+","+this.y+"]";
		}

		add(other:Coord) {
			return new Coord(this.x + other.x, this.y + other.y);
		}

		equals(other:Coord){
			return this.x == other.x && this.y == other.y;
		}

		substract(other:Coord){
			return new Coord(this.x - other.x, this.y - other.y);
		}

		getLength() {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		}

		clone() {
			return new Coord(this.x, this.y);
		}

		hasSameAxis(other:Coord) {
			return this.x == other.x || this.y == other.y;
		}

		isOppositeDir(other:Coord){
			return this.add(other).getLength() == 0;
		}
	}

}

