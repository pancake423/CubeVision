const FACE_DATA = {
    "r": false,
    "g": false,
    "b": false,
    "o": false,
    "w": false,
    "y": false
}
var CUBE;

window.onload = () => {
    Monocle.setImageHandler(handleImage);

    CUBE = new CubeVis(document.querySelector("#canvas-3dvis"), ["kkkkkkkkk", "kkkkkkkkk", "kkkkkkkkk", "kkkkkkkkk", "kkkkkkkkk", "kkkkkkkkk"]);
    document.querySelector("#button-connect").onclick = connect;
    document.querySelector("#button-reconnect").onclick = connect;
    document.querySelector("#button-restart").onclick = reset;

    connectScreen();
}

function makeTableRow(imageData, result, faceString) {
    const row = document.createElement("div");
    row.className = "table-row";
    
    const rawImage = document.createElement("canvas");
    rawImage.width = 640;
    rawImage.height = 400;
    
    const resultString = document.createElement("p");
    resultString.innerText = result;

    const faceImage = document.createElement("canvas");
    faceImage.width = 400;
    const face = new FaceVis(faceImage, faceString);

    row.appendChild(rawImage);
    row.appendChild(resultString);
    row.appendChild(faceImage);
    const parent = document.querySelector("#table-body")
    parent.appendChild(row);
    parent.scrollTop = parent.scrollHeight;
    face.draw();
    rawImage.getContext("2d").putImageData(imageData, 0, 0);
}

function setOpacity(l, o) {
    l.forEach(id => document.querySelector('#' + id).style.opacity = o);
}

function connectScreen() {
    setOpacity(["button-connect"], 1);
    setOpacity(["button-reconnect", "button-restart", "p-solution", "faces-found", "canvas-3dvis", "table-images", "button-disconnect"], 0);
    CUBE.stop();
}

function imageProcessorScreen() {
    setOpacity(["button-reconnect", "button-restart", "faces-found", "table-images", "button-disconnect"], 1);
    setOpacity(["button-connect", "p-solution", "canvas-3dvis"], 0);
    CUBE.stop();
}

function solutionScreen() {
    setOpacity(["button-reconnect", "button-restart", "p-solution", "canvas-3dvis", "button-disconnect"], 1);
    setOpacity(["button-connect", "faces-found", "table-images"], 0);
    CUBE.start();
}

function connect() {
    Monocle.connect().then(_ => imageProcessorScreen())
}

function reset() {
    // TODO: send reset signal to moncle, clear image cache or show reconnect screen depending on monocle behavior
}

function resetFaceIndicators() {
    const color = getComputedStyle(document.body).getPropertyValue('--face-hidden-color');
    Object.keys(FaceVis.colors).forEach(id => {if (id !== "k") document.querySelector("#" + id).style.color = color});
}

function colorFaceIndicator(letter) {
    document.querySelector("#" + letter).style.color = FaceVis.colors[letter]
}

function handleImage(data) {
    const parsed = ImageProcessor.process(data);
    // figure out if parsed successfully
    // add row to table page
    // send response to monocle
    if (parsed === "") {
        // image processing failed
        makeTableRow(data, "Invalid", "kkkkkkkkk");
        Monocle.transmit("face:fail");
    } else {
        // image processing success
        const colorMap = {
            "r": "Red",
            "g": "Green",
            "b": "Blue",
            "o": "Orange",
            "w": "White",
            "y": "Yellow"
        }
        const faceColor = colorMap[parsed[4]];
        makeTableRow(data, `${faceColor} face scanned.`, parsed);
        colorFaceIndicator(parsed[4]);
        FACE_DATA[parsed[4]] = parsed;
        Monocle.transmit("face:" + faceColor.toLowerCase());
        if (!Object.values(FACE_DATA).includes(false)) {
            // all faces found.
            solve();
        }
    }
}

function solve() {
    solutionScreen();
    const cubeData = FaceJoiner.join(Object.values(FACE_DATA));
	CUBE.data = cubeData;
	const solution = Solver.solve(cubeData);
	document.querySelector("#p-solution").innerText = solution;
    Monocle.transmit("cube:" + Solver.stringify(cubeData))
        .then(_ => Monocle.transmit("solution:" + solution));
}