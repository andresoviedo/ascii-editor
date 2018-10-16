/**
 * Encapsulates data for the surrounding pixels
 */
class PixelContext {
	class = 'PixelContext';
	left: number;
	right: number;
	bottom: number;
	top: number;
	length: number;

	constructor(left:number, right:number, top:number, bottom:number){
		this.left = left;
		this.right = right;
		this.bottom = bottom;
		this.top = top;
		this.length = this.left + this.right + this.bottom + this.top;
	}
	getLength() {
		return this.length;
	}
	toString() {
		return "PixelContext["+this.left+","+this.right+","+this.bottom+","+this.top+"]";
	}
}
