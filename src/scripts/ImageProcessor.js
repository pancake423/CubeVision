const ImageProcessor = {};

//attempts to process the given image data as a picture of a rubik's cube face.
ImageProcessor.process = (data) => {

}

//scales an image to be targetWidth pixels wide.
ImageProcessor.scale = (data, targetWidth) => {
	const DENSITY = 0.1;

	const compressionRatio = data.width / targetWidth;

	const out = new ImageData(targetWidth, Math.floor(data.height) / compressionRatio);
	for (let x = 0; x < out.width; x++) {
		for (let y = 0; y < out.height; y++) {
			let [r, g, b, a] = ImageProcessor.getAverageColor(
				data, 
				Math.floor(x * compressionRatio),
				Math.floor(y * compressionRatio),
				Math.ceil(compressionRatio),
				Math.ceil(compressionRatio),
				DENSITY
			);
			let idx = (x + y * out.width)*4;
			out.data[idx] = r;
			out.data[idx + 1] = g;
			out.data[idx + 2] = b;
			out.data[idx + 3] = a;
		}
	}

	return out;
}

//returns the [r, g, b, a] values of a given pixel.
//returns transparent black if out-of-bounds.
ImageProcessor.getPixel = (data, x, y) => {
	if (x < 0 || x > data.width || y < 0 || y > data.height) return [0, 0, 0, 0];
	const idx = (x + y * data.width) * 4;
	return data.data.slice(idx, idx + 4);
}

//sets the pixel at x, y of the given image data object, to the colors in color ([r, g, b, a])
ImageProcessor.setPixel = (data, x, y, color) => {
	startIndex = (x + y * data.width) * 4;
	color.forEach((c, i) => data.data[startIndex + i] = c);
}

//makes a copy of an image data object.
ImageProcessor.copy = (data) => {
	let dataCopy = new Uint8ClampedArray(data.data);
	let out = new ImageData(dataCopy, data.width, data.height);
	return out;
}

//returns the average channel values of a given region of an image
ImageProcessor.getAverageColor = (data, x, y, dx, dy, sampleDensity) => {
	let totals = [0, 0, 0, 0];

	const nSamples = Math.ceil(dx * dy * sampleDensity);

	for (let i = 0; i < nSamples; i++) {
		const xpos = Math.floor(Math.random() * dx) + x;
		const ypos = Math.floor(Math.random() * dy) + y;
		const p = ImageProcessor.getPixel(data, xpos, ypos);
		totals = totals.map((v, i) => v + p[i]);
	}

	return totals.map((v) => Math.floor(v /= nSamples));
}

ImageProcessor.filterDarkRegions = (data, brightnessThreshold) => {
	/*
	set color of all pixels below the brightness threshold to [0, 0, 0, 0].
	brightness threshold is max(r, g, b).
	*/
	const out = ImageProcessor.copy(data);

	for (let x = 0; x < data.width; x++) {
		for (let y = 0; y < data.height; y++) {
			const brightness = Math.max(...ImageProcessor.getPixel(data, x, y).slice(0, 3));
			if (brightness < brightnessThreshold) {
				ImageProcessor.setPixel(out, x, y, [0, 0, 0, 0]);
			}
		}
	}
	return out;
}

ImageProcessor.findCenter = (data) => {
	/*
	finds the x/y coordinate of the center of the image, based on averaging the position of all
	non-transparent pixels.
	*/
	let xsum = 0;
	let ysum = 0;
	let n = 0;
	for (let x = 0; x < data.width; x++) {
		for (let y = 0; y < data.height; y++) {
			const a = ImageProcessor.getPixel(data, x, y)[3];
			if (a == 255) {
				xsum += x;
				ysum += y;
				n++;
			}
		}
	}
	return [Math.floor(xsum/n), Math.floor(ysum/n)];
}

ImageProcessor.scanShape = (data, center, n) => {
	/*
		scans the shape of the non-transparent parts of an image
		by scanning inward at various angles around the center.

		for each angle: start outside the image and move in until you find a non-transparent pixel.
		record (theta, r) for each point.
	*/
	const out = []

	const getDistance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(x1-x2, 2));
	const maxRadius = Math.ceil(Math.max(
		getDistance(0, 0, ...center),
		getDistance(0, data.height, ...center),
		getDistance(data.width, 0, ...center),
		getDistance(data.width, data.height, ...center),

	));
	const thetaStep = 2*Math.PI / n;

	for (let theta = 0; theta < 2*Math.PI; theta += thetaStep) {
		let dist = 0
		for (let r = maxRadius; r >= 0; r--) {
			const x = Math.floor(Math.cos(theta) * r + center[0]);
			const y = Math.floor(Math.sin(theta) * r + center[1]);

			const a = ImageProcessor.getPixel(data, x, y)[3];

			if (a == 255) {
				dist = r;
				break;
			}
		}
		out.push([theta, dist]);
	}

	return out;
}
ImageProcessor.smoothData = (points) => {
	/*
	applies two data smoothing functions.

	#1: group all adjacent points with the same y-value.
	#2: set each point's y value to be the average of its two neighbors.
	*/
	console.log(points);
	const grouped = [];
	for (let i = 0; i < points.length; i++) {
		const y = points[i][1];
		const groupStart = i;
		while (i < points.length && points[i][1] == y) {
			i++;
			console.log(y, i);
		}
		i--;

		const x = (points[i][0] + points[groupStart][0]) / 2;

		grouped.push([x, y]);
	}

	const smoothed = [];
	smoothed.push(grouped[0]);
	for (let i = 1; i < grouped.length - 1; i++) {
		smoothed.push(
			[
				(grouped[i-1][0] + grouped[i][0] + grouped[i+1][0])/3,
				(grouped[i-1][1] + grouped[i][1] + grouped[i+1][1])/3
			]
		);
	}
	smoothed.push(grouped[grouped.length-1]);

	return smoothed;
}

ImageProcessor.derivative = (points) => {
	const deriv = [];

	for (let i = 0; i < points.length-1; i++) {
		const slope = (points[i+1][1] - points[i][1]) / (points[i+1][0] - points[i][0]);
		deriv.push([points[i][0], slope]);
	}

	return ImageProcessor.smoothData(deriv);
}