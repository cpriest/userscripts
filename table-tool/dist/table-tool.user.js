// ==UserScript==
// @name         table-tool
// @namespace    cmp.tt
// @version      0.1.0
// @description  Provides useful tools for TABLE elements
// @author       Clint Priest
// @match        *://*/*
// @grant        none
// @source       
// @license      MIT
// @homepage     https://github.com/cpriest/userscripts/table-tool/
// @updateURL    https://raw.githubusercontent.com/cpriest/userscripts/master/table-tool/release/table-tool.user.js
// @require      https://unpkg.com/hotkeys-js/dist/hotkeys.min.js,https://unpkg.com/mathjs/dist/math.min.js,https://unpkg.com/sprintf-js/dist/sprintf.min.js
// ==/UserScript==

// src/Header.js
let cl = console.log.bind(console);

let Prefs, TOR;

// src/Prefs.js
let DefaultPrefs = {
	SkipColumns: 4
};

class Preferences {
	constructor() {
		Object.assign(this, DefaultPrefs);
	}
}

// src/TheRing.js
function zscore(n, mean, stddev) {
	return (n - mean) / stddev;
}

function clamp(n, bottom = 0.0, top = 1.0) {
	if(n < bottom)
		return bottom;
	if(n > top)
		return top;
	return n;
}

/**
 * Remaps a 0-1 number n to the range of start - end
 *
 * @param {Number} n
 * @param {Number} start
 * @param {Number} end
 *
 * @return {number}
 */
function remap1(n, start, end) {
	return (end - start) * clamp(n) + start;
}

/**
 * Remaps a number n from start/end1 range to start/end2 range
 *
 * @param {Number} n
 * @param {Number} start1
 * @param {Number} end1
 * @param {Number} start2
 * @param {Number} end2
 *
 * @return {number}
 */
function remap(n, start1, end1, start2, end2) {
	return start2 + ((end2 - start2) * ((n - start1) / (end1 - start1)));
}

/**
 *
 * @param {number} n
 * @param {Number[]} bands
 * @return {*}
 */
function snap(n, bands) {
	if(isNaN(n))
		return 0;
	return bands.find((val, idx, bands) => {
		if(n < 0)
			return n <= val;
		if(idx === bands.length - 1)
			return true;
		return n < bands[idx + 1];
	});
}

class TheOneRing {

	/**
	 * @constructor
	 */
	constructor() {
		hotkeys('Control+\'', (e, h) => {
			this.toggleActive();
		});
//		this.toggleActive();
	}

	/**
	 * Activates and initializes or deactivates if not active
	 */
	toggleActive() {
		if(this.active === undefined)
			this.initialize();
		this.active = !this.active;
		cl('now %s', this.active ? 'active' : 'inactive');
		for(let row of document.querySelectorAll('TR.DataRow'))
			this.colorizeRow(row);
	}

	initialize() {
		this.active  = false;
		this.onClick = this.onClick.bind(this);
		for(let elem of document.querySelectorAll('TABLE[jsclass="CrossTable"]'))
			elem.addEventListener('click', this.onClick);
	}

	onClick(e) {
		let row = e.target.closest('TR.DataRow');
		if(!row)
			return;

		this.colorizeRow(row);
	}

	/**
	 * Colorizes the row according to analysis
	 *
	 * @param {Element} row	The row of data to highlight
	 */
	colorizeRow(row) {
		row.classList.toggle('ttHighlight');
		if(!row.classList.contains('ttHighlight'))
			return;

		/** @type {Element[]} */
		let dataElems = Array.from(row.children)
			.slice(Prefs.SkipColumns);

		const bands = [-2, -1.3, 0, 1.3, 2];

		let data = dataElems.map((el) => this.toNumber(el.textContent));

		let mean     = math.mean(data),
			stddev   = math.std(data),
			variance = math.variance(data);

		let zData    = data.map((n) => zscore(n, mean, stddev)),
			zSnap    = zData.map((n) => snap(n, bands)),
			zCssName = zSnap.map((n) => {
				let idxOffset = bands.indexOf(n) - Math.floor(bands.length / 2);
				let SignTag   = { '-1': 'Neg', '0': '', '1': 'Pos' }[Math.sign(idxOffset)
					.toString()];

				return `zBand${SignTag}${Math.abs(idxOffset)}`;
			});
//		console.log(e, row);
//		console.log(dataElems, data);
//		cl('mean: %.4f, std: %.4f, var: %.4f', mean, stddev, variance);
//
//		cl('bands     = ', bands);
//		cl('data      = ', data);
//		cl('zData     = ', zData);
//		cl('zSnap     = ', zSnap);
//		cl('zCssName  = ', zCssName);

		dataElems.forEach((el, idx) => {
			el.classList.add(zCssName[idx]);
		});
		// 	-2		-1.5		1.5		2
	}

	/**
	 * Converts a nicely formatted number to a real number
	 *
	 * @param {string} n
	 *
	 * @return {number}
	 */
	toNumber(n) {
		n = n.replace(/[$,]/g, '');
		if(n.indexOf('%') >= 0)
			return parseFloat(n.replace(/%/, '')) / 100;
		return parseFloat(n);
	}
}

// src/index.js
//noinspection ES6UnusedImports





(function() {
	'use strict';

	Prefs = new Preferences();

	TOR = new TheOneRing();

	cl('54fd71cc37280a616c5135a1277c0f35 *./dist/table-tool.user.js');
})();

// CSS injection
(function(){
  const $style = document.createElement('style');

  $style.innerHTML = `/* src/style/default.css */
DIV#TableTools {
  position: absolute;
}
DIV#TableTools > DIV.State {
  position: absolute;
  text-align: right;
}

TABLE[jsclass=CrossTable] TR.ttHighlight :nth-child(-n+3) {
  background-color: #e0ffff;
}
TABLE[jsclass=CrossTable] TR.ttHighlight > .zBandNeg2 {
  background-color: #FF0000;
  font-weight: bold;
}
TABLE[jsclass=CrossTable] TR.ttHighlight > .zBandNeg1 {
  background-color: #FFc0c0;
}
TABLE[jsclass=CrossTable] TR.ttHighlight > .zBand0 {
  background-color: #fefefe;
}
TABLE[jsclass=CrossTable] TR.ttHighlight > .zBandPos1 {
  background-color: #c0FFc0;
}
TABLE[jsclass=CrossTable] TR.ttHighlight > .zBandPos2 {
  font-weight: bold;
  background-color: #00FF00;
}

/*# sourceMappingURL=default.css.map */
`;
  document.body.appendChild($style);
})();