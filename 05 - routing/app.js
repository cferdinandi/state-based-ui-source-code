// Create a new list component
var lists = new Component('[data-app="lists"]', {
	data: {
		listItems: []
	},
	template: function (props) {

		var baseHTML =
			'<p><a href="settings.html">Settings &rarr;</a></p>' +
			'<h1>List Maker</h1>' +

			'<form id="add-to-list">' +
				'<label for="list-item">What do you want to add to your list?</label>' +
				'<input type="text" id="list-item" autofocus>' +
				'<button>Add to your list</button>' +
			'</form>' +

			'<div id="list"></div>';

		// If there are no list items
		if (props.listItems.length < 1) return baseHTML + '<p><em>You do not have any list items yet. Try adding one with the form above.</em></p>';

		// If there are
		return baseHTML + '<ul>' + props.listItems.map(function (item) {
			return '<li>' + item + '</li>';
		}).join('') + '</ul>';

	}
});

// Create a settings component
var settings = new Component('[data-app="settings"]', {
	template: function () {
		var html =
			'<p><a href="index.html">&larr; Back to Lists</a></p>' +
			'<h1>Settings</h1>' +
			'<p>A settings UI would go here.</p>';
		return html;
	}
});

var submitHandler = function (event) {

	// Make sure the submitted form was for our list items
	if (!event.target.matches('#add-to-list')) return;

	// Stop the form from submitting
	event.preventDefault();

	// Get the list item
	var item = event.target.querySelector('#list-item');
	if (!item || item.length < 1) return;

	// Reactively update the data
	var items = lists.getData();
	items.listItems.push(item.value);
	lists.setData({listItems: items.listItems});

	// Clear the field and return to focus
	item = document.querySelector('#list-item');
	if (!item) return;
	item.focus();

};


// Get the app container
var app = document.querySelector('[data-app]');

// Determine the view/UI
var page = app.getAttribute('data-app');

if (page === 'lists') {

	// Render the initial UI
	lists.render();

	// Listen for form submissions
	document.addEventListener('submit', submitHandler, false);

}

if (page === 'settings') {
	settings.render();
}