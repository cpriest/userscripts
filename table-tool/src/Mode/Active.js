import {ModeBase} from './Mode.js';
import hotkeys from 'hotkeys-js';

export class Active extends ModeBase {
	constructor(UI) {
		super(UI);

		/**
		 * (t)ag hovered cell
		 */
		hotkeys('t', (e, h) => {
			if(['active'].indexOf(hotkeys.getScope()) === -1)
				return;

			this.TagHoverElement()
			return false;
		});
	}

	/**
	 * Toggles the Tagged class on a hovered cell or row if it belongs
	 * to a table-tool handled table
	 */
	TagHoverElement() {
		let { table, cell, row } = this.UI.GetValidHoverElements();
		if(table === undefined)
			return;

		((cell.tagName == 'TH' && row) || cell)
			.classList.toggle('Tagged');
	}
}
