'use strict';

//xnoinspection ES6UnusedImports
//import './Header.js';
//import 'style/default.css';

import {TheOneRing} from './TheRing';
import './style/default.css';


let TOR = new TheOneRing({
	Selector:      'TABLE[jsclass=CrossTable]',		// CSS Selector to target which tables are targetable
	DataSelector:  'TR.DataRow',					// CSS Selector to select which rows are data rows
	HeaderColumns: 4,								// Column count which are not considered data
	zScoreBands:   [-2.0, -1.3, 0.0, 1.3, 2.0],		// The zScore bounds to which zScores will be (fix)ed to

	// Each column name is matched against all patterns, settings for row titles matching a pattern will be
	// merged together with least to greatest priority, defaults should start at the first position
	Columns: {
		'.+': {					// Row Header Names this configuration applies to
			SkipCells: 1,       // Number of data cells to skip for calculations
			Inverted: false,	// Invert the zBand scores (inverts colors)
			RSDFilter: 0.1		// Skip zBand colorizing if Relative Standard Distribution is <= to this value
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
});

//if(module.hot) {
//	module.hot.accept();
//}
