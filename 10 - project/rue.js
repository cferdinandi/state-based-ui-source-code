let Rue = (function () {

	/**
	 * Convert a string into DOM nodes
	 * @param  {String} str The HTML string
	 * @return {Body}       The DOM nodes
	 */
	function stringToHTML (str) {
		let parser = new DOMParser();
		let doc = parser.parseFromString(str, 'text/html');
		return doc.body;
	}

	/**
	 * Check if attribute might be dangerous
	 * @param  {String}  name  The attribute name
	 * @param  {String}  value The attribute value
	 * @return {Boolean}       If true, the attribute might be dangerous
	 */
	function maybeDangerous (name, value) {
		let val = value.replace(/\s+/g, '').toLowerCase();
		if (['src', 'href', 'xlink:href'].includes(name)) {
			if (val.includes('javascript:') || val.includes('data:text/html')) return true;
		}
		if (name.startsWith('on')) return true;
	}

	/**
	 * Compare the existing node attributes to the template node attributes and make updates
	 * @param  {Node} template The template node
	 * @param  {Node} existing The existing node
	 */
	function diffAttributes (template, existing) {

		// If the node is not an element, bail
		if (template.nodeType !== 1) return;

		// Get attributes for the template and existing DOM
		let templateAtts = template.attributes;
		let existingAtts = existing.attributes;

		// Form attributes that can be changed by the user
		let formAtts = ['value', 'checked', 'selected'];

		// Add an update attributes from the template into the DOM
		for (let attribute of templateAtts) {

			// If the attribute might be dangerous, skip it
			if (maybeDangerous(attribute.name, attribute.value)) continue;

			// If it's a form attribute, set the property directly
			if (formAtts.includes(attribute.name)) {
				existing[attribute.name] = attribute.name === 'value' ? attribute.value : ' ';
			}

			// Update the attribute
			existing.setAttribute(attribute.name, attribute.value);

		}

		// Remove attributes from the DOM that shouldn't be there
		for (let attribute of existingAtts) {

			// Skip the attribute if it should be in the UI
			if (templateAtts[attribute.name]) continue;

			// If it's a form attribute, remove the property directly
			if (formAtts.includes(attribute.name)) {
				existing[attribute.name] = '';
			}

			// Remove the attribute
			existing.removeAttribute(attribute.name);

		}

	}

	/**
	 * Check if the desired node is further ahead in the DOM tree
	 * @param  {Node}     node           The node to look for
	 * @param  {NodeList} existingNodes  The DOM tree
	 * @param  {Integer}  index          The starting index
	 * @return {Integer}                 How many nodes ahead the target node is
	 */
	function aheadInTree (node, existingNodes, index) {
		return Array.from(existingNodes).slice(index + 1).find(function (branch) {
			return !(
				node.nodeType !== branch.nodeType ||
				node.tagName !== branch.tagName ||
				node.id !== branch.id ||
				node.src !== branch.src
			);
		});
	}

	/**
	 * Remove scripts from HTML
	 * @param  {Node} elem The element to remove scripts from
	 */
	function removeScripts (elem) {
		let scripts = elem.querySelectorAll('script');
		for (let script of scripts) {
			script.remove();
		}
	}

	/**
	 * Remove any dangerous attributes from a node
	 * @param  {Node} node The potentially dangerous node
	 * @return {Node}      The cleaned node
	 */
	function cleanAttributes (node) {

		// Only run on elements
		if (node.nodeType !== 1) return;

		// Loop through each attribute on the ndoe
		for (let attribute of node.attributes) {

			// If the attribute might be dangerous, remove it
			if (maybeDangerous(attribute.name, attribute.value)) {
				node[attribute.name] = '';
				node.removeAttribute(attribute.name);
			}

		}

		// If the node has child elements, repeat for them
		if (node.childNodes) {
			for (let elem of node.childNodes) {
				cleanAttributes(elem);
			}
		}

	}

	/**
	 * Compare the existing UI to the template and make updates
	 * @param  {Node} template The template HTML
	 * @param  {Node} existing The existing HTML
	 */
	function diff (template, existing) {

		// Don't inject scripts
		removeScripts(template);

		// Get the nodes in the template and existing UI
		let templateNodes = template.childNodes;
		let existingNodes = existing.childNodes;

		// Loop through each node in the template and compare it to the matching element in the UI
		templateNodes.forEach(function (node, index) {

			// If there's no node in the UI at this index, create a copy and add it to the UI
			if (!existingNodes[index]) {
				cleanAttributes(node);
				existing.append(node.cloneNode(true));
				return;
			}

			// If there is, but it's not the same node type, insert the new node before the existing one
			if (node.nodeType !== existingNodes[index].nodeType || node.tagName !== existingNodes[index].tagName || node.id !== existingNodes[index].id) {

				// Check if node exists further in the tree
				let ahead = aheadInTree(node, existingNodes, index);

				if (!ahead) {
					cleanAttributes(node);
					existingNodes[index].before(node.cloneNode(true));
					return;
				}

				// Otherwise, move it to the current spot
				existingNodes[index].before(ahead);

			}

			// If the element is a text node or comment and the text doesn't match, update it
			if ([3, 8].includes(node.nodeType) && node.textContent !== existingNodes[index].textContent) {
				existingNodes[index].textContent = node.textContent;
			}

			// Compare attributes
			diffAttributes(node, existingNodes[index]);

			// If there shouldn't be child nodes but there are, remove them
			if (!node.childNodes.length && existingNodes[index].childNodes.length) {
				existingNodes[index].innerHTML = '';
				return;
			}

			// If DOM is empty and shouldn't be, build it up
			// This uses a document fragment to minimize reflows
			if (!existingNodes[index].childNodes.length && node.childNodes.length) {
				let fragment = document.createDocumentFragment();
				diff(node, fragment);
				existingNodes[index].append(fragment);
				return;
			}

			// If there are nodes within it, recursively diff those
			if (node.childNodes.length) {
				diff(node, existingNodes[index]);
			}

		});

		// Remove any extra nodes in the DOM
		let extra = existingNodes.length - templateNodes.length;
		if (extra < 1)  return;
		for (; extra > 0; extra--) {
			existingNodes[existingNodes.length - 1].remove();
		}

	}

	/**
	 * Debounce rendering for better performance
	 * @param  {Constructor} instance The current instantiation
	 */
	function debounceRender (instance) {

		// If there's a pending render, cancel it
		if (instance._debounce) {
			window.cancelAnimationFrame(instance._debounce);
		}

		// Setup the new render to run at the next animation frame
		instance._debounce = window.requestAnimationFrame(function () {
			instance.render();
		});

	}

	/**
	 * Create handler methods for the proxy
	 * @param  {Constructor} instance The constructor instance
	 * @return {Object}               The handler methods
	 */
	function handler (instance) {
		return {
			get: function (obj, prop) {

				// If the item is an object or array, return a proxy
				if (['[object Object]', '[object Array]'].includes(Object.prototype.toString.call(obj[prop]))) {
					return new Proxy(obj[prop], handler(instance));
				}

				// Otherwise, return the property
				return obj[prop];

			},
			set: function (obj, prop, value) {

				// Update the property
				obj[prop] = value;

				// Render the UI
				debounceRender(instance);

				// Indicate success
				// This is required
				return true;

			},
			deleteProperty: function (obj, prop) {

				// Delete the property
				delete obj[prop];

				// Render the UI
				debounceRender(instance);

				// Indicate success
				// This is required
				return true;

			}
		};
	}

	/**
	 * The Constructor object
	 * @param {String} selector The selector for the element to render into
	 * @param {Object} options  The component options
	 */
	function Constructor (selector, options) {
		this.elem = document.querySelector(selector);
		this.data = new Proxy(options.data, handler(this));
		this.template = options.template;
		this._debounce = null;
	}

	/**
	 * Render the UI
	 */
	Constructor.prototype.render = function () {
		let template = stringToHTML(this.template(this.data));
		diff(template, this.elem);
	};

	return Constructor;

})();