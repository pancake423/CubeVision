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
	//order: up, left, front, right, back, down
	static faces = [
		[7, 5, 3],
		[7, 3, 6],
		[3, 1, 2],
		[1, 5, 0],
		[5, 7, 4],
		[2, 0, 6]
	];
	static colors = {
		"r": "rgb(255, 0, 0)",
		"g": "rgb(0, 255, 0)",
		"b": "rgb(0, 0, 255)",
		"o": "rgb(255, 128, 0)",
		"y": "rgb(255, 255, 0)",
		"w": "rgb(255, 255, 255)",
		"k": "rgb(50, 50, 50)"
 	}
	static zScaleFactor = 0.001;
	static zShiftFactor = 0.25;

	static to2D(x, y, z) {
		return [x * (1 + z * CubeVis.zScaleFactor), y * (1 + z * CubeVis.zScaleFactor) + z*CubeVis.zShiftFactor, z];
	}

	static vecSub(v1, v2) {
		return v1.map((c, i) => c - v2[i]);
	}

	static vecAdd(v1, v2) {
		return v1.map((c, i) => c + v2[i]);
	}

	static vecMult(v, n) {
		return v.map(c => c * n);
	}

	constructor(canvas, faceData) {
		// Should this be opinionated?
		// FaceJoiner.checkValidInput(faceData);
		this.data = faceData;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.ctx.strokeStyle = "rgb(0, 0, 0)";
		this.ctx.lineWidth = Math.min(canvas.width, canvas.height) * 0.01;
		this.ctx.lineJoin = "round";
		this.rotXZ = -0.64;
		this.rotYZ = -0.27;
		this.radius = Math.min(canvas.width, canvas.height) * 0.2;
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

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		//translate corners from default position to rotated/scaled position
		const corners = CubeVis.corners.map(c => this.translate(...c));

		//interpolate beween corners to get the positions of the cubies
		//translate to 2D, order by z-index, render.
		let cubies = []
		CubeVis.faces.forEach((f, i) => {
			cubies = cubies.concat(this.getCubies(f.map(c => corners[c]), this.data[i]));
		});
		//TODO: sort cubies by z index, render.
		const avgZ = (l) => {
			let tz = 0;
			l.forEach(p => tz += p[2]);
			return tz / l.length;
		}
		cubies.sort((a, b) => {
			const aDepth = avgZ(a[0]);
			const bDepth = avgZ(b[0]);
			if (aDepth < bDepth) return -1;
			else if (aDepth > bDepth) return 1;
			return 0;
		});
		cubies.forEach(params => this.drawCubie(...params));

		if (this.active) requestAnimationFrame(() => {this.draw()});
	}
	getCubies(cornerList, data) {
		// corner order: top left, top right, bottom left, [bottom right.]
		// data is a 9-character face string.
		const start = cornerList[0];
		const horiz = CubeVis.vecSub(cornerList[1], start);
		const vert = CubeVis.vecSub(cornerList[2], start);

		const out = [];

		for (let i = 0; i < 9; i++) {
			const x = i % 3;
			const y = Math.floor(i / 3);
			const color = data[i];

			let points = [
				[x, y],
				[x + 1, y],
				[x + 1, y + 1],
				[x, y + 1]
			];
			points = points.map(p => 
				CubeVis.vecAdd(CubeVis.vecAdd(start, CubeVis.vecMult(horiz, p[0] / 3)), CubeVis.vecMult(vert, p[1] / 3))
			);
			points = points.map(p => CubeVis.vecAdd(CubeVis.to2D(...p), [this.canvas.width/2, this.canvas.height/2, 0]));
			out.push([points, color]);
		}
		return out;
	}
	drawCubie(points, color) {
		this.ctx.beginPath();
		this.ctx.fillStyle = CubeVis.colors[color];
		this.ctx.moveTo(...points[points.length-1]);
		for (const p of points) {
			this.ctx.lineTo(...p);
		}
		this.ctx.fill();
		this.ctx.stroke();
	}

	translate(x, y, z) {
		//find distance and angle to x/z axis
		let [outX, outY, outZ] = [x, y, z];
		
		const dist_xz = Math.sqrt(x*x + z*z);
		const angle_xz = Math.atan2(z, x);
		outX = Math.cos(angle_xz + this.rotXZ) * dist_xz;
		outZ = Math.sin(angle_xz + this.rotXZ) * dist_xz;

		const dist_yz = Math.sqrt(y*y + outZ*outZ);
		const angle_yz = Math.atan2(outZ, y);
		outY = Math.cos(angle_yz + this.rotYZ) * dist_yz;
		outZ = Math.sin(angle_yz + this.rotYZ) * dist_yz;

		return [outX, outY, outZ].map(v => v*this.radius);
	}
}