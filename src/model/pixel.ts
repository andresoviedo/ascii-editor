namespace model {

	export class Pixel {

		static class = "Pixel";
		// value of the pixel (drawchar or text)
		value? : string;
		// temp value while the user is still using the tool
		tempValue? : string;

		/**
		 * Get the pixel value to be drawn to the canvas. Always draw the temporary value if any
		 */
		
		getValue() {
			return this.tempValue != undefined? this.tempValue : this.value;
		}

		clear() {
			this.value = undefined;
			this.tempValue = undefined;
		}

		isEmpty() {
			return this.value == undefined && this.tempValue == undefined;
		}
		
	}
}