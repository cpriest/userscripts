let sampleColumnConfig = `
	".+" : {				// Row Header Names this configuration applies to
		SkipCells: 1,       // Number of data cells to skip for calculations
		Inverted: false,	// Invert the zBand scores (inverts colors)
	},
`;

export class ColumnConfig {
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
