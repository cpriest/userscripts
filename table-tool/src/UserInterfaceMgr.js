import {TheOneRing} from './TheRing';
import hotkeys from 'hotkeys-js';
import {TableConfig} from './TableConfig';
import {TableMarker} from './TableMarker';

let tableConfig = {
	Selector:      'TABLE[jsclass=CrossTable]',		// CSS Selector to target which tables are targetable
	DataSelector:  'TR.DataRow',					// CSS Selector to select which rows are data rows
	HeaderColumns: 4,								// Column count which are not considered data
	zScoreBands:   [-2.0, -1.3, 0.0, 1.3, 2.0],		// The zScore bounds to which zScores will be (fix)ed to

	// Each column name is matched against all patterns, settings for row titles matching a pattern will be
	// merged together with least to greatest priority, defaults should start at the first position
	Columns: {
		'.+': {					// Row Header Names this configuration applies to
			SkipCells: 1,       // Number of data cells to skip for calculations
			Inverted:  false,	// Invert the zBand scores (inverts colors)
			RSDFilter: 0.1,		// Skip zBand colorizing if Relative Standard Distribution is <= to this value
		},

		'Disabled|(Unsubscribe|Complaint|Bounce|Block)s?': {
			Inverted: true,
		},

		'RPC|CPM|Revenue': {
			SkipCells: 2,
		},

		'.+Rate$': {
			SkipCells: 0,
			RSDFilter: 0.05,
		},
	},
};

/**
 * @property {Element} bar
 */
export class UserInterfaceMgr {
	set keysText(x) { this.bar.left[1] = x; }

	constructor() {
		this.TOR = new TheOneRing(tableConfig);

		this.tableConfig = new TableConfig(tableConfig);

		this.prefs = {
			zBandScale: 1.0,
		}

		hotkeys('Control+\'', (e, h) => {
			this.toggleActive();
			return false;
		});
	}

	/**
	 * Activates and initializes or deactivates if not active
	 */
	toggleActive() {
		this.TOR.toggleActive();
		if(this.active === undefined)
			this.initialize();

		this.active = !this.active;

		for(let tm of this.tables)
			tm.active = this.active;

		if(this.active) {
//			hotkeys.setScope('active');
//			for(let el of this.tables)
//				el.classList.add('ttActive');
			this.bar.style.display = '';
			return;
		}
//		hotkeys.setScope('all');
//		for(let el of this.tables)
//			el.classList.remove('ttActive');
		this.bar.style.display = 'none';
	}

	initialize() {
		this.active = false;

		document.body.insertAdjacentHTML('beforeend', '<status-bar></status-bar>');
		this.bar = document.body.lastElementChild

		this.bar.style.display = 'none';

		this.bar.right = 'table-tools';

		this.tables = Array.from(document.querySelectorAll(this.tableConfig.Selector))
			.map((el) => {
				return new TableMarker(el, this.tableConfig, this.prefs);
			});
	}
}
