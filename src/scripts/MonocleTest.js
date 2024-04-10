// test script used to send dummy cube + solution data to the monocle.
// saves some time while developing the monocle's interface.
// requires MonocleInterface.js, Solver.js src/cubejs/lib/cube.js, and src/cubejs/lib/solve.js
class MonocleTest {
    static generateCube() {
        return Cube.random().asString()
    }

    constructor(cube) {
        // if no arguments provided, generate a random one.
        this.cubeData = cube;
        if (cube === undefined) {
            this.cubeData = MonocleTest.generateCube();
        }
        // expected data type: 54-character string for cubeData
        // if cubeData is an array, assume it needs to be converted
        if (Array.isArray(this.cubeData)) {
            this.cubeData = Solver.stringify(this.cubeData);
        }
        // solve cube
        this.solution = Solver.solve(this.cubeData);

        // connect to Monocle, transmit data
        Monocle.connect().then(_ => window.setTimeout(() => this.send(), 1500));
    }

    send() {
        Monocle.transmit(`cube:${this.cubeData}`)
        .then(_ => Monocle.transmit(`solution:${this.solution}`))
        .then(_ => Monocle.disconnect());
    }
}