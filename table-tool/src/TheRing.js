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

//		this.zBandScale = 1.0;

//		hotkeys('s', 'active', (e, h) => {
//			console.log('s in active,select mode');
//			hotkeys.setScope('select');
//		})
//
//		hotkeys('h', 'select', (e, h) => {
//			console.log('h in select mode');
////			this.colorizeSelector(this.tableConfig.DataSelector);
//			return false;
//		});



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

}
