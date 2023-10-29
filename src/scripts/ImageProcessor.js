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

/*
set color of all pixels below the brightness threshold to [0, 0, 0, 0].
brightness threshold is max(r, g, b).
*/
ImageProcessor.filterDarkRegions = (data, brightnessThreshold) => {
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

/*
finds the x/y coordinate of the center of the image, based on averaging the position of all
non-transparent pixels.
*/
ImageProcessor.findCenter = (data) => {
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

/*
scans the shape of the non-transparent parts of an image
by scanning inward at various angles around the center.

for each angle: start outside the image and move in until you find a non-transparent pixel.
record (theta, r) for each point.
*/
ImageProcessor.scanShape = (data, center, n) => {
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

/*
Takes a series of points, and applies two data smoothing functions.

#1: group all adjacent points with the same y-value into one point with the average x-value.
#2: set each point's y value to be the average of its two neighbors.
*/
ImageProcessor.smoothData = (points) => {
	const grouped = [];
	for (let i = 0; i < points.length; i++) {
		const y = points[i][1];
		const groupStart = i;
		while (i < points.length && points[i][1] == y) {
			i++;
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

/*
returns the derivative of a function represented as an array of points.
*/
ImageProcessor.derivative = (points) => {
	const deriv = [];

	for (let i = 0; i < points.length-1; i++) {
		const slope = (points[i+1][1] - points[i][1]) / (points[i+1][0] - points[i][0]);
		deriv.push([points[i][0], slope]);
	}

	return ImageProcessor.smoothData(deriv);
}

/*
Gets the value of a function (represented as an array of points) at a specific X value, using linear interpolation.
*/
ImageProcessor.getFnValue = (points, x) => {
	let lowerBound = 0;

	while (lowerBound < points.length && points[lowerBound + 1][0] < x) {
		lowerBound++;
	}

	if (lowerBound == 0 || lowerBound == points.length) return points[lowerBound][1];

	const slope = (points[lowerBound+1][1]-points[lowerBound][1])/(points[lowerBound+1][0]-points[lowerBound][0]);
	const linear = (x) => slope * (x - points[lowerBound][0]) + points[lowerBound][1];
	return linear(x);
}

/*
Returns an array of points containing all the zeros of a function
*/
ImageProcessor.getZeros = (points) => {
	//check if each interval contains a zero.
	//find the x position of the zero
	const out = [];

	for (let i = 0; i < points.length-1; i++) {
		const p1 = points[i];
		const p2 = points[i+1];

		if (Math.abs(Math.sign(p1[1]) + Math.sign(p2[1])) < 2) {
			const x = p1[0] - p1[1] * ((p2[0] - p1[0]) / (p2[1] - p1[1]));
			out.push([x, 0]);
		}
	}

	return out;
}

/*
returns an array of points containing all the local maxima of a function.
*/
ImageProcessor.getMaxima = (points) => {
	const firstDeriv = ImageProcessor.derivative(points);
	const secondDeriv = ImageProcessor.derivative(firstDeriv);

	const extrema = ImageProcessor.getZeros(firstDeriv);

	const maxima = [];

	for (let i = 0; i < extrema.length; i++) {
		if (ImageProcessor.getFnValue(secondDeriv, extrema[i][0]) < 0) {
			maxima.push([extrema[i][0], ImageProcessor.getFnValue(points, extrema[i][0])]);
		}
	}

	return maxima;
}

/*
converts polar coordinates [theta, r] plus a center [x, y] into cartesian coordinates
*/
ImageProcessor.polarToCartesian = (points, center) => {
	return points.map((v) =>
		[
			center[0] + v[1] * Math.cos(v[0]),
			center[1] + v[1] * Math.sin(v[0])
		]
	);
}

/*
returns true if the image is a square, and false otherwise.
*/
ImageProcessor.isSquare = (maxima) => {
	// looking for exactly 4 maxima about 90 degrees (pi/2 radians) apart, about the same height.
	const VALUE_TOLERANCE = 0.2
	const ANGLE_TOLERANCE = Math.PI / 12;
	const ANGLE_GAP = Math.PI / 2

	if (maxima.length != 4) return false;

	const max = Math.max(...maxima.map(v => v[1]));
	const min = Math.min(...maxima.map(v => v[1]));

	if ((max - min) / max > VALUE_TOLERANCE) return false;

	for (let i = 0; i < maxima.length - 1; i++) {
		const gap = maxima[i+1][0] - maxima[i][0];
		if (gap < ANGLE_GAP - ANGLE_TOLERANCE || gap > ANGLE_GAP + ANGLE_TOLERANCE) return false;
	}

	return true;
}

/*
returns a two variable parametric function f(u, v) where u and v are between zero and one.

The function returns the corresponding coordinate in the square as [x, y], where f(0, 0) is the top left corner.
*/
ImageProcessor.getSquareFunction = (corners) => {
	// point 0 to point 1 describes the reverse X transformation
	// point 1 to point 2 describes the reverse Y transformation

	return (u, v) => {
		let x = corners[2][0];
		let y = corners[2][1];
		x += (corners[0][0] - corners[1][0]) * u;
		y += (corners[0][1] - corners[1][1]) * v;
		x += (corners[1][0] - corners[2][0]) * u;
		y += (corners[1][1] - corners[2][1]) * v;

		return [Math.floor(x), Math.floor(y)];
	}
}

ImageProcessor.getTileColors = (image, f, n=3) => {
	//avg tile colors in "reading order" (top left to bottom right row-wise)
	const colors = [];
	for (let v = 0; v < 1; v += 1/n) {
		for (let u = 0; u < 1; u += 1/n) {
			colors.push(ImageProcessor.sampleRegion(image, f, u, v, 1/n, 1/n));
		}
	}
	return colors;
}
ImageProcessor.sampleRegion = (image, f, u, v, deltau, deltav, n=25) => {
	console.log(image.width, image.height);
	let r = 0;
	let g = 0;
	let b = 0;
	let count = 0;
	for (let i = 0; i < n; i++) {
		const [x, y] = f(u + Math.random() * deltau, v + Math.random() * deltav);
		const px = ImageProcessor.getPixel(image, x, y);
		if (px[3] !== 0) { //not transparent
			r += px[0];
			g += px[1];
			b += px[2];
			count++
		}
	}

	return [Math.floor(r/count), Math.floor(g/count), Math.floor(b/count)];
}

/*
An implementation of the K-nearest neighbors algorithm with k=1. cmap is a 2d array of 
[r, g, b, "faceLetter"]
*/
ImageProcessor.mapToLetters = (colorList, cmap) => {

	return colorList.map(v => {
		let minDist = 255;
		let minIdx = 0;
		for (let i = 0; i < cmap.length; i++) {
			const comp = cmap[i];
			const dist = Math.hypot(v[0] - comp[0], v[1] - comp[1], v[2] - comp[2]);
			if (dist < minDist) {
				minDist = dist;
				minIdx = i;
			}
		}
		return cmap[minIdx][3];
	});
}