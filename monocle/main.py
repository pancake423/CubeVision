import led
import time
import bluetooth
import camera
import ui
import touch

NOT_CONNECTED_BLINK_DELAY = 300 #ms
IMG_STATUS = {
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
    bluetooth.receive_callback(handle_image_processor_data)
    touch.callback(touch.A, handle_camera_button)
    ui.show_capture_screen(IMG_STATUS, status="ready")


def handle_image_processor_data(data):
    # handle data from pc back to monocle.
    # either saying which side was found,
    # image processing failure, or cube string.
    pass

def handle_camera_button():
    # take a picture and transmit the data to the browser
    ui.show_capture_screen(IMG_STATUS, status="processing...")
    camera.capture()
    while data := camera.read(bluetooth.max_length()):
        bluetooth.send(data)

main()