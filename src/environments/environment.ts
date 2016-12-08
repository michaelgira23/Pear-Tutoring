// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

import { AuthMethods, AuthProviders } from 'angularfire2';

export const environment = {
	production: false
};

export const firebaseConfig = {
	apiKey: 'AIzaSyC_ML_ErPL4LSHdTdCsGuQLDfZWEvMgUTY',
	authDomain: 'wwt-hackathon-2016.firebaseapp.com',
	databaseURL: 'https://wwt-hackathon-2016.firebaseio.com',
	storageBucket: 'wwt-hackathon-2016.appspot.com',
	messagingSenderId: '898545854276'
};

export const authConfig = {
	provider: AuthProviders.Password,
	method: AuthMethods.Password
};
