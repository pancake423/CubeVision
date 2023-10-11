const ImageProcessor = {};

//attempts to process the given image data as a picture of a rubik's cube face.
ImageProcessor.process = (data) => {

}

//scales an image to be targetWidth pixels wide.
ImageProcessor.scale = (data, targetWidth) => {
	const compressionRatio = data.width / targetWidth;

	const out = new ImageData(targetWidth, Math.floor(data.height) / compressionRatio);


	return out;
}

//returns the [r, g, b, a] values of a given pixel.
ImageProcessor.getPixel = (data, x, y) => {
	return data.slice((x + y * data.width) * 4, (x + y * data.width) * 4 + 4);
}

//returns the average channel values of a given region of an image
imageProcessor.getAverageColor = (data, x, y, dx, dy) => {
	const totals = [0, 0, 0, 0];
	const area = dx * dy;

	for (let xpos = x; xpos < x + dx; xpos++) {
		for (let ypos = y; ypos < y + dy; ypos++) {
			const p = ImageProcessor.getPixel(data, xpos, ypos);
			totals = totals.map((v, i) => v + p[i]);
		}
	}

	return totals.map((v) => Math.floor(v /= area));
}