import display
import cube_vis

BG_COLOR = display.CLEAR
TEXT_COLOR = display.WHITE
CAPTURE_DEFAULT_COLOR = display.GRAY2
CAPTURE_INFO = {
    "red": ["R", display.RED],
    "orange": ["O", 0xed752f],
    "white": ["W", display.WHITE],
    "yellow": ["Y", display.YELLOW],
    "green": ["G", display.GREEN],
    "blue": ["B", display.BLUE],
}

def show_waiting_connect():
    bg = display.Fill(BG_COLOR)
    text = display.Text(
        "Waiting to connect...", 
        display.WIDTH // 2, display.HEIGHT // 2,
        TEXT_COLOR, justify = display.MIDDLE_CENTER
    )
    display.show(bg, text)

# TODO: replace letters with rectangles (easier to see)
def show_capture_screen(images_parsed, status="ready"):
    bg = display.Fill(BG_COLOR)
    start_x = (display.WIDTH - display.FONT_WIDTH * 12) // 2
    start_y = display.HEIGHT // 2
    letters = []
    for i, k in enumerate(images_parsed.keys()):
        info = CAPTURE_INFO[k]
        letters.append(display.Text(
                info[0], start_x + 2 * display.FONT_WIDTH * i, 
                start_y, info[1] if images_parsed[k] else CAPTURE_DEFAULT_COLOR,
                justify=display.MIDDLE_CENTER
        ))
    status_text = display.Text('Status: ' + status, display.WIDTH // 2, display.HEIGHT // 2 + display.FONT_HEIGHT, TEXT_COLOR, justify=display.TOP_CENTER)
    display.show(bg, letters, status_text)

def show_solution_screen(move):
    bg = display.Fill(BG_COLOR)
    move_text = display.Text(move, display.WIDTH - 50, 50, TEXT_COLOR, justify=display.TOP_RIGHT)
    display.show(bg, move_text)
    cube_vis.animate_move(move, 0)