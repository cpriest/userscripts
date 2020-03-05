import './style/default.css';
import {UserInterfaceMgr} from './UserInterfaceMgr';

let UI;

function init() {
	UI = new UserInterfaceMgr();
}

if(document.readyState === 'loading') {
	window.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

//if(module.hot) {
//	module.hot.accept();
//}
