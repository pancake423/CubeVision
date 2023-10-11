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
	.then((data) => console.log(data))
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