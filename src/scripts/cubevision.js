let FACE_DATA = {
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
    document.querySelector("#button-disconnect").onclick = disconnect;

    connectScreen();
}

function makeTableRow(imageData, processed, faceString) {
    console.log(imageData, processed, faceString);
    const row = document.createElement("div");
    row.className = "table-row";
    
    const rawImage = document.createElement("canvas");
    rawImage.width = 640;
    rawImage.height = 400;
    
    const resultString = document.createElement("canvas");
    resultString.width = 200;
    resultString.height = 125;

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
    resultString.getContext("2d").putImageData(processed, 0, 0);
}

function setOpacity(l, o) {
    l.forEach(id => {
        const el = document.querySelector('#' + id);
        el.style.opacity = o;
        el.style.zIndex = 1000*o;
    });
}

function connectScreen() {
    setOpacity(["button-connect"], 1);
    setOpacity(["button-reconnect", "button-restart", "p-solution", "faces-found", "canvas-3dvis", "table-images", "button-disconnect"], 0);
    CUBE.stop();
    document.querySelector("#title").innerText = "Connect";
}

function imageProcessorScreen() {
    setOpacity(["button-reconnect", "button-restart", "faces-found", "table-images", "button-disconnect"], 1);
    setOpacity(["button-connect", "p-solution", "canvas-3dvis"], 0);
    CUBE.stop();
    document.querySelector("#title").innerText = "Image Processor";
}

function solutionScreen() {
    setOpacity(["button-reconnect", "button-restart", "p-solution", "canvas-3dvis", "button-disconnect"], 1);
    setOpacity(["button-connect", "faces-found", "table-images"], 0);
    CUBE.start();
    document.querySelector("#title").innerText = "Solution";
}

function connect() {
    Monocle.connect().then(_ => imageProcessorScreen());
}

function reset() {
    // TODO: send reset signal to moncle, clear image cache and show processor screen
    Monocle.transmit("reset:reset").then(_ => {
        resetFaceIndicators();
        imageProcessorScreen();
        FACE_DATA = {
            "r": false,
            "g": false,
            "b": false,
            "o": false,
            "w": false,
            "y": false
        };
        document.querySelector("#table-body").innerHTML = "";
    });
}

function disconnect() {
    Monocle.disconnect();
}

function resetFaceIndicators() {
    const color = getComputedStyle(document.body).getPropertyValue('--face-hidden-color');
    Object.keys(FaceVis.colors).forEach(id => {if (id !== "k") document.querySelector("#" + id).style.color = color});
}

function colorFaceIndicator(letter) {
    document.querySelector("#" + letter).style.color = FaceVis.colors[letter]
}

function handleImage(data) {
    const cleaned = ImageProcessor.cleanUp(data);
    const parsed = ImageProcessor.scanAsCube(cleaned);
    // figure out if parsed successfully
    // add row to table
    // send response to monocle
    if (parsed === "") {
        // image processing failed
        makeTableRow(data, cleaned, "kkkkkkkkk");
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
        makeTableRow(data, cleaned, parsed);
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
    let cubeData;
    try {
        cubeData = FaceJoiner.join(Object.values(FACE_DATA));
    } catch {
        alert("Face joiner error: at least one face was scanned incorrectly.");
        return;
    }
	CUBE.data = cubeData;
	const solution = Solver.solve(cubeData);
	document.querySelector("#p-solution p").innerText = solution;
    Monocle.transmit("cube:" + Solver.stringify(cubeData))
        .then(_ => Monocle.transmit("solution:" + solution));
    solutionScreen();
}