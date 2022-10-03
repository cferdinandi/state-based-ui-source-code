let component = (function () {

	/**
	 * Get an element in the DOM
	 * @param  {String|Node} elem The element or element selector
	 * @return {Node}             The DOM node
	 */
	function getElem (elem) {
		return typeof elem === 'string' ? document.querySelector(elem) : elem;
	}

	/**
	 * Emit a custom event
	 * @param  {String} type  The event type
	 * @param  {Node}   elem  The element to emit the event on
	 */
	function emit (type, elem) {

		// Create a new event
		let event = new CustomEvent(type, {
			bubbles: true,
			cancelable: true
		});

		// Dispatch the event
		return elem.dispatchEvent(event);

	}

	/**
	 * Component Class
	 */
	class Component {

		/**
		 * The constructor object
		 * @param  {Node|String} elem  The element or selector to render the template into
		 * @param  {Function}    html  The template function to run when the data updates
		 */
		constructor (elem, html) {

			// Create instance properties
			let self = this;
			self.elem = elem;
			self.template = html;
			self.handler = function (event) {
				self.render();
			};

			// Init
			self.start();

		}

		/**
		 * Start reactive data rendering
		 */
		start () {
			this.render();
			document.addEventListener('store', this.handler);
			emit('start', getElem(this.elem));
		}

		/**
		 * Stop reactive data rendering
		 */
		stop () {
			document.removeEventListener('store', this.handler);
			emit('stop', getElem(this.elem));
		}

		/**
		 * Render the UI
		 */
		render () {
			let elem = getElem(this.elem);
			render(elem, this.template());
			emit('render', elem);
		}

	}

	/**
	 * Create a reactive component
	 * @param  {Node}     elem The element to render into
	 * @param  {Function} html The template to render
	 */
	function component (elem, html) {
		return new Component(elem, html);
	}

	return component;

})();