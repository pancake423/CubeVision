import cube_vis

def move_to_code(move):
    move_face = {
        "U": 0,
        "L": 1,
        "F": 2,
        "R": 3,
        "B": 4,
        "D": 5
    }
    face_code = move_face[move[0]]
    direction_code = 1
    if move[-1] == "2":
        direction_code = 2
    elif move[-1] == "'":
        direction_code = -1
    return (face_code, direction_code)

def rotate_face(code):
    face_idx = code[0]
    f = cube_vis.cube_data[face_idx]
    if code[1] == 1:
        #90deg cw
        cube_vis.cube_data[face_idx] = [
            f[6], f[3], f[0],
            f[7], f[4], f[1],
            f[8], f[5], f[2],
        ]
    elif code[1] == -1:
        #90deg ccw
        cube_vis.cube_data[face_idx] = [
            f[2], f[5], f[8],
            f[1], f[4], f[7],
            f[0], f[3], f[6],
        ]
    elif code[1] == 2:
        #180deg
        cube_vis.cube_data[face_idx] = [
            f[8], f[7], f[6],
            f[5], f[4], f[3],
            f[2], f[1], f[0],
        ]

def swap_strips(s1, s2):
    for i in range(len(s1)):
        a1, a2 = s1[i]
        b1, b2 = s2[i]
        temp = cube_vis.cube_data[a1][a2]
        cube_vis.cube_data[a1][a2] = cube_vis.cube_data[b1][b2]
        cube_vis.cube_data[b1][b2] = temp

# change the facelets according to the move made.
def make_move(move):
    # rotate the main face of the move.
    move_code = move_to_code(move)
    rotate_face(move_code)

    side_strips = []
    if move_code[0] == 0:
            side_strips = [[[1, 0], [1, 1], [1, 2]], [[4, 0], [4, 1], [4, 2]], [[3, 0], [3, 1], [3, 2]], [[2, 0], [2, 1], [2, 2]]]
    elif move_code[0] == 1:
            side_strips = [[[0, 0], [0, 3], [0, 6]], [[2, 0], [2, 3], [2, 6]], [[5, 0], [5, 3], [5, 6]], [[4, 8], [4, 5], [4, 2]]]
    elif move_code[0] == 2:
            side_strips = [[[0, 6], [0, 7], [0, 8]], [[3, 0], [3, 3], [3, 6]], [[5, 2], [5, 1], [5, 0]], [[1, 8], [1, 5], [1, 2]]]
    elif move_code[0] == 3:
            side_strips = [[[0, 2], [0, 5], [0, 8]], [[4, 6], [4, 3], [4, 0]], [[5, 2], [5, 5], [5, 8]], [[2, 2], [2, 5], [2, 8]]]
    elif move_code[0] == 4:
            side_strips = [[[0, 2], [0, 1], [0, 0]], [[1, 0], [1, 3], [1, 6]], [[5, 6], [5, 7], [5, 8]], [[3, 8], [3, 5], [3, 2]]]
    elif move_code[0] == 5:
            side_strips = [[[1, 6], [1, 7], [1, 8]], [[2, 6], [2, 7], [2, 8]], [[3, 6], [3, 7], [3, 8]], [[4, 6], [4, 7], [4, 8]]]

    if move_code[1] == -1:
            swap_strips(side_strips[0], side_strips[1])
            swap_strips(side_strips[1], side_strips[2])
            swap_strips(side_strips[2], side_strips[3])
    elif move_code[1] == 1:
            swap_strips(side_strips[2], side_strips[3])
            swap_strips(side_strips[1], side_strips[2])
            swap_strips(side_strips[0], side_strips[1])
    elif move_code[1] == 2:
            swap_strips(side_strips[0], side_strips[2])
            swap_strips(side_strips[1], side_strips[3])