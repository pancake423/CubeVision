const ImageProcessor = {
	SCALE_PX: 200, //image is scaled down to this width in pixels
	COLOR_THRESH: 70, //used by background remover. Difference in color channels less than COLOR_THRESH are considered matching
	BG_SCAN_THICKNESS: 5, //pixel thickness of region around border used to calculate background color.
	N_SCAN_STEPS: 90, // number of scan steps used by shape detection algorithm
	SCALE_SAMPLE_DENSITY: 0.1, // fraction of total pixels sampled in each region when scaling down an image.
	BG_MAX_ITER: 5, // Number of iterations of removing the found background color from the image.
	GAP_TOL: 10, //Number of pixels in each direction to reach a solid pixel in order to backfill
	VALUE_TOLERANCE = 0.2, //square detection. fractional tolerance of corner distance from center
	ANGLE_TOLERANCE = Math.PI / 12, //square detection. absolute difference between two corners must be within this value of ANGLE_GAP
	ANGLE_GAP = Math.PI / 2, // square detection. ideal angle between corners
	TILE_N_SAMPLES = 25 // number of pixels sampled from the square to determine each tile's color
};

//attempts to process the given image data as a picture of a rubik's cube face.
ImageProcessor.process = (data) => {
	/*
	ALGORITHM EXPLANATION
	1. Scale the image down to a width of SCALE_PX pixels.
		This is done for two reasons. First, smoothing pixel colors makes it easier to remove the background.
		Second, scaling down the image makes processing faster.
	2. Remove the background from the image.
		An iterative process. The average color of a BG_SCAN_THICKNESS border around the image is found. Any pixels
		within COLOR_THRESH of the background color are removed. This process is repeated until there are no solid
		pixels left in the border or we reach BG_MAX_ITER iterations.
		I chose this algorithm because it is simple and easy to implement, but works on any solid-colored and most
		textured backgrounds. 
	3. Fill gaps in the remaining solid portion of the image that were removed in step 2
		Any transparent pixels that are within GAP_TOL of a solid color pixel in at least 2 cardinal directions
		are filled with a color that is a weighted average of those neighbors.
		In order for the shape scanner (step 5) to work correctly, the opaque image region must be continuous.
	4. Find the center of the image.
		Take the x and y coordinate of every solid pixel and average them. The center is used when scanning the
		shape of the image.
	5. Scan the shape of the image.
		Move radially about the center. At each sampled angle, find the distance to reach a transparent pixel.
		Since cubes can be rotated arbitrarily, this radial scan makes it easier to identify corners.
	6. Get the maxima (corners) from the shape.
		Calculus :). Take the first and second derivative. return all points where the first derivative is zero,
		and the second derivative is negative. These correspond to local maxima, which represent corners.
	7. Check if the shape we found is a square. If it is, continue, if not, end here and return an empty string.
	8. Get the tile colors from the square face.
		Split the square region found into thirds with respect to the x and y axis. Find the average color
		of each of those 9 regions. Returns them as a 1d array in "reading order", top left to bottom right.
	9. Feed each colors into the KNN model, and return the corresponding facelet letter.
		The output is a 9-letter facelet string representing that face
	*/
	const img = ImageProcessor.fillGaps(
		ImageProcessor.removeBackground(
			ImageProcessor.scale(data, ImageProcessor.SCALE_PX),
			ImageProcessor.BG_SCAN_THICKNESS, 
			ImageProcessor.COLOR_THRESH)
	);
	const center = ImageProcessor.findCenter(img);
	const maxima = ImageProcessor.getMaxima(
		ImageProcessor.smoothData(
			ImageProcessor.scanShape(img, center, ImageProcessor.N_SCAN_STEPS)
		)
	);
	if (!ImageProcessor.isSquare(maxima)) {
		return "";
	}
	return ImageProcessor.mapToLetters(
		ImageProcessor.getTileColors(
			img, 
			ImageProcessor.getSquareFunction(
				ImageProcessor.polarToCartesian(maxima, center)
			)
		),
		ImageProcessor.trainingData
	).join("");

}

//scales an image to be targetWidth pixels wide.
ImageProcessor.scale = (data, targetWidth) => {
	const DENSITY = ImageProcessor.SCALE_SAMPLE_DENSITY;

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

ImageProcessor.crop = (data, sx, sy, dx, dy) => {
	const a = new Uint8ClampedArray(dx*dy*4);
	for (let y = sy; y < sy + dy; y++) {
		const startIndex = (sx + y * data.width) * 4;
		const transfer = data.data.slice(startIndex, startIndex + dx*4);

		transfer.forEach((v, i) => {
			a[y-sy + i] = v;
		});
	}

	const out = new ImageData(a, dx, dy);
	return out;
}

//returns the average channel values of a given region of an image
ImageProcessor.getAverageColor = (data, x, y, dx, dy, sampleDensity, ignoreTransparent=false) => {
	let totals = [0, 0, 0, 0];

	const nSamples = Math.ceil(dx * dy * sampleDensity);
	let countAccepted = 0;

	for (let i = 0; i < nSamples; i++) {
		const xpos = Math.floor(Math.random() * dx) + x;
		const ypos = Math.floor(Math.random() * dy) + y;
		const p = ImageProcessor.getPixel(data, xpos, ypos);
		if (ignoreTransparent == false || p[3] != 0) {
			totals = totals.map((v, i) => v + p[i]);
			countAccepted++;
		}
	}
	if (countAccepted == 0) return [0, 0, 0, 0];
	return totals.map((v) => Math.floor(v /= countAccepted));
}

/*
Approximates the background color of an image by taking a <thickness> wide
strip around the outside of the image.

returns the average color of this region.
*/
ImageProcessor.getBackgroundColor = (data, thickness) => {
	let colors = [
		ImageProcessor.getAverageColor(data, 0, 0, data.width, thickness, 1, true),
		ImageProcessor.getAverageColor(data, 0, data.height-thickness, data.width, thickness, 1, true),
		ImageProcessor.getAverageColor(data, 0, 0, thickness, data.height, 1, true),
		ImageProcessor.getAverageColor(data, data.width-thickness, 0, thickness, data.height, 1, true)
	];
	sum = [0, 0, 0];
	colors.forEach(color => {
		for (let i = 0; i < 3; i++) sum[i] += color[i];
	});
	return sum.map(v => Math.floor(v/3));
}
ImageProcessor.getBorderAlpha = (data, thickness) => {
	return ImageProcessor.getAverageColor(data, 0, 0, data.width, thickness, 1)[3]
		+ ImageProcessor.getAverageColor(data, 0, data.height-thickness, data.width, thickness, 1)[3]
		+ ImageProcessor.getAverageColor(data, 0, 0, thickness, data.height, 1)[3]
		+ ImageProcessor.getAverageColor(data, data.width-thickness, 0, thickness, data.height, 1)[3]
}

/*
set color of all pixels within <threshold> of colorMatch on all three channels to transparent black.
*/
ImageProcessor.filterColorRegions = (data, colorMatch, threshold) => {
	const out = ImageProcessor.copy(data);

	for (let x = 0; x < data.width; x++) {
		for (let y = 0; y < data.height; y++) {
			const color = ImageProcessor.getPixel(data, x, y);
			if (
				Math.abs(color[0] - colorMatch[0]) < threshold
				&& Math.abs(color[1] - colorMatch[1]) < threshold
				&& Math.abs(color[2] - colorMatch[2]) < threshold
			) {
				ImageProcessor.setPixel(out, x, y, [0, 0, 0, 0]);
			}
		}
	}
	return out;
}

ImageProcessor.removeBackground = (data, thickness, threshold) => {
	let out = ImageProcessor.copy(data);
	let iter = 0;
	const MAX_ITER = ImageProcessor.BG_MAX_ITER;
	while (ImageProcessor.getBorderAlpha(out, thickness) > 0 && iter < MAX_ITER) {
		const color = ImageProcessor.getBackgroundColor(out, thickness);
		out = ImageProcessor.filterColorRegions(out, color, threshold);
		iter++;
	}

	return out;
}

/*
all pixels that have a non-transparent neighbor in at least three directions get filled with a weighted
average of all nearest neighbor's color.
*/
ImageProcessor.fillGaps = (data) => {
	let out = ImageProcessor.copy(data);

	const GAP_TOL = ImageProcessor.GAP_TOL; //distance to solid neighbors to fill gaps.
	
	const getPixelAlpha = (data, x, y) => {
		return data.data[(x + y * data.width) * 4 + 3];
	}

	//!! calling this with dx=0 and dy=0 will result in an infinite loop.
	const scan = (data, sx, sy, dx, dy, tol) => {
		let x = sx;
		let y = sy;
		for (i = 0; i < tol && x >= 0 && x < data.width && y >= 0 && y < data.height; i++) {
			x += dx;
			y += dy;
			if (getPixelAlpha(data, x, y) > 0) {
				return [x, y];
			}
		}
		return -1;
	}

	const fillDirections = [
		[0, 1],
		[0, -1],
		[1, 0],
		[-1, 0],
		[1, 1],
		[-1, -1],
		[1, -1],
		[-1, 1]

	];

	for (let x = 0; x < data.width; x++) {
		for (let y = 0; y < data.height; y++) {
			if (getPixelAlpha(data, x, y) != 0) {
				continue;
			}
			const valid = [];
			for (let i = 0; i < fillDirections.length; i++) {
				const res = scan(data, x, y, ...fillDirections[i], GAP_TOL);
				if (res != -1) {
					valid.push(res);
				}
			}
			if (valid.length >= 5) {
				//set pixel to average of px colors
				let newColor = [0, 0, 0, 0];
				valid.forEach(v => {
					const p = ImageProcessor.getPixel(data, ...v);
					p.forEach((v, i) => newColor[i] += v);
				});
				newColor = newColor.map(v => Math.floor(v/valid.length));
				ImageProcessor.setPixel(out, x, y, newColor);
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
		for (let r = 0; r <= maxRadius; r++) {
			const x = Math.floor(Math.cos(theta) * r + center[0]);
			const y = Math.floor(Math.sin(theta) * r + center[1]);

			const a = ImageProcessor.getPixel(data, x, y)[3];

			if (a !== 255) {
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

	while (lowerBound < points.length-1 && points[lowerBound + 1][0] < x) {
		lowerBound++;
	}

	if (lowerBound == 0 || lowerBound == points.length-1) return points[lowerBound][1];

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
	//maybe only look at 4 most extreme (in terms of second derivative value) maxima
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

TODO: make a more optimistic determination function that passes all images that might potentially be square
*/
ImageProcessor.isSquare = (maxima) => {
	// looking for exactly 4 maxima about 90 degrees (pi/2 radians) apart, about the same height.
	const VALUE_TOLERANCE = ImageProcessor.VALUE_TOLERANCE;
	const ANGLE_TOLERANCE = ImageProcessor.ANGLE_TOLERANCE;
	const ANGLE_GAP = ImageProcessor.ANGLE_GAP;

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
			colors.push(ImageProcessor.sampleRegion(image, f, u, v, 1/n, 1/n, ImageProcessor.TILE_N_SAMPLES));
		}
	}
	return colors;
}
ImageProcessor.sampleRegion = (image, f, u, v, deltau, deltav, n=25) => {
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
		let minDist = 450;
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