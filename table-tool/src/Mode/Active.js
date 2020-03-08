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
		hotkeys('-,shift:=,+,=', { splitKey: ':' }, (e, h) => {
			if(['active'].indexOf(hotkeys.getScope()) === -1 || e.altKey || e.ctrlKey)
				return;

			if(e.key === '=') {
				this.prefs.zBandScale = 1.0;
				return false;
			}

			let adjust = 0.050 * (e.key == '+' || -1);

			this.prefs.zBandScale = Math.max(.1, this.prefs.zBandScale + adjust);

			return false;
		});


		/**
		 * Technically this is part of 'select' mode, which isn't fully fleshed out or even in the long
		 * term plans (as of now), but moving it here from TheRing.js to keep it around
		 */
		hotkeys('esc', 'active', (e, h) => {
			if(['active'].indexOf(hotkeys.getScope()) === -1)
				return;

			for(let el of document.querySelectorAll(`${this.tableConfig.Selector} ${this.tableConfig.DataSelector}.ttSelected`))
				el.classList.remove('ttSelected');
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
