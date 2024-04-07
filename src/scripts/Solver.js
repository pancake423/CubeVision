// requires src/cubejs/lib/cube.js
// requires src/cubejs/lib/solve.js
class Solver {
	static #isInitialized = false;
	static #init() {
		Cube.initSolver();
		Solver.#isInitialized = true;
	}
	static solve(faceData) {
		if (!Solver.#isInitialized) Solver.#init();
		// convert faceData from 2D array into 54 character facelet string.
		// assumes that faceData has already been sent through FaceJoiner and is correctly ordered.
		const cube = Cube.fromString(Solver.stringify(faceData));
		console.log(cube);
		return cube.solve();
	}
	static stringify(faceData) {
		// NEED TO RE ORDER:
		// up -> right -> front -> down -> left -> back
		// my order:
		// up 0 -> left 1 -> front 2 -> right 3 -> back 4 -> down 5
		const reOrdered = [
			faceData[0],
			faceData[3],
			faceData[2],
			faceData[5],
			faceData[1],
			faceData[4]
		];
		const letterMap = {
			"w": "U",
			"o": "L",
			"g": "F",
			"r": "R",
			"b": "B",
			"y": "D"
		}
		return reOrdered.map(face => face.split("").map(c => letterMap[c]).join("")).join("");
	}
}