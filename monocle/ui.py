import display

BG_COLOR = display.CLEAR
TEXT_COLOR = display.WHITE

def show_waiting_connect():
    bg = display.Fill(BG_COLOR)
    text = display.Text(
        "Waiting to connect...", 
        display.WIDTH // 2, display.HEIGHT // 2,
        TEXT_COLOR, justify = display.MIDDLE_CENTER
    )
    display.show(bg, text)

def show_capture_screen(images_parsed, status="ready"):
    pass