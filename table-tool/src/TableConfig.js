import { ColumnConfig } from './ColumnConfig.js';

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

export class TableConfig {
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

		this.CCCache = { };
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
//		let log = true || header.match(/Unsubscribe/);

		if(this.CCCache[header]) {
//			log && console.log('%s Cached: %o', header, this.CCCache[header]);
			return this.CCCache[header];
		}

		let assembled = Object.assign({}, ColumnConfig.prototype.defaults);

//		log && console.groupCollapsed(header);
		for(let [pattern, config] of Object.entries(this.columns)) {
			if(header.match(pattern)) {
				Object.assign(assembled, config.config);
//				log && console.log('%cMatched: %s', 'color: green; config=%o, assembled=%o', pattern, config.config, assembled);
			} else {
//				log && console.log('%cDid not match: %s', 'color: red;', pattern);
			}
		}
//		log && console.log(assembled);
//		log && console.groupEnd();
		return (this.CCCache[header] = new ColumnConfig(this, assembled));
	}
}
