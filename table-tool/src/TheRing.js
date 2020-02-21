import {TableConfig} from './TableConfig';
import {max, mean, min, std} from 'mathjs';
import {stripIndent} from 'common-tags';
import hotkeys from 'hotkeys-js';

// Number Format ~ %.2f
let nf = new Intl.NumberFormat('en-us', {
	minimumFractionDigits: 0,
	maximumFractionDigits: 2,
});

export function format(n) {
	return nf.format(n);
}

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

const PLAIN    = 1,
	  PERCENTAGE  = 2,
		CURRENCY = 3;

//{	zzz } = a;

export class TheOneRing {

	/**
	 * @constructor
	 * @param {object} tableConfig		The table configuration for TheOneRing
	 */
	constructor(tableConfig) {

		this.tableConfig = new TableConfig(tableConfig);

		this.zBandScale = 1.0;

		hotkeys('Control+\'', (e, h) => {
			this.toggleActive();
			this.colorizeSelector(this.tableConfig.DataSelector);
			return false;
		});

		hotkeys('h', 'active', (e, h) => {
			this.colorizeSelector(this.tableConfig.DataSelector);
			return false;
		});

		hotkeys('t', 'active', (e, h) => {
			let { table, cell, row } = this.GetValidHoverElements();
			if(table === undefined)
				return;

			this.ToggleTagged(cell.tagName == 'TH' ? row : cell);

			return false;
		});

		hotkeys('left, right', 'active', (e, h) => {
			let { table, cell, row } = this.GetValidHoverElements();
			if(table === undefined)
				return;

			if(h.shortcut == 'left') {
				let rowLevel = row.getAttribute('level'),
					groupRow = row;

				while(groupRow && groupRow.getAttribute('level') == rowLevel)
					groupRow = groupRow.previousElementSibling;

				if(groupRow) {
					groupRow.firstElementChild.click();
					return false;
				}
				return;
			}

			if(row.firstElementChild.classList.contains('LevelCollapse')) {
				row.firstElementChild.click();
				return false;
			}
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

		this.toggleActive();
		this.colorizeSelector(this.tableConfig.DataSelector);
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
		this.tables  = Array.from(document.querySelectorAll(this.tableConfig.Selector));
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

		// Remove any previous RSD__ class names
		for(let cl of row.classList) {
			if(cl.match(/^(RSD)/))
				header.classList.remove(cl);
		}

		// Drop off any remaining header cells
		for(let j = 1; j < this.tableConfig.HeaderColumns; j++)
			cells.shift();

		// Remaining cells are data
		/** @type {Element[]} */
		let dataElems = cells;
		let dataType  = PLAIN;
		if(dataElems[0].textContent.indexOf('%') >= 0)
			dataType = PERCENTAGE;
		else if(dataElems[0].textContent.indexOf('$') >= 0)
			dataType = CURRENCY;

		function fn(n, type = dataType) {
			switch(type) {
				case CURRENCY:
					return `$${format(n)}`;
				case PERCENTAGE:
					return `${format(n * 100)}%`;
			}
			return format(n);
		}

		let rowConfig = this.tableConfig.GetColumnConfig(header.textContent);
//		if(header.textContent.match(/Unsubscribe/))
//			console.log(header.textContent, rowConfig);

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
				if(cl.match(/^(zBand)/))
					el.classList.remove(cl);
			}
		});

		let data = dataElems.map((el) => this.toNumber(el.textContent));

		let st = {
			min: min(data),
			avg: mean(data),
			max: max(data),
			std: std(data),
		};
		st.RSD = st.std / st.avg;

		let RsdClass = (() => {
			if(st.RSD <= 0.10)
				return 'RSD10';
//			if(ST.RSD <= 0.15)
//				return 'RSD15';
//			if(ST.RSD <= 0.20)
//				return 'RSD20';
		})();
		if(RsdClass)
			row.classList.add(RsdClass);

		header.setAttribute('title', stripIndent`
			min: ${fn(st.min)}
			max: ${fn(st.max)}

			avg: ${fn(st.avg)}
			std: ${fn(st.std)}

			RSD: ${fn(st.RSD, PLAIN)}
		`);

		let zData    = data.map((n) => zscore(n, st.avg, st.std) * (!rowConfig.Inverted || -1)),
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
			el.setAttribute('title', fn(zData[idx], PLAIN));
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

	/**
	 * @param {HTMLElement} el	The element to tag
	 */
	ToggleTagged(el) {
		el.classList.toggle('Tagged');
	}

	/**
	 * Returns {table, row, cell} under the cursor, if the elements are a part of a targeted table
	 *
	 * @return {{table: HTMLElement?, row: HTMLElement?, cell: HTMLElement?}}
	 */
	GetValidHoverElements() {
		let hoverElem    = Array.from(document.querySelectorAll(':hover'))
			.pop(),
			closestTable = hoverElem.closest('TABLE');

		if(!closestTable || !closestTable.matches(this.tableConfig.Selector))
			return { };

		let cell = hoverElem.closest('TH, TD'),
			row = hoverElem.closest('TR');

		return {table: closestTable, row, cell};
	}
}
