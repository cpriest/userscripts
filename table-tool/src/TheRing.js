import {TableConfig} from './TableConfig';
import hotkeys from 'hotkeys-js';


//{	zzz } = a;

export class TheOneRing {

	/**
	 * @constructor
	 * @param {object} tableConfig		The table configuration for TheOneRing
	 */
	constructor(tableConfig) {

		this.tableConfig = new TableConfig(tableConfig);

		this.zBandScale = 1.0;

		hotkeys('s', 'active', (e, h) => {
			console.log('s in active,select mode');
			hotkeys.setScope('select');
		})

		hotkeys('h', 'select', (e, h) => {
			console.log('h in select mode');
//			this.colorizeSelector(this.tableConfig.DataSelector);
			return false;
		});


		hotkeys('esc', 'active', (e, h) => {
			for(let el of document.querySelectorAll(`${this.tableConfig.Selector} ${this.tableConfig.DataSelector}.ttSelected`))
				el.classList.remove('ttSelected');
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
//			for(let el of this.tables)
//				el.classList.add('ttActive');
//			this.colorizeSelector(this.tableConfig.DataSelector);
		} else {
			hotkeys.setScope('all');
//			for(let el of this.tables)
//				el.classList.remove('ttActive');
		}
	}

	initialize() {
		this.active  = false;
//		this.onClick = this.onClick.bind(this);

//		this.tables  = Array.from(document.querySelectorAll(this.tableConfig.Selector));
//		for(let elem of this.tables)
//			elem.addEventListener('click', this.onClick);
	}

//	onClick(e) {
//		if(!this.active)
//			return;
//
//		let row = e.target.closest(this.tableConfig.DataSelector);
//		if(!row)
//			return;
//
//		row.classList.toggle('ttSelected');
//	}
}
