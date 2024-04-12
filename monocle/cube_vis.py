from math import sin, cos, atan2, sqrt, pi
import display
import time
from moves import move_to_code, make_move


FRAMES_PER_MOVE = 10
FRAME_DELAY = 50 #ms

WIDTH = None
HEIGHT = None
SIZE = None

COLOR_RED = display.RED
COLOR_ORANGE = 0xed752f
COLOR_GREEN = display.GREEN
COLOR_BLUE = display.BLUE
COLOR_WHITE = display.WHITE
COLOR_YELLOR = display.YELLOW

ARROW_POINTS = 30
ARROW_THICKNESS = 5
ARROW_COLOR = display.GRAY4

COLOR_MAP = {
    "r": COLOR_RED,
    "o": COLOR_ORANGE,
    "g": COLOR_GREEN,
    "b": COLOR_BLUE,
    "w": COLOR_WHITE,
    "y": COLOR_YELLOR,
}

cube_data = None
cube_solution = None
animating = False


def init(center, size):
    global SIZE
    global CENTER_X
    global CENTER_Y

    SIZE = size
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

def rotate(x, y, angle):
    theta = atan2(y, x) + angle
    r = sqrt(x*x + y*y)
    return r * cos(theta), r * sin(theta)

def scale(x, y, factor):
    return x * factor, y * factor

def translate(x, y, dx, dy):
    return x + dx, y + dy

def flatten(l):
    out = []
    for sublist in l:
        for item in sublist:
            out.append(round(item))
    return out

def make_face(n, angle):
    out = []

    tiles = cube_data[n]
    facelets = [
        [[-1/3, -1], [-1, -1], [-1, -1/3], [-1/3, -1/3]], #1
        [[1/3, -1], [-1/3, -1], [-1/3, -1/3], [1/3, -1/3]], #2
        [[1, -1], [1/3, -1], [1/3, -1/3], [1, -1/3]], #3
        [[-1/3, -1/3], [-1, -1/3], [-1, 1/3], [-1/3, 1/3]], #4
        [[1/3, -1/3], [-1/3, -1/3], [-1/3, 1/3], [1/3, 1/3]], #5
        [[1, -1/3], [1/3, -1/3], [1/3, 1/3], [1, 1/3]], #6
        [[-1/3, 1/3], [-1, 1/3], [-1, 1], [-1/3, 1]], #7
        [[1/3, 1/3], [-1/3, 1/3], [-1/3, 1], [1/3, 1]], #8
        [[1, 1/3], [1/3, 1/3], [1/3, 1], [1, 1]], #9
    ]
    for i, f in enumerate(facelets):
        points = []
        for c in f:
            points.append(rotate(*c, angle))
        color = COLOR_MAP[tiles[i]]
        points = [scale(*p, SIZE) for p in points]
        points = [translate(*p, CENTER_X, CENTER_Y) for p in points]
        out.append(display.Polygon(flatten(points), color))
    
    return out

def make_arrow(angle):
    points = []
    r = 1.75
    arrow_length = 0.4
    arrow_width = 0.2
    for i in range(ARROW_POINTS):
        theta = (angle / ARROW_POINTS) * i - (pi/2)
        points.append([r * cos(theta), r * sin(theta)])
    
    arrow_direction = atan2(points[-1][1] - points[-2][1], points[-1][0] - points[-2][0])
    arrow_points = [
        translate(*points[-1], arrow_length * cos(arrow_direction), arrow_length * sin(arrow_direction)),
        translate(*points[-1], arrow_width * cos(arrow_direction + pi/2), arrow_width * sin(arrow_direction + pi/2)),
        translate(*points[-1], arrow_width * cos(arrow_direction - pi/2), arrow_width * sin(arrow_direction - pi/2)),
    ]

    points = [scale(*p, SIZE) for p in points]
    points = [translate(*p, CENTER_X, CENTER_Y) for p in points]

    arrow_points = [scale(*p, SIZE) for p in arrow_points]
    arrow_points = [translate(*p, CENTER_X, CENTER_Y) for p in arrow_points]

    return [display.Polyline(flatten(points), ARROW_COLOR, thickness=ARROW_THICKNESS), display.Polygon(flatten(arrow_points), ARROW_COLOR)]

def code_to_string(code):
    face_translation = ["White", "Orange", "Green", "Red", "Blue", "Yellow"]
    if code[1] == 1:
        return f'{face_translation[code[0]]} face 90deg CW'
    elif code[1] == 2:
        return f'{face_translation[code[0]]} face 180deg CW'
    return f'{face_translation[code[0]]} face 90deg CCW'

def render(move, angle):
    move_code = move_to_code(move)
    text = display.Text(code_to_string(move_code), display.WIDTH//2, 16, display.WHITE, justify=display.TOP_CENTER)
    display.show(text, make_face(move_code[0], angle), make_arrow(move_code[1] * pi/2))

def animate_move():
    global animating
    if len(cube_solution) == 0:
        return victory_screen()
    move = cube_solution[0]
    del cube_solution[0]

    animating = True
    delta_angle = move_to_code(move)[1] * (pi/2) / FRAMES_PER_MOVE
    angle = 0
    for i in range(FRAMES_PER_MOVE+1):
        render(move, angle)
        angle += delta_angle
        time.sleep_ms(FRAME_DELAY)
    animating = False
    make_move(move)

def victory_screen():
    text = display.Text("Solved!", display.WIDTH//2, display.HEIGHT//2, display.WHITE, justify=display.MIDDLE_CENTER)
    display.show(text)
