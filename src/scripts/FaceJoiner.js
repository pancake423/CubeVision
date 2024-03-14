/*
Second part of the alrgorithm- figuring out how to join the six faces together into a valid cube.
*/

// White -> Orange -> Green -> Red -> Blue -> Yellow
const FaceJoiner = {
	edges: {
		"wg": 1,
		"wo": 1,
		"wr": 1,
		"wb": 1,
		"gy": 1,
		"oy": 1,
		"ry": 1,
		"by": 1,
		"rb": 1,
		"ob": 1,
		"og": 1,
		"gr": 1,
	},
	corners: {
		"wog": 1,
		"wgr": 1,
		"wrb": 1,
		"wob": 1,
		"ogy": 1,
		"gry": 1,
		"rby": 1,
		"oby": 1,
	},

	pieces: [
		[[0, 0], [1, 0], [4, 2]],
		[[0, 1], [4, 1]],
		[[0, 2], [4, 0], [3, 2]],
		[[0, 3], [1, 1]],
		[[0, 5], [3, 1]],
		[[0, 6], [1, 2], [2, 0]],
		[[0, 7], [2, 1]],
		[[0, 8], [2, 2], [3, 0]],
		[[1, 5], [2, 3]],
		[[2, 5], [3, 3]],
		[[3, 5], [4, 3]],
		[[4, 5], [1, 3]],
		[[5, 0], [1, 8], [2, 6]],
		[[5, 1], [2, 7]],
		[[5, 2], [2, 8], [3, 6]],
		[[5, 3], [1, 7]],
		[[5, 5], [3, 7]],
		[[5, 6], [1, 6], [4, 8]],
		[[5, 7], [4, 7]],
		[[5, 8], [3, 8], [4, 6]]
	]
}

FaceJoiner.join = (arr) => {
	/*
	takes an array of six face cube tiles.
	Generate every possible configuration of each face being rotated, then check the validity of that
	configuration.
	*/
	FaceJoiner.checkValidInput(arr);
	const faces = FaceJoiner.orderFaces(arr);
	const facePerms = FaceJoiner.permute(faces);

	valid = [];
	for (let i = 0; i < Math.pow(4, 6); i++) {
		const p = FaceJoiner.getPermutation(i, facePerms);
		if (FaceJoiner.checkPermutation(p)) FaceJoiner.appendIfNotDuplicate(valid, p);
	}

	if (valid.length != 1) {
		console.log(valid);
		throw Error("Invalid number of permutations found!");
	}

	return valid[0];
}

FaceJoiner.appendIfNotDuplicate = (array, item) => {
	const itemStr = JSON.stringify(item);
	for (const i of array) {
		const str = JSON.stringify(i);
		if (str === itemStr) {
			return false;
		}
	}
	array.push(item);
	return true;
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
		if (!((typeof f === 'string' || f instanceof String) && f.length === 9)) {
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


//generate all four rotations of each face string. (array[6][4])
FaceJoiner.permute = (arr) => {
	return arr.map(f => {
		const r1 = FaceJoiner.rotateFace(f);
		const r2 = FaceJoiner.rotateFace(r1);
		const r3 = FaceJoiner.rotateFace(r2);

		return [f, r1, r2, r3];
	})
}

//gets the nth permutation from the possible options. n can be from 0 to 4095 (4^6 possibilites)
FaceJoiner.getPermutation = (n, opts) => {
	let idx = n;
	const out = [];
	for (const opt of opts) {
		out.push(opt[idx % opt.length]);
		idx = Math.floor(idx / opt.length);
	}
	return out;
}

//checks if the current permutation is valid. Returns a bool.
FaceJoiner.checkPermutation = (arr, verbose=false) => {
	// step1: count all the pieces, make sure there is one of each
	// step2: if needed, check parity? (corner parity, edge parity, overall parity).
	// I think step 2 is unnecessary which is great news :)
	const piecesFound = {};
	for (const coords of FaceJoiner.pieces) {
		const tiles = [];
		for (const loc of coords) {
			const color = arr[loc[0]][loc[1]];
			if (tiles.includes(color)) {
				if (verbose) console.log("Invalid permutation. duplicate tile colors.")
				return false;
			}
			tiles.push(color);
		}
		const pieceString = FaceJoiner.getPieceString(tiles);
		if (piecesFound[pieceString] !== undefined) {
			if (verbose) console.log("Invalid permutation. duplicate piece.")
			return false;
		}
		if (FaceJoiner.corners[pieceString] === undefined && FaceJoiner.edges[pieceString] === undefined) {
			if (verbose) console.log("Invalid permutation. invalid piece", pieceString);
			return false;
		}
		piecesFound[pieceString] = 1;
	}
	return true;

}

//converts an array of face tile colors into a single string (specific order).
FaceJoiner.getPieceString = (letters) => {
	const present = (v) => letters.includes(v) ? v : "";
	const ord = ["w", "o", "g", "r", "b", "y"];
	let out = "";
	for (const c of ord) {
		out += present(c);
	}
	return out;
}