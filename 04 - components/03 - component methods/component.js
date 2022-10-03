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
			this.elem = elem;
			this.template = html;
			this.handler = function (event) {
				render(getElem(elem), html());
			};

			// Init
			this.start();

		}

		/**
		 * Start reactive data rendering
		 */
		start () {
			render(getElem(this.elem), this.template());
			document.addEventListener('store', this.handler);
		}

		/**
		 * Stop reactive data rendering
		 */
		stop () {
			document.removeEventListener('store', this.handler);
		}

		/**
		 * Render the UI
		 */
		render () {
			render(getElem(this.elem), this.template());
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