// ==UserScript==
// @name         table-tool
// @namespace    cmp.tt
// @version      0.3.0
// @description  Provides useful tools for TABLE elements
// @author       Clint Priest
// @match        none
// @grant        none
// @source       
// @license      MIT
// @homepage     https://github.com/cpriest/userscripts/tree/master/table-tool/
// @updateURL    https://raw.githubusercontent.com/cpriest/userscripts/master/table-tool/release/table-tool.user.js
// @require      https://unpkg.com/hotkeys-js/dist/hotkeys.min.js
// @require      https://unpkg.com/mathjs/dist/math.min.js
// @require      https://unpkg.com/sprintf-js/dist/sprintf.min.js
// ==/UserScript==

let cl = console.log.bind(console);

let Prefs, TOR;

let DefaultPrefs = {
	SkipColumns: 4
};

class Preferences {
	constructor() {
		Object.assign(this, DefaultPrefs);
	}
}

let sampleColumnConfig = `
	".+" : {				// Row Header Names this configuration applies to
		SkipCells: 1,       // Number of data cells to skip for calculations
		Inverted: false,	// Invert the zBand scores (inverts colors)
	},
`;

class ColumnConfig {
	/**
	 * Constructs a ColumnConfig object with the given {options}, throws upon error
	 *
	 * @param {TableConfig}   table 	The TableConfig to which this applies
	 * @param {string|object} options	The configuration in a json5 string or as options
	 */
	constructor(table, options) {
		if(typeof options == 'string')
			throw 'JSON5 not yet implemented';

		let defaults = {
			SkipCells: 1,       // Number of data cells to skip for calculations
			Inverted:  false,	// Invert the zBand scores (inverts colors)
		};
		this.config   = Object.assign(defaults, options);
	}

	/** @returns {number} */
	get SkipCells() { return this.config.SkipCells; }

	/** @returns {boolean} */
	get Inverted() { return this.config.Inverted; }
}

//language=JSON5
let sampleTableConfig = `
{
	Selector: 		'TABLE[jsclass=CrossTable]',	// CSS Selector to target which tables are targetable
	DataSelector: 	'TR.DataRow',					// CSS Selector to select which rows are data rows
	HeaderColumns:	3,								// Column count which are not considered data
	zScoreBands: 	[-2.0, -1.3, 0.0, 1.3, 2.0],	// The zScore bounds to which zScores will be (fix)ed to

	// Each column name is matched against all patterns, settings for row titles matching a pattern will be
	// merged together with least to greatest priority, defaults should start at the first position
	Columns: {
		"/.+/" : {				// Row Header Names this configuration applies to
			SkipCells: 1,       // Number of data cells to skip for calculations
			Inverted: false,	// Invert the zBand scores (inverts colors)
		},
		"/Disabled|(Unsubscribe|Complaint|Bounce|Block)s?/": {
			Inverted: true,
		},
		"/RPC|CPM|.+\bRate$/": {
			SkipCells: 0,
		},
	}
}
`;

class TableConfig {
	/**
	 * Constructs a TableConfig object with the given {options}, throws upon error
	 *
	 * @param {string|object} options	The configuration in a json5 string or as options
	 *
	 */
	constructor(options) {
		if(typeof options == 'string')
			throw 'JSON5 not yet implemented';

		let defaults = {
			Selector: 'TABLE',							// CSS Selector to target which tables are targetable
			DataSelector: 'TR',							// CSS Selector to select which rows are data rows
			HeaderColumns: 1,							// Column count which are not considered data
			zScoreBands:   [-2.0, -1.3, 0.0, 1.3, 2.0],	// The zScore bounds to which zScores will be (fix)ed to

			Columns: {},								// Column Configuration
		};

		this.columns = {};
		this.config = Object.assign(defaults, options);

		for(let [pattern, colOpts] of Object.entries(this.config.Columns))
			this.columns[pattern] = new ColumnConfig(this, colOpts);
	}

	/** @return {string} */
	get Selector() { return this.config.Selector; }

	/** @return {string} */
	get DataSelector() { return this.config.DataSelector; }

	/** @return {number} */
	get HeaderColumns() { return this.config.HeaderColumns; }

	/** @return {number[]} */
	get zScoreBands() { return this.config.zScoreBands; }

	/**
	 * Returns the assembled config for the given header
	 *
	 * @param {string}	header	The string of the header element
	 * @return {ColumnConfig}
	 */
	GetColumnConfig(header) {
		let assembled = {};
//		console.group(header);
		for(let [pattern, config] of Object.entries(this.columns)) {
			if(header.match(pattern)) {
//				console.log('%cMatched: %s', 'color: green;', pattern);
				Object.assign(assembled, config.config);
//			} else {
//				console.log('%cDid not match: %s', 'color: red;', pattern);
			}
		}
//		console.log(assembled);
//		console.groupEnd();
		return new ColumnConfig(this, assembled);
	}
}

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

let staticConfig = {
	Selector:      'TABLE[jsclass=CrossTable]',		// CSS Selector to target which tables are targetable
	DataSelector:  'TR.DataRow',					// CSS Selector to select which rows are data rows
	HeaderColumns: 4,								// Column count which are not considered data
	zScoreBands:   [-2.0, -1.3, 0.0, 1.3, 2.0],		// The zScore bounds to which zScores will be (fix)ed to

	// Each column name is matched against all patterns, settings for row titles matching a pattern will be
	// merged together with least to greatest priority, defaults should start at the first position
	Columns: {
		".+":                                              {				// Row Header Names this configuration applies to
			SkipCells: 1,       // Number of data cells to skip for calculations
			Inverted:  false,	// Invert the zBand scores (inverts colors)
		},
		"Disabled|(Unsubscribe|Complaint|Bounce|Block)s?": {
			Inverted: true,
		},
		"RPC|CPM|.+Rate$":                                {
			SkipCells: 0,
		},
	}
};


class TheOneRing {

	/**
	 * @constructor
	 * @param {TableConfig} tableConfig		The table configuration for TheOneRing
	 */
	constructor(tableConfig) {

		this.tableConfig = new TableConfig(staticConfig);

		this.zBandScale = 1.0;

		hotkeys('Control+\'', (e, h) => {
			this.toggleActive();
			this.colorizeSelector(this.tableConfig.DataSelector);
		});
		hotkeys('h', 'active', (e, h) => {
			this.colorizeSelector(this.tableConfig.DataSelector);
			return false;
		});
		hotkeys('*', 'active', (e, h) => {
			if((e.key != '+' && e.key != '-') || e.xshiftKey || e.altKey || e.ctrlKey)
				return;

			let adjust = .05 * (e.key == '+' || -1);

			this.zBandScale = Math.max(.1, this.zBandScale + adjust);
			console.log('zScale Now %.1f', this.zBandScale);
//			console.log(e.key, e.keyCode, e, h);

			this.colorizeSelector(this.tableConfig.DataSelector);
			return false;
		});
	}

	/**
	 * Activates and initializes or deactivates if not active
	 */
	toggleActive() {
		if(this.active === undefined)
			this.initialize();
		this.active = !this.active;

		if(this.active) {
			hotkeys.setScope('active');
			for(let el of this.tables)
				el.classList.add('ttActive');
		} else {
			hotkeys.setScope('all');
			for(let el of this.tables)
				el.classList.remove('ttActive');
		}
	}

	initialize() {
		this.active  = false;
		this.onClick = this.onClick.bind(this);
		this.tables = Array.from(document.querySelectorAll(this.tableConfig.Selector));
//		for(let elem of this.tables)
//			elem.addEventListener('click', this.onClick);
	}

	onClick(e) {
		if(!this.active)
			return;

		let row = e.target.closest(this.tableConfig.DataSelector);
		if(!row)
			return;

		if(row.classList.contains('ttHighlight')) {
			row.classList.remove('ttHighlight');
			return;
		}

		this.colorizeRow(row);
	}

	/**
	 * Queries for the given elements using {selector} and colorizes the rows
	 *
	 * @param {string} selector
	 */
	colorizeSelector(selector) {
		for(let row of document.querySelectorAll(selector))
			this.colorizeRow(row);
	}
	/**
	 * Colorizes the row according to analysis
	 *
	 * @param {Element} row	The row of data to highlight
	 */
	colorizeRow(row) {
		row.classList.add('ttHighlight');

		/** @type {Element[]} */
		let cells = Array.from(row.children);

		// Header is assumed to be first cell
		let header = cells.shift();

		// Drop off any remaining header cells
		for(let j = 1; j < this.tableConfig.HeaderColumns; j++)
			cells.shift();

		// Remaining cells are data
		/** @type {Element[]} */
		let dataElems = cells;

		let rowConfig = this.tableConfig.GetColumnConfig(header.textContent);
//		console.log(header.textContent, rowConfig);

		const bands = this.tableConfig
			.zScoreBands
			.map((n) => n * this.zBandScale);

		for(let j = 0; j < rowConfig.SkipCells; j++) {
			let cell = dataElems.shift();
			cell.classList.add('zSkip');
		}

		// Clear any previous scoring
		dataElems.forEach((el) => {
			for(let cl of el.classList) {
				if(cl.match(/^zBand/))
					el.classList.remove(cl);
			}
		});

		let data = dataElems.map((el) => this.toNumber(el.textContent));

		let mean     = math.mean(data),
			stddev   = math.std(data),
			variance = math.variance(data);

		let zData    = data.map((n) => zscore(n, mean, stddev) * (!rowConfig.Inverted || -1)),
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

//noinspection ES6UnusedImports





(function() {
	'use strict';

	Prefs = new Preferences();

	TOR = new TheOneRing();


})();

(function(){
  const $style = document.createElement('style');

  $style.innerHTML = `DIV#TableTools {
  position: absolute;
}
DIV#TableTools > DIV.State {
  position: absolute;
  text-align: right;
}

TABLE.ttActive[jsclass=CrossTable] TR.ttHighlight :nth-child(1) {
  background-color: #e0ffff;
}
TABLE.ttActive[jsclass=CrossTable] TR.ttHighlight > .zSkip {
  color: #808080;
}
TABLE.ttActive[jsclass=CrossTable] TR.ttHighlight > .zBandNeg2 {
  background-color: #FF0000;
  font-weight: bold;
}
TABLE.ttActive[jsclass=CrossTable] TR.ttHighlight > .zBandNeg1 {
  background-color: #FFc0c0;
}
TABLE.ttActive[jsclass=CrossTable] TR.ttHighlight > .zBand0 {
  background-color: white;
}
TABLE.ttActive[jsclass=CrossTable] TR.ttHighlight > .zBandPos1 {
  background-color: #c0FFc0;
}
TABLE.ttActive[jsclass=CrossTable] TR.ttHighlight > .zBandPos2 {
  font-weight: bold;
  background-color: #00FF00;
}

/*# sourceMappingURL=default.css.map */
`;
  document.body.appendChild($style);
})();