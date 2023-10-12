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
		.then(img => ctx.drawImage(img, 0, 0));

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

	console.log(original, scaled, noBg);

	showImageData(original);
	showImageData(scaled);
	showImageData(noBg);

	// crop image to only include mask.
	// somehow figure out rotation angle.
	// compensate for rotation.
	// divide image into 3x3 grid
	// find avg color of each tile
	// use KNN model + training data to match colors to letters
}