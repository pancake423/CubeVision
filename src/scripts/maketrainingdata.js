/*
CubeVision website?

homepage (explanation)
connect to glasses (connect to AR glasses, send and recieve commands)
use locally (capture images from camera or upload local).


for now: upload an image and process it.
*/

window.onload = () => {
	document.querySelector("#file-input").onchange = handleFileUpload;
}

function handleFileUpload(e) {
	blobToImageData(e.srcElement.files[0])
	.then((data) => display(data));
}

/*
Takes a blob representing an image, and 
returns a promise that resolves to an ImageData object.
*/
function blobToImageData(blob) {
	return createImageBitmap(blob)
	.then((bitmap) => {
		const c = new OffscreenCanvas(bitmap.width, bitmap.height);
		const ctx = c.getContext("2d");

		ctx.drawImage(bitmap, 0, 0);

		return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
	});
}

/*
adds a canvas to the body and draws the provided ImageData to it.
*/
function showImageData(data) {
	const c = document.getElementById("c");
	c.width = data.width;
	c.height = data.height;
	const ctx = c.getContext("2d");
	createImageBitmap(data)
		.then(img => {
			ctx.drawImage(img, 0, 0);
		});

	return ctx;
}

/*
takes an ImageData object and runs it through the cube detection process.
*/
function display(data) {
	const SCALE_PX = 80;
	const DARK_THRESH = 80;
	const original = data;
	const scaled = ImageProcessor.scale(original, SCALE_PX);
	const noBg = ImageProcessor.filterDarkRegions(scaled, DARK_THRESH);
	const center = ImageProcessor.findCenter(noBg);

	const shapeGraph = ImageProcessor.scanShape(noBg, center, 180);
	const smoothedShapeGraph = ImageProcessor.smoothData(shapeGraph);

	const maxima = ImageProcessor.getMaxima(smoothedShapeGraph);
	const corners = ImageProcessor.polarToCartesian(maxima, center);

	const colors = ImageProcessor.getTileColors(noBg, ImageProcessor.getSquareFunction(corners));


	console.log(ImageProcessor.isSquare(maxima));
	console.log(colors);
	console.log(ImageProcessor.mapToLetters(colors, [
		[255, 255, 255, "w"],
		[255, 63, 0, "r"],
		[0, 255, 0, "g"],
		[0, 255, 255, "b"],
		[255, 255, 0, "y"],
		[255, 127, 0, "o"]
	]));


	showImageData(original);
}

function generate() {
	// get actual colors, get user submitted color string, log formatted data to console.
}