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

		hotkeys('left, right', (e, h) => {
			if(['active'].indexOf(hotkeys.getScope()) === -1)
				return;

			let { table, cell, row } = this.UI.GetValidHoverElements();
			if(table === undefined)
				return;

			if(h.shortcut == 'left') {
				let rowLevel = row.getAttribute('level'),
					groupRow = row;

				while(groupRow && groupRow.getAttribute('level') == rowLevel)
					groupRow = groupRow.previousElementSibling;

				if(groupRow) {
					window.scrollBy(0, groupRow.clientHeight);
					groupRow.firstElementChild.click();
					return false;
				}
				return;
			}

			// h.shortcut == 'right'
			if(row.firstElementChild.classList.contains('LevelCollapse')) {
				row.firstElementChild.click();
				return false;
			}
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
