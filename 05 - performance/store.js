let store = (function () {

	/**
	 * Emit a custom event
	 * @param  {*} data The store data
	 */
	function emit (data) {

		// Create a new event
		let event = new CustomEvent('store', {
			bubbles: true,
			cancelable: true,
			detail: data
		});

		// Dispatch the event
		return document.dispatchEvent(event);

	}

	/**
	 * Create a Proxy handler object
	 * @param  {Object} data The data object
	 * @return {Object}      The handler object
	 */
	function handler (data) {
		return {
			get (obj, prop) {
				if (prop === '_isProxy') return true;
				if (['[object Object]', '[object Array]'].includes(Object.prototype.toString.call(obj[prop])) && !obj[prop]._isProxy) {
					obj[prop] = new Proxy(obj[prop], handler(data));
				}
				return obj[prop];
			},
			set (obj, prop, value) {
				if (obj[prop] === value) return true;
				obj[prop] = value;
				emit(data);
				return true;
			},
			deleteProperty (obj, prop) {
				delete obj[prop];
				emit(data);
				return true;
			}
		};
	}

	/**
	 * Create a new store
	 * @param  {Object} data The data object
	 * @return {Proxy}       The reactive proxy
	 */
	function store (data = {}) {
		data = ['[object Object]', '[object Array]'].includes(Object.prototype.toString.call(data)) ? data : {value: data};
		return new Proxy(data, handler(data));
	}

	return store;

})();