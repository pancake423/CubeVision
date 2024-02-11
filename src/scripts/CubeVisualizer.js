class CubeVis {
	static corners = [
		[1, 1, 1],
		[1, -1, 1],
		[-1, 1, 1],
		[-1, -1, 1],
		[1, 1, -1],
		[1, -1, -1],
		[-1, 1, -1],
		[-1, -1, -1],
	];
	static zScaleFactor = 0.01;
	static zShiftFactor = 0.1;

	static to2D(x, y, z) {
		return [x * (1 + z * CubeVis.zScaleFactor), y * (1 + z * CubeVis.zScaleFactor) + CubeVis.zShiftFactor*z];
	}

	constructor(canvas, faceData) {
		FaceJoiner.checkValidInput(faceData);
		this.data = faceData;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.rotXZ = 0;
		this.rotYZ = 0;
		this.radius = Math.min(canvas.width, canvas.height) / 3;
		this.keys = {
			"left": false,
			"right": false,
			"up": false,
			"down": false
		}
		window.addEventListener("keydown", (e) => this.update(e.keyCode, true));
		window.addEventListener("keyup", (e) => this.update(e.keyCode, false));
		this.active = false;
	}
	start() {
		this.active = true;
		this.draw()
	}
	stop() {
		this.active = false;
	}
	update(keyCode, value) {
		switch (keyCode) {
		case 37:
			//left
			this.keys.left = value;
			break;
		case 38:
			//up
			this.keys.up = value;
			break;
		case 39:
			//right
			this.keys.right = value;
			break;
		case 40:
			//down
			this.keys.down = value;
			break;
		}
	}
	draw() {
		//update rotation based on key presses
		if (this.keys.left) this.rotXZ += 0.01;
		if (this.keys.right) this.rotXZ -= 0.01;
		if (this.keys.up) this.rotYZ += 0.01;
		if (this.keys.down) this.rotYZ -= 0.01;

		//translate corners from default position to rotated/scaled position
		const corners = CubeVis.corners.map(c => this.translate(...c));

		//interpolate beween corners to get the positions of the cubies
		//translate to 2D, order by z-index, render.


		if (this.active) requestAnimationFrame(draw);
	}
	drawCubie(points, color) {

	}

	translate(x, y, z) {
		//find distance and angle to x/z axis
		let [outX, outY, outZ] = [x, y, z];
		
		const dist_xz = Math.sqrt(x*x + z*z);
		const angle_xz = Math.atan2(z, x);
		outX = Math.cos(angle_xz + this.rotXZ) * dist_xz;
		outZ = Math.sin(angle_xz + this.rotXZ) * dist_xz;

		const dist_yz = Math.sqrt(y*y + z*z);
		const angle_yz = Math.atan2(z, y);
		outY = Math.cos(angle_yz + this.rotYZ) * dist_yz;
		outZ = Math.sin(angle_yz + this.rotYZ) * dist_yz;

		return [outX, outY, outZ].map(v => v*this.radius);
	}
}