// test script used to send dummy cube + solution data to the monocle.
// saves some time while developing the monocle's interface.
// requires MonocleInterface.js, Solver.js src/cubejs/lib/cube.js, and src/cubejs/lib/solve.js
class MonocleTest {
    static generateCube() {
        return Cube.random().asString()
    }

    constructor(cube) {
        // if no arguments provided, generate a random one.
        let cubeData = cube;
        if (cube === undefined) {
            cubeData = MonocleTest.generateCube();
        }
        // expected data type: 54-character string for cubeData
        // if cubeData is an array, assume it needs to be converted
        if (Array.isArray(cubeData)) {
            cubeData = Solver.stringify(cubeData);
        }
        // solve cube
        const solution = Solver.solve(cubeData);
        console.log(cubeData, solution);

        // connect to Monocle, transmit data
        Monocle.connect()
        .then(_ => Monocle.transmit(cubeData))
        .then(_ => Monocle.transmit(solution));
    }
}