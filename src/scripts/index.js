/*
CubeVision website?

homepage (explanation)
connect to glasses (connect to AR glasses, send and recieve commands)
use locally (capture images from camera or locally)


for now: upload an image and process it.
*/

window.onload = () => {
	document.querySelector("#file-input").onchange = handleFileUpload;
}

function handleFileUpload(e) {
	blobToImageData(e.srcElement.files[0])
	.then((data) => demo(data));
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
	const c = document.createElement("canvas");
	c.width = data.width;
	c.height = data.height;
	c.className = "img-display";
	document.body.appendChild(c);
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
function demo(data) {
	const SCALE_PX = 80;
	const DARK_THRESH = 80;
	const original = data;
	const scaled = ImageProcessor.scale(original, SCALE_PX);
	const noBg = ImageProcessor.filterDarkRegions(scaled, DARK_THRESH);
	const center = ImageProcessor.findCenter(noBg);

	const shapeGraph = ImageProcessor.scanShape(noBg, center, 180);
	const smoothedShapeGraph = ImageProcessor.smoothData(shapeGraph);

	const firstDeriv = ImageProcessor.derivative(smoothedShapeGraph);
	const secondDeriv = ImageProcessor.derivative(firstDeriv);

	console.log(stringify(smoothedShapeGraph));
	console.log(stringify(firstDeriv));
	console.log(stringify(secondDeriv));


	showImageData(original);
	showImageData(scaled);
	showImageData(noBg);
	const ctx = showImageData(noBg);
	setTimeout(() => {
		ctx.beginPath();
		ctx.fillStyle="rgb(0, 0, 0)";
		ctx.arc(...center, 2, 0, 2*Math.PI);
		ctx.fill();
	}, 500);

	// crop image to only include mask.
	// mask, find center, find corners based on distance from center
	// divide image into 3x3 grid -> should be easy if you have the 4 corners!
	// find avg color of each tile
	// use KNN model + training data to match colors to letters
}

function stringify(graph) {
	out = "";
	for (i = 0; i < graph.length; i++) {
		out += `(${graph[i][0]}, ${graph[i][1]}), `;
	}
	return out.slice(0, -2);
}