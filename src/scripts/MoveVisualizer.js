// a port of my Monocle display python code as a result of "The Incident"

// new MoveVis(document.querySelector("#soln"), DataCollector.cube.data, document.querySelector("#solution").innerText.split(": ")[1])

class MoveVis {
    static colors = {
		"r": "rgb(255, 0, 0)",
		"g": "rgb(0, 255, 0)",
		"b": "rgb(0, 0, 255)",
		"o": "rgb(255, 128, 0)",
		"y": "rgb(255, 255, 0)",
		"w": "rgb(255, 255, 255)",
		"k": "rgb(50, 50, 50)"
 	}

    static moveToCode(move) {
        const move_face = {
            "U": 0,
            "L": 1,
            "F": 2,
            "R": 3,
            "B": 4,
            "D": 5
        };
        const face_code = move_face[move[0]];
        let direction_code = 1;
        if (move[1] == "2") {
            direction_code = 2;
        }
        else if (move[1] == "'") {
            direction_code = -1;
        }
        return [face_code, direction_code];
    }

    constructor(targetCanvas, cubeData, solutionString) {
        this.c = targetCanvas;
        this.ctx = this.c.getContext("2d");
        this.w = this.c.width;
        this.h = this.c.height;
        this.ctx.lineWidth = 5;
        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";
        this.ctx.strokeStyle = "rgb(0, 0, 0)";
        
        // cubeData comes in as an array of 6 strings.
        this.cubeData = cubeData.map(face => face.split(""));
        
        this.moves = solutionString.split(" ");
        this.moveIdx = 0;
        this.animating = false;

    }

    rotateFace(code) {
        const faceIdx = code[0];
        const f = this.cubeData[faceIdx];
        if (code[1] == 1) {
            this.cubeData[faceIdx] = [
                f[6], f[3], f[0],
                f[7], f[4], f[1],
                f[8], f[5], f[2],
            ];
        }
        else if (code[1] == -1) {
            this.cubeData[faceIdx] = [
                f[2], f[5], f[8],
                f[1], f[4], f[7],
                f[0], f[3], f[6],
            ];
        }
        else if (code[1] == 2) {
            this.cubeData[faceIdx] = [
                f[8], f[7], f[6],
                f[5], f[4], f[3],
                f[2], f[1], f[0],
            ];
        }
    }

    swapStrips(s1, s2) {
        for (let i = 0; i < s1.length; i++) {
            const a1 = s1[i][0];
            const a2 = s1[i][1];
            const b1 = s2[i][0];
            const b2 = s2[i][1];
        
            const temp = this.cubeData[a1][a2];
            this.cubeData[a1][a2] = this.cubeData[b1][b2];
            this.cubeData[b1][b2] = temp;
        }
    }

    makeMove(move) {
        const move_code = MoveVis.moveToCode(move);
        this.rotateFace(move_code);

        let side_strips = [];
        if (move_code[0] == 0) {
            side_strips = [[[1, 0], [1, 1], [1, 2]], [[4, 0], [4, 1], [4, 2]], [[3, 0], [3, 1], [3, 2]], [[2, 0], [2, 1], [2, 2]]];
        } else if (move_code[0] == 1) {
            side_strips = [[[0, 0], [0, 3], [0, 6]], [[2, 0], [2, 3], [2, 6]], [[5, 0], [5, 3], [5, 6]], [[4, 8], [4, 5], [4, 2]]];
        } else if (move_code[0] == 2) {
            side_strips = [[[0, 6], [0, 7], [0, 8]], [[3, 0], [3, 3], [3, 6]], [[5, 2], [5, 1], [5, 0]], [[1, 8], [1, 5], [1, 2]]];
        } else if (move_code[0] == 3) {
            side_strips = [[[0, 2], [0, 5], [0, 8]], [[4, 6], [4, 3], [4, 0]], [[5, 2], [5, 5], [5, 8]], [[2, 2], [2, 5], [2, 8]]];
        } else if (move_code[0] == 4) {
            side_strips = [[[0, 2], [0, 1], [0, 0]], [[1, 0], [1, 3], [1, 6]], [[5, 6], [5, 7], [5, 8]], [[3, 8], [3, 5], [3, 2]]];
        } else if (move_code[0] == 5) {
            side_strips = [[[1, 6], [1, 7], [1, 8]], [[2, 6], [2, 7], [2, 8]], [[3, 6], [3, 7], [3, 8]], [[4, 6], [4, 7], [4, 8]]];
        }
        if (move_code[1] == -1) {
            this.swapStrips(side_strips[0], side_strips[1]);
            this.swapStrips(side_strips[1], side_strips[2]);
            this.swapStrips(side_strips[2], side_strips[3]);
        } else if (move_code[1] == 1) {
            this.swapStrips(side_strips[2], side_strips[3]);
            this.swapStrips(side_strips[1], side_strips[2]);
            this.swapStrips(side_strips[0], side_strips[1]);
        } else if (move_code[1] == 2) {
            this.swapStrips(side_strips[0], side_strips[2]);
            this.swapStrips(side_strips[1], side_strips[3]);
        }
    }

    drawArrow(code) {
        const radius = this.w * 0.4;
        this.ctx.fillStyle = "rgb(0, 0, 0)";
        switch (code[1]) {
            case 1:
                // 90deg cw
                this.ctx.beginPath();
                this.ctx.arc(this.w/2, this.h/2, radius, -Math.PI/2, 0);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(this.w/2 + radius, this.h/2 + radius * 0.2);
                this.ctx.lineTo(this.w/2 + radius * 1.05, this.h/2);
                this.ctx.lineTo(this.w/2 + radius * 0.95, this.h/2);
                this.ctx.lineTo(this.w/2 + radius, this.h/2 + radius * 0.2);
                this.ctx.fill();
                break;
            case 2:
                // 180deg
                this.ctx.beginPath();
                this.ctx.arc(this.w/2, this.h/2, radius, -Math.PI/2, Math.PI/2);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(this.w/2 - radius * 0.2, this.h/2 + radius);
                this.ctx.lineTo(this.w/2, this.h/2 + radius * 1.05);
                this.ctx.lineTo(this.w/2, this.h/2 + radius * 0.95);
                this.ctx.lineTo(this.w/2 - radius * 0.2, this.h/2 + radius);
                this.ctx.fill();
                break;
            case -1:
                // 90deg ccw
                this.ctx.beginPath();
                this.ctx.arc(this.w/2, this.h/2, radius, -Math.PI/2, Math.PI, true);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(this.w/2 - radius, this.h/2 + radius * 0.2);
                this.ctx.lineTo(this.w/2 - radius * 1.05, this.h/2);
                this.ctx.lineTo(this.w/2 - radius * 0.95, this.h/2);
                this.ctx.lineTo(this.w/2 - radius, this.h/2 + radius * 0.2);
                this.ctx.fill();
                break;
        }
    }

    drawFace(code, angle) {
        const tileSize = this.w/5;
        const sc = this.w*0.2;
        const faceData = this.cubeData[code[0]];

        this.ctx.save();
        this.ctx.translate(this.w/2, this.h/2);
        this.ctx.rotate(angle);
        this.ctx.translate(-this.w/2 + sc, -this.h/2 + sc);
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                this.ctx.fillStyle = MoveVis.colors[faceData[x + y*3]];
                this.ctx.beginPath();
                this.ctx.rect(x * tileSize, y * tileSize, tileSize, tileSize);
                this.ctx.stroke();
                this.ctx.fill();
            }
        }
        this.ctx.restore();
    }

    animateMove(move) {
        const moveCode = MoveVis.moveToCode(move);
        this.animating = true;
        let dx = 0.01 * moveCode[1];
        let angle = 0;
        window.requestAnimationFrame(() => this.step(move, moveCode, angle, dx));
    }
    
    step(move, moveCode, angle, dx) {
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.drawFace(moveCode, angle);
        this.drawArrow(moveCode);
        if (Math.abs(angle) < Math.abs(moveCode[1] * Math.PI/2)) {
            window.requestAnimationFrame(() => this.step(move, moveCode, angle + dx, dx));
        } else {
            this.animating = false;
            this.makeMove(move);
        }
    }
}