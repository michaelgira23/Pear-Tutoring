import { AuthMethods, AuthProviders } from 'angularfire2';

export const environment = {
	production: true
};

export const firebaseConfig = {
	apiKey: 'AIzaSyC_ML_ErPL4LSHdTdCsGuQLDfZWEvMgUTY',
	authDomain: 'wwt-hackathon-2016.firebaseapp.com',
	databaseURL: 'https://wwt-hackathon-2016.firebaseio.com',
	storageBucket: 'wwt-hackathon-2016.appspot.com',
	messagingSenderId: '898545854276'
}

export const authConfig = {
	provider: AuthProviders.Password,
	method: AuthMethods.Password
};
