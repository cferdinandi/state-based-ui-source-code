/*!
 * A component helper library
 * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
 */
var Component = (function () {

	'use strict';

	//
	// Methods
	//

	/**
	 * Create the Constructor object
	 */
	var Constructor = function (selector, options) {
		this.selector = selector;
		this.data = options.data;
		this.template = options.template;
	};

	/**
	 * Render the template into the DOM
	 */
	Constructor.prototype.render = function () {
		var target = document.querySelector(this.selector);
		if (!target) return;
		target.innerHTML = this.template(this.data);
	};

	/**
	 * Reactively update the data
	 * @param {Object} obj The new data
	 */
	Constructor.prototype.setData = function (obj) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				this.data[key] = obj[key];
			}
		}
		this.render();
	};

	/**
	 * Get an immutable copy of the data
	 */
	Constructor.prototype.getData = function () {
		return JSON.parse(JSON.stringify(this.data));
	};

	//
	// Return the Constructor
	//

	return Constructor;

})();