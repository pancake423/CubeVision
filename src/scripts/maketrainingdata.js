/*
CubeVision website?

homepage (explanation)
connect to glasses (connect to AR glasses, send and recieve commands)
use locally (capture images from camera or upload local).


for now: upload an image and process it.
*/
let COLOR_LIST = [];
let DEBUG_IMG_DATA;

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
function showImageData(data, target="c") {
	const c = document.getElementById(target);
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
	const SCALE_PX = 200;
	const COLOR_THRESH = 70;
	const original = data;
	const scaled = ImageProcessor.scale(original, SCALE_PX);

	const noBg = ImageProcessor.removeBackground(scaled, 5, COLOR_THRESH);
	const filled = ImageProcessor.fillGaps(noBg);
	const center = ImageProcessor.findCenter(filled);

	const shapeGraph = ImageProcessor.scanShape(filled, center, 90);
	const smoothedShapeGraph = ImageProcessor.smoothData(shapeGraph);

	const maxima = ImageProcessor.getMaxima(smoothedShapeGraph);
	if (ImageProcessor.isSquare(maxima) == false) {
		console.log("Error: image is not a square");
		clear();
		showImageData(filled);
		return;
	}
	const corners = ImageProcessor.polarToCartesian(maxima, center);
	const colors = ImageProcessor.getTileColors(filled, ImageProcessor.getSquareFunction(corners));
	showImageData(original);
	showImageData(filled, "c2");
	drawColors(colors);
	COLOR_LIST = colors;
}

function clear() {
	const c = document.getElementById("c");
	const ctx = c.getContext("2d");
	ctx.clearRect(0, 0, c.width, c.height);

	document.querySelector("#cube-string").value = "";
}

function generate() {
	// get actual colors, get user submitted color string, log formatted data string to console.
	if (COLOR_LIST.length == 0) {console.log("Error: no image uploaded"); return}
	let colorString = document.querySelector("#cube-string").value;

	stringOutput = "";
	COLOR_LIST.forEach((color, i) => {
		stringOutput += "["
		color.forEach(channel => {
			stringOutput += channel + ", ";
		});
		stringOutput += `"${colorString[i]}"]`;
		if (i != COLOR_LIST.length - 1) stringOutput += ", ";
		stringOutput += "";
	});
	stringOutput += ",\n"

	document.getElementById("text-output").innerText+=stringOutput;

	clear();

}

function drawColors(colorList) {
	const c = document.getElementById("c3");
	c.width = 300;
	c.height = 300;
	const ctx = c.getContext("2d");
	colorList.forEach((v, i) => {
		ctx.fillStyle = `rgb(${v[0]}, ${v[1]}, ${v[2]})`;
		ctx.fillRect(i%3 * 100, Math.floor(i/3) * 100, 100, 100);
	});

	return ctx;
}