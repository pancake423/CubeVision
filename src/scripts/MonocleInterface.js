// uses Web Browser's bluetooth module to connect to the Brilliant monocle and provide an interface for the program.
// very heavily borrows code from https://github.com/siliconwitchery/web-bluetooth-repl/blob/main/js/bluetooth.js
const replDataServiceUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const nordicDfuServiceUuid = 0xfe59;
let rawDataRxCharacteristic = null;
let rawDataTxCharacteristic = null;
const rawDataServiceUuid = "e5700001-7bac-429a-b4ce-57ff900f479d";
const rawDataRxCharacteristicUuid = "e5700002-7bac-429a-b4ce-57ff900f479d";
const rawDataTxCharacteristicUuid = "e5700003-7bac-429a-b4ce-57ff900f479d";

class Monocle {
    static device;
    static async connect() {
        if (!navigator.bluetooth) {
            return Promise.reject("This browser doesn't support WebBluetooth. " +
                "Make sure you're on Chrome Desktop/Android or BlueFy iOS.")
        }
        Monocle.device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [replDataServiceUuid] },
                { services: [nordicDfuServiceUuid] },
            ],
            optionalServices: [rawDataServiceUuid]
        });

        const server = await Monocle.device.gatt.connect()
        Monocle.device.addEventListener('gattserverdisconnected', Monocle.disconnect);
        const rawDataService = await server.getPrimaryService(rawDataServiceUuid)
        .catch(() => { });
        rawDataRxCharacteristic = await rawDataService.getCharacteristic(rawDataRxCharacteristicUuid);
        rawDataTxCharacteristic = await rawDataService.getCharacteristic(rawDataTxCharacteristicUuid);
        await rawDataTxCharacteristic.startNotifications();
        rawDataTxCharacteristic.addEventListener('characteristicvaluechanged', Monocle.recieve);
    }
    static async disconnect() {
        if (Monocle.device && Monocle.device.gatt.connected) {
            await Monocle.device.gatt.disconnect();
        }
    }
    static async transmit(data) {
        await rawDataRxCharacteristic.writeValueWithoutResponse(new Uint8Array(bytes))
        .then(() => {
            console.log("Sent: ", bytes);
        })
        .catch(error => {
            return Promise.reject(error);
        })
    }
    static recieve(event) {
        console.log(event.target.value);
    }
}