window.onload = () => {
	document.querySelector("#file-input").onchange = handleFileUpload;
	const v = document.getElementById("vis");
	const cube = new CubeVis(v, ["kkkkkkkkk", "kkkkkkkkk", "kkkkkkkkk", "kkkkkkkkk", "kkkkkkkkk", "kkkkkkkkk"]);
	cube.start();

	DataCollector.cube = cube;
}

function handleFileUpload(e) {
	DataCollector.clear();
	deleteFaces();
	for (const file of e.srcElement.files) {
		blobToImageData(file)
		.then((data) => handle(data));
	}
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

function showImageData(data, c) {
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
	const parsed = ImageProcessor.process(data);
	const div = document.createElement("div");
	div.className = "face-container";
	const rawImg = document.createElement("canvas");
	rawImg.className = "img-display";
	const parsedImg = document.createElement("canvas");
	parsedImg.className = "img-display";
	div.appendChild(rawImg);
	div.appendChild(parsedImg);
	document.querySelector("#left").appendChild(div);
	showImageData(data, rawImg);
	const f = new FaceVis(parsedImg, parsed);
	f.draw();
	DataCollector.collect(parsed);
	checkAllFacesLoaded();
}

function checkAllFacesLoaded() {
	const data = DataCollector.get();
	if (data.length !== 6) return;

	const cubeData = FaceJoiner.join(data);
	DataCollector.cube.data = cubeData;
}

function deleteFaces() {
	document.querySelector("#left").innerHTML = "";
}