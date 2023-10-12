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
ImageProcessor.getPixel = (data, x, y) => {
	return data.data.slice((x + y * data.width) * 4, (x + y * data.width) * 4 + 4);
}

ImageProcessor.setPixel = (data, x, y, color) => {
	startIndex = (x + y * data.width) * 4;
	color.forEach((c, i) => data.data[startIndex + i] = c);
}

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