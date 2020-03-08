'use strict';

export class ModeBase {
	/**
	 * Alias to UI.prefs
	 * @return {Observable}
	 */
	get prefs() { return this.UI.prefs; }

	/**
	 * Alias to UI.tableConfig
	 * @return {TableConfig}
	 */
	get tableConfig() { return this.UI.tableConfig; }

	/**
	 * Base constructor for Modes
	 * @param {UserInterfaceMgr} UI
	 */
	constructor(UI) {
		this.UI = UI;
	}
	/** Called when this mode is activated */
	OnActivated() {}

	/** Called when this mode is deactivated */
	OnDeactivated() {}
}
