class FaceVis {
	static colors = {
		"r": "rgb(255, 0, 0)",
		"g": "rgb(0, 255, 0)",
		"b": "rgb(0, 0, 255)",
		"o": "rgb(255, 128, 0)",
		"y": "rgb(255, 255, 0)",
		"w": "rgb(255, 255, 255)",
		"k": "rgb(50, 50, 50)"
 	}

 	static validateInput(data) {
 		if (!((typeof data === 'string' || data instanceof String) && data.length === 9)) {
 			throw Error(`Invalid data for Face Visualizer ("${data}"): must be a string of length 9.`);
 		}
 	}

	constructor(canvas, data) {
		FaceVis.validateInput(data);
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.data = data; // string of 9 characters
		this.canvas.height = this.canvas.width;
		this.size = Math.floor(canvas.width / 4);
		this.ctx.strokeStyle = "rgb(0, 0, 0)";
		this.ctx.lineWidth = 5;
		this.ctx.lineJoin = "round";
	}

	draw() {
		for (let x = 0; x < 3; x++) {
			for (let y = 0; y < 3; y++) {
				this.ctx.fillStyle = FaceVis.colors[this.data[x + y*3]];
				this.ctx.beginPath();
				this.ctx.rect(x * this.size + this.canvas.width / 8, y * this.size  + this.canvas.width / 8, this.size, this.size);
				this.ctx.fill();
				this.ctx.stroke();
			}
		}
	}
}