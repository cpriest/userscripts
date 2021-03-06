import {TableConfig} from './TableConfig';
import {max, mean, min, std} from 'mathjs';
import {stripIndent} from 'common-tags';
import {format, snap, zscore} from './util';
import jQuery from 'jquery';
import 'jquery-sparkline';

const PLAIN      = 1,
		PERCENTAGE = 2,
		CURRENCY   = 3;

/**
 * The table marker class is responsible for a given a specific
 * instance of a <TABLE> and handles calculations for it
 */
export class TableMarker {

	get active() { return this._active; }

	set active(x) {
		if((this._active = x)) {
			this.tableEl.classList.add('ttActive');
		} else {
			this.tableEl.classList.remove('ttActive');
		}
	}

	/**
	 * @param {HTMLTableElement} tableEl
	 * @param {TableConfig} tableConfig
	 * @param {Observable} prefs
	 */
	constructor(tableEl, tableConfig, prefs) {
		this.tableEl     = tableEl;
		this.tableConfig = tableConfig;
		this.prefs       = prefs;

		this.onClick = this.onClick.bind(this);
		this.tableEl.addEventListener('click', this.onClick);

		this.prefs.on('zBandScale', (value, prev) => {
			window.requestAnimationFrame(() => {
				this.colorize();
			})
		});

		this.colorize();
	}

	onClick(e) {
		if(!this.active)
			return;

		let row = e.target.closest(this.tableConfig.DataSelector);
		if(!row)
			return;

		row.classList.toggle('ttSelected');
	}

	/**
	 * Queries for the given elements using {selector} and colorizes the rows
	 */
	colorize() {
		for(let row of this.tableEl.querySelectorAll(this.tableConfig.DataSelector))
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
		row.className = row.className.replace(/\bRSD\w+\b/, '');

		// Drop off any remaining header cells
		for(let j = 1; j < this.tableConfig.HeaderColumns; j++)
			cells.shift()

		// Use empty column for sparkline
		let emptyElem = cells.shift();
		emptyElem.innerHTML = '<div class="ttPlots"><span title="Relative Standard Deviation"></span><span></span><span></span></div>';
		let [derivativeStatsElem, boxPlotElem, zSparkElem] = emptyElem.children[0].children;

		// Remaining cells are data
		/** @type {Element[]} */
		let dataElems = cells;

		const fn = this.GetFormatter(dataElems[0]);

		let rowConfig = this.tableConfig.GetColumnConfig(header.textContent);

		const bands = this.tableConfig
			.zScoreBands
			.map((n) => n * this.prefs.zBandScale);

		let dataPointsCount = dataElems.length;

		for(let j = 0; j < rowConfig.SkipCells; j++) {
			let cell = dataElems.shift();
			cell.classList.add('zSkip');
		}

		// Clear any previous scoring
		for(let el of dataElems)
			el.className = el.className.replace(/\bzBand\w+\b/, '');

		dataElems = dataElems
			.filter(el => el.textContent.length);
		if(dataElems.length == 0)
			return;

		let data = dataElems
			.map((el) => this.toNumber(el.textContent));

		let st = {
			min: min(data),
			avg: mean(data),
			max: max(data),
			std: std(data),
		};
		st.RSD = Math.round(st.std / st.avg * 100) / 100;

		derivativeStatsElem.innerText = stripIndent`
			${ fn(st.RSD, PLAIN) }
		`;
//		if(st.RSD <= rowConfig.RSDFilter)
//			row.classList.add('RSD10');

		header.setAttribute('title', stripIndent`
			min: ${fn(st.min)}
			max: ${fn(st.max)}

			avg: ${fn(st.avg)}
			std: ${fn(st.std)}

			RSD: ${fn(st.RSD, PLAIN)}
			
			RSDFilter: ${rowConfig.RSDFilter}
		`);

		let zData    = data.map((n) => zscore(n, st.avg, st.std) * (!rowConfig.Inverted || -1)),
			zSnap    = zData.map((n) => snap(n, bands)),
			zCssName = zSnap.map((n) => {
				let idxOffset = bands.indexOf(n) - Math.floor(bands.length / 2);
				let SignTag   = { '-1': 'Neg', '0': '', '1': 'Pos' }[Math.sign(idxOffset)
					.toString()];

				return `zBand${SignTag}${Math.abs(idxOffset)}`;
			});

		dataElems.forEach((el, idx) => {
			el.setAttribute('title', fn(zData[idx], PLAIN));
			el.classList.add(zCssName[idx]);
		})

		let hlElem;

		function tooltipFormatter(line, options, [{ value, color, isNull, offset: index}]) {
			return `
				<div><span style="color: ${color};">&#9679;</span> zScore: ${fn(value, PLAIN)}</div>
				<div>value: ${fn(data[index])}</div>
			`;
		}

		let plotWidth = ((dataPointsCount * 4) + dataPointsCount - 1) + 'px';

		zSparkElem.style.width = plotWidth;
		emptyElem.style.padding = '1px';
		let zMax = Math.max(...zData.map(n => Math.abs(n)));

		jQuery(zSparkElem)
			.sparkline(zData, {
				type:     'bar',
				zeroValueColor: '#D0D0D0',
				nullValueColor: '#D0D0D0',
				colorMap: {
					':-2':      '#CC0000',
					'-2:-1.3':  '#FFA0A0',
					'-1.3:1.3': '#C0C0C0',
					'1.3:2':    '#90FF90',
					'2:':       '#00AA00',
				},
				tooltipFormatter,
				height: 19,
				zeroAxis: true,
				tooltipOffsetY: 25,
				chartRangeMin: -zMax,
				chartRangeMax: zMax,
			})
			.bind('sparklineRegionChange', (ev) => {
				if(hlElem)
					hlElem.style.outline = '';
				let [ { offset: index}] = ev.sparklines[0].getCurrentRegionFields();
				hlElem = dataElems[index];
				if(hlElem)
					hlElem.style.outline = '2px dotted #FF00FF';
			})
			.bind('mouseleave', (ev) => {
				if(hlElem)
					hlElem.style.outline = '';
			});

		boxPlotElem.style.display = 'none';
/*
//		let boxData = data.map((i) => {
		let boxData = zData.map((i) => {
			return i+10;
//			if(fn.dataType === PERCENTAGE)
//				return i * 100;
//			return i;
		});
		jQuery(boxPlotElem)
			.sparkline(boxData, {
				type: 'box',
				width: 50,
				outlierFillColor: '#FF00FF',
				outlierLineColor: '#FF00FF',
				tooltipOffsetY: 25,
				numberFormatter: (i) => {
//					if(fn.dataType === PERCENTAGE)
//						return fn(i / 100);
					return fn(i-10, PLAIN);
				},
		});
*/
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
	 * Returns a function which formats numbers the same as the given data element
	 *
	 * @param {Element} dataElem
	 * @return {function({number}, {string}? )}
	 */
	GetFormatter(dataElem) {
		let dataType = PLAIN;
		if(dataElem.textContent.indexOf('%') >= 0)
			dataType = PERCENTAGE;
		else if(dataElem.textContent.indexOf('$') >= 0)
			dataType = CURRENCY;

		let fn = function fn(n, type) {
			switch(type || dataType) {
				case CURRENCY:
					return `$${format(n)}`;
				case PERCENTAGE:
					return `${format(n * 100)}%`;
			}
			if(isNaN(n))
				return format(0);
			return format(n);
		}
		fn.dataType = dataType;
		return fn;
	}

}
