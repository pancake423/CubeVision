/*
simple static class used for storing the global state.
*/

class DataCollector {
	static #data = [];

	static cube;

	static clear() {
		DataCollector.#data = [];
	}

	static collect(d) {
		DataCollector.#data.push(d);
	}

	static get() {
		return JSON.parse(JSON.stringify(DataCollector.#data));
	}
}