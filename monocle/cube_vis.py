from math import sin, cos
import display


THETA = 0.1
FRAMES_PER_MOVE = 10
WIDTH = None
HEIGHT = None
CENTER_X = None
CENTER_Y = None

cube_data = None
cube_solution = None


def init(center, size):
    global WIDTH
    global HEIGHT
    global CENTER_X
    global CENTER_Y

    WIDTH = size
    HEIGHT = size
    CENTER_X, CENTER_Y = center

def is_ready():
    global cube_data
    global cube_solution

    if cube_data == None or cube_solution == None:
        return False
    return True

def parse_solution(s):
    global cube_solution
    cube_solution = s.split(" ")

def parse_cube(cube_string):
    # face order (string): up -> right -> front -> down -> left -> back
    # my superior order: up 0 -> left 1 -> front 2 -> right 3 -> back 4 -> down 5
    global cube_data
    cube_data = []
    letter_map = {
        "U": "w",
        "D": "y",
        "L": "o",
        "R": "r",
        "F": "g",
        "B": "b"
    }
    for i in [0, 4*9, 2*9, 1*9, 5*9, 3*9]:
        cube_data.append([letter_map[facelet] for facelet in cube_string[i:i+9]])

def convert_2d(x, y, z):
    return (x * cos(THETA) + z * sin(THETA), y + x * sin(THETA) + z * cos(THETA))

def make_move(move):
    # TODO: called on last frame of animation? actually modifies the cube data according to the move made.
    pass

def animate_move(move, frame):
    #TODO: draw cube, animate move, draw guidance arrows
    pass