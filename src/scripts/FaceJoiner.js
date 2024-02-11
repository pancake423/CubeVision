/*
Second part of the alrgorithm- figuring out how to join the six faces together into a valid cube.
*/

const FaceJoiner = {}

FaceJoiner.join = (arr) => {
	/*
	takes an array of six face cube tiles.
	Generate every possible configuration of each face being rotated, then check the validity of that
	configuration.
	*/
	FaceJoiner.checkValidInput(arr);
}

/*
ensures that the passed face array is formatted correctly, 
has the correct number of each color tile, and one of each center.

returns nothing, but raises a descriptive error if the input is invalid.
*/

FaceJoiner.checkValidInput = (arr) => {
	//check format
	if (!(arr instanceof Array && arr.length === 6)) {
		throw Error(`FaceJoiner input: "${arr}" is not an array of length 6.`);
	}
	const centers = {
		"r": false,
		"o": false,
		"g": false,
		"b": false,
		"w": false,
		"y": false
	}
	const counts = {
		"r": 0,
		"o": 0,
		"g": 0,
		"b": 0,
		"w": 0,
		"y": 0
	}
	arr.forEach((f, i) => {
		if (!(typeof f === 'string' || f instanceof String && f.length === 9)) {
			throw Error(`FaceJoiner input, item ${i}: ${f} is not a string of length 9.`);
		}
		for (let n = 0; n < f.length; n++) {
			if (n === 4) {
				if (centers[f[n]]) {
					throw Error(`FaceJoiner input, item ${i}: duplicate center color "${f[n].toUpperCase()}."`);
				}
				centers[f[n]] = true;
			}
			counts[f[n]]++;
		}
	});
	console.log(centers, counts);
	for (const key in counts) {
		if (counts[key] !== 9) {
			throw Error(`FaceJoiner input: ${counts[key]} tiles of color ${key.toUpperCase()} (must be 9).`);
		}
	}
}

//re-order faces so that the centers are correct.
//White -> Orange -> Green -> Red -> Blue -> Yellow
FaceJoiner.orderFaces = (arr) => {
	const findFace = (s, arr) => {
		for (const f of arr) {
			if (f[4] == s) {
				return f;
			}
		}
	};
	const order = ["w", "o", "g", "r", "b", "y"];
	return order.map(f => findFace(f, arr));
}

//rotate the passed face string 90 degrees clockwise.
FaceJoiner.rotateFace = (f) => {
	return f[6] + f[3] + f[0] + f[7] + f[4] + f[1] + f[8] + f[5] + f[2];
}


FaceJoiner.permute = (arr) => {
	return arr.map(f => {
		const r1 = FaceJoiner.rotateFace(f);
		const r2 = FaceJoiner.rotateFace(r1);
		const r3 = FaceJoiner.rotateFace(r2);

		return [f, r1, r2, r3];
	})
}

FaceJoiner.getPermutation = (n, opts) => {
	let idx = n;
	const out = [];
	for (const opt of opts) {
		out.append(opt[idx % opts.length]);
		idx = Math.floor(idx / opts.length);
	}
	return out;
}

FaceJoiner.checkPermutation = (arr) => {

}