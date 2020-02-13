import { TableConfig } from 'TableConfig.js';

export function zscore(n, mean, stddev) {
	return (n - mean) / stddev;
}

export function clamp(n, bottom = 0.0, top = 1.0) {
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
export function remap1(n, start, end) {
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
export function remap(n, start1, end1, start2, end2) {
	return start2 + ((end2 - start2) * ((n - start1) / (end1 - start1)));
}

/**
 *
 * @param {number} n
 * @param {Number[]} bands
 * @return {*}
 */
export function snap(n, bands) {
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


export class TheOneRing {

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

			let adjust = .1 * (e.key == '+' || -1);

			this.zBandScale = min(.1, this.zBandScale + adjust);
			console.log('zScale Now %.1f', this.zBandScale);
//			console.log(e.key, e.keyCode, e, h);
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
		for(let elem of this.tables)
			elem.addEventListener('click', this.onClick);
	}

	onClick(e) {
		if(!this.active)
			return;

		let row = e.target.closest(this.tableConfig.DataSelector);
		if(!row)
			return;

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
	 * @param {boolean} toggle Toggle the highlight or add
	 */
	colorizeRow(row, toggle = true) {
		if(toggle) {
			row.classList.toggle('ttHighlight');
			if(!row.classList.contains('ttHighlight'))
				return;
		} else {
			row.classList.add('ttHighlight');
		}

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

		const bands = this.tableConfig.zScoreBands;

		for(let j = 0; j < rowConfig.SkipCells; j++) {
			let cell = dataElems.shift();
			cell.classList.add('zSkip');
		}

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
