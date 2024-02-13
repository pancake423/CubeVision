window.onload = () => {
	document.querySelector("#file-input").onchange = handleFileUpload;
	const v = document.getElementById("vis");
	const cube = new CubeVis(v, ["kkkkkkkkk", "ooooooooo", "ggggggggg", "rrrrrrrrr", "bbbbbbbbb", "yyyyyyyyy"]);
	cube.start();
}

function handleFileUpload(e) {
	blobToImageData(e.srcElement.files[0])
	.then((data) => handle(data));
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

function handle(data) {
	const parsed = ImageProcessor.process(data).toUpperCase();
	showImageData(data);
	console.log(parsed)
	document.getElementById("output-r1").innerText = parsed.substring(0, 3).split('').join(' ');
	document.getElementById("output-r2").innerText = parsed.substring(3, 6).split('').join(' ');
	document.getElementById("output-r3").innerText = parsed.substring(6).split('').join(' ');
}