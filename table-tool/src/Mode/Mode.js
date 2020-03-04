'use strict';

export class ModeBase {
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
