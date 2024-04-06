window.onload = () => {
    Monocle.setImageHandler(handleImage);
}

function makeTableRow(imageData, result, faceString) {
    const row = document.createElement("tr");

    const d1 = document.createElement("td");
    const d2 = document.createElement("td");
    const d3 = document.createElement("td");
    
    const rawImage = document.createElement("canvas");
    rawImage.width = 640;
    rawImage.height = 400;
    
    const resultString = document.createElement("p");
    resultString.innerText = result;

    const faceImage = document.createElement("canvas");
    faceImage.width = 400;
    const face = new FaceVis(faceImage, faceString);

    d1.appendChild(rawImage);
    d2.appendChild(resultString);
    d3.appendChild(faceImage);
    row.appendChild(d1);
    row.appendChild(d2);
    row.appendChild(d3);
    document.body.appendChild(row); // TODO
    face.draw();
    rawImage.getContext("2d").putImageData(imageData, 0, 0);
}

function handleImage(data) {
    const parsed = ImageProcessor.process(data);
    // figure out if parsed successfully
    // add row to table page
    // send response to monocle
    console.log(parsed);
    Monocle.transmit("test");
}