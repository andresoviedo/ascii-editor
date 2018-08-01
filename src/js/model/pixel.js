//------------------------------------------------- PIXEL CLASS -----------------------------------------------------//

function Pixel() {
	this.class = "Pixel";
	// value of the pixel (drawchar or text)
	this.value = null;
	// temp value while the user is still using the tool
	this.tempValue = null;
}
/**
 * Get the pixel value to be drawn to the canvas. Always draw the temporary value if any
 */
Pixel.prototype = {
	getValue : function() {
		return this.tempValue != null? this.tempValue : this.value;
	}
	, clear : function() {
		this.value = null;
		this.tempValue = null;
	}
	, isEmpty : function() {
		return this.value == null && this.tempValue == null;
	}
}
