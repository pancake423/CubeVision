import led
import time
import bluetooth
import camera
import ui

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
    bluetooth.receive_callback(image_processor_status_callback)
    ui.show_capture_screen(IMG_STATUS, status="ready")

def take_picture():
    camera.capture()
    while data := camera.read(bluetooth.max_length()):
        bluetooth.send(data)

def image_processor_status_callback(data):
    pass

main()