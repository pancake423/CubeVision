import led
import time
import bluetooth
import camera
import ui
import touch
import cube_vis
import device

NOT_CONNECTED_BLINK_DELAY = 300 #ms
CAMERA_CAPTURE_DELAY = 100 #ms, time before camera data is sent
CAMERA_READY_DELAY = 300 #ms, visual indicator of picture taken
WAIT_SERVICE_BUSY_DELAY = 5 #ms

camera_ready = True
img_status = {
    "red": False,
    "orange": False,
    "white": False,
    "yellow": False,
    "green": False,
    "blue": False,
}

def main():
    ui.show_waiting_connect()

    while not bluetooth.connected():
        led.on(led.RED)
        time.sleep_ms(NOT_CONNECTED_BLINK_DELAY)
        led.off(led.RED)
        time.sleep_ms(NOT_CONNECTED_BLINK_DELAY)

    led.off(led.RED)
    led.on(led.GREEN)
    bluetooth.receive_callback(handle_response_data)
    touch.callback(touch.A, handle_camera_button)
    ui.show_capture_screen(img_status, status="ready")


def handle_response_data(data):
    # handle data from pc back to monocle.
    # either saying which side was found,
    # image processing failure, or cube/solution data.
    # all messages are of the format type:data
    global camera_ready
    res = data.decode() # convert binary string into normal string
    msg_type, msg_data = res.split(":")

    if msg_type == "face":
        if msg_data in img_status:
            # image processing success
            img_status[msg_data] = True
            
        ui.show_capture_screen(img_status, status="ready")
        camera_ready = True

    elif msg_type == "cube":
        # TODO: load cube data into 3d visualizer
        cube_vis.parse_cube(msg_data)
    elif msg_type == "solution":
        # TODO: load solution data into 3d visualizer, go to solution screen. (change touch handler also)
        cube_vis.parse_solution(msg_data)
    elif msg_type == "reset":
        device.reset()
    
    if cube_vis.is_ready():
        # go to solution screen
        ui.show_solution_screen(cube_vis.cube_solution[0])
        touch.callback(touch.A, handle_next_move)
        pass


def send_data(data):
    # data sending code modified from https://github.com/milesprovus/Monocle-QR-Reader/blob/main/main.py
    # apparently the best solution is to just ignore the "OSError: Raw data service is busy" error.
    while True:
        try:
            bluetooth.send(data)
        except OSError:
            time.sleep_ms(WAIT_SERVICE_BUSY_DELAY)
            continue
        break

def handle_camera_button(button):
    global camera_ready

    if not camera_ready:
        return
    camera_ready = False
    # take a picture and transmit the data to the browser
    ui.show_capture_screen(img_status, status="sending...")
    camera.capture()
    time.sleep_ms(CAMERA_CAPTURE_DELAY)
    led.off(led.GREEN)
    while data := camera.read(bluetooth.max_length()):
        send_data(data)
    send_data("end")
    time.sleep_ms(CAMERA_READY_DELAY)
    led.on(led.GREEN)
    ui.show_capture_screen(img_status, status="processing...")

def handle_next_move():
    pass

main()