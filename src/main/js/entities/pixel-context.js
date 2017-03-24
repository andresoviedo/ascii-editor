/**
 * Encapsulates data for the surrounding pixels
 */
class PixelContext {
	constructor(left, right, top, bottom){
		this.class = 'PixelContext';
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
