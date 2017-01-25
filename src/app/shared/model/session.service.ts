import { Injectable, Inject } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { AngularFireDatabase, FirebaseRef } from 'angularfire2';
import * as firebase from 'firebase';
import { Session } from './session';
import { User } from './user';
import { UserService, UserStatus, FreeTimes } from './user.service';
import { ChatService } from './chat.service';
import { AuthService } from '../security/auth.service';
import { WhiteboardService, defaultWhiteboardOptions } from './whiteboard.service';
import { PermissionsService, Permission } from '../security/permissions.service';
import * as moment from 'moment';
import { objToArr, arrToObj, arraysEqual, getEditDistance } from '../common/utils';

export const AllowedSubjects = [
	'English',
	'History',
	'Math',
	'Science',
	'World-Language',
	'other'
];

export const PAGE_SIZE = 10;

@Injectable()
export class SessionService {
	sdkDb: any;
	uid: string;
	currentUser: User;
	connectedRef: any;

	constructor(private db: AngularFireDatabase, @Inject(FirebaseRef) private fb,
				private authService: AuthService,
				private chatService: ChatService,
				private permissionsService: PermissionsService,
				private userService: UserService,
				private whiteboardService: WhiteboardService) {
		this.sdkDb = fb.database().ref();
		this.connectedRef = fb.database().ref('.info/connected');
		this.authService.auth$.subscribe(val => {
			this.uid = val ? val.uid : null;
		});
		this.userService.user$.subscribe(user => this.currentUser = user);
	}

	private promiseToObservable(promise): Observable<any> {

		const subject = new Subject<any>();

		promise
			.then(res => {
					subject.next(res);
					subject.complete();
				},
				err => {
					subject.error(err);
					subject.complete();
				});

		return subject.asObservable();
	}

	firebaseUpdate(dataToSave): Observable<any> {
		return this.promiseToObservable(this.sdkDb.update(dataToSave));
	}

	checkAndCombine(arr: Observable<any>[]): Observable<any[]> {
		if (arr.length > 0) {
			return Observable.combineLatest(arr);
		}
		return Observable.of([]);
	}

	permForUsers(tutees: string[], tutor: string): Permission {
		let usersPerm = {};
		tutees.forEach(val => {
			usersPerm[val] = {
				read: true,
				write: true
			};
		});
		usersPerm[tutor] = {
			read: true,
			write: true,
			moderator: true
		};
		return {
			anonymous: {
				scopes: {
					read: false,
					write: false
				}
			},
			loggedIn: {
				scopes: {
					read: false,
					write: false
				}
			},
			user: usersPerm
		};
	}

	// Take a firebase query for a single session and insert a user object into the tutor and tutee fields.
	// Wrap this function around a firebase query to a session i can get the session object with the users
	combineWithUser(sessionQuery: Observable<any>): Observable<Session> {
		let sessionWithUser;
		// First query the tutor
		return sessionQuery.flatMap(val => {
			sessionWithUser = val;
			if (typeof val.tutor !== 'string') {
				return this.userService.findUser(val.tutor.$key);
			}
			return this.userService.findUser(val.tutor);
		}).map(val => {
			sessionWithUser.tutor = val;
			return sessionWithUser;
		})
		// Then query the tutees, note the session is stored temporarily in sessionsWithUser, and used later to combine with the users info.
		.flatMap(val => {
			sessionWithUser = val;
			return this.checkAndCombine(objToArr(val.tutees).map(tutee => {
				if (typeof tutee !== 'string') {
					return this.userService.findUser(tutee.$key);
				}
				return this.userService.findUser(tutee);
			}));
		}).map(val => {
			sessionWithUser.tutees = val;
			return sessionWithUser;
		});
	}

	// Take a firebase query for an array of sessions and insert a user object into the tutor and tutee fields.
	combineArrWithUser(sessionQuery: Observable<any[]>): Observable<Session[]> {
		let sessionsWithUser: any[] = [];
		// First fill in the tutor field of each session
		return sessionQuery.flatMap((val: any[]) => {
			sessionsWithUser = val;
			return this.checkAndCombine(
				val.map((session) => {
					if (typeof session.tutor !== 'string') {
						return this.userService.findUser(session.tutor.$key);
					}
					return this.userService.findUser(session.tutor);
				})
			);
		})
		.map((val: any[]) => {
			sessionsWithUser.map((session, index) => session.tutor = val[index]);
			return sessionsWithUser;
		})
		// Then fill in the tutees array of each session, note sessions are stored temporarily in the sessionsWithUser variable
		// an empty tutees array in the session will cause a silent error
		.flatMap((val: any[]) => {
			sessionsWithUser = val;
			return this.checkAndCombine(
				val.map((session) => this.checkAndCombine(
					objToArr(session.tutees).map(tutee => {
						if (typeof tutee !== 'string') {
							return this.userService.findUser(tutee.$key);
						}
						return this.userService.findUser(tutee);
					})
				))
			);
		}).map((val: any[][]) => {
			sessionsWithUser.forEach((session, sessionIndex) => {
				sessionsWithUser[sessionIndex].tutees = objToArr(session.tutees).map((tutee, tuteeIndex) => val[sessionIndex][tuteeIndex]);
			});
			return sessionsWithUser;
		});
	}

	combineWithWb(sessionQuery: Observable<any>): Observable<Session[]> {
		let sessionWithWb;
		return sessionQuery.switchMap(val => {
			sessionWithWb = val;
			return this.db.list('whiteboardsBySessions/' + val.$key);
		})
		// returns a list of whiteboard key that belongs to the session
		.switchMap(wbKeys => {
			return this.checkAndCombine(wbKeys.map(wbKey => {
				return this.db.object('whiteboards/' + wbKey.$key);
			}));
		})
		// returns a list of actual whiteboard objects
		.map(val => {
			sessionWithWb.whiteboards = val;
			return sessionWithWb;
		});
	}

	combineArrWithWb(sessionQuery: Observable<any[]>): Observable<Session[]> {
		let sessionsWithWb: any[];
		// Fill in the whiteboard field of each session with the whiteboard info
		return sessionQuery.flatMap((val: any[]) => {
			sessionsWithWb = val;
			return this.checkAndCombine(
				val.map((session) => this.db.list('whiteboardsBySessions/' + session.$key))
			);
		})
		// this step returns an array of array of whiteboard keys for each session in the list
		.flatMap(val => {
			return this.checkAndCombine(val.map(wbKeys => {
				return this.checkAndCombine(wbKeys.map(key => {
					return this.db.object('whiteboards/' + key.$key);
				}));
			}));
		})
		// this step returns the previous two dimentional array but with a whiteboard object replacing each key
		.map((val: any[][]) => {
			sessionsWithWb.forEach((session, sessionIndex) => {
				sessionsWithWb[sessionIndex].whiteboards = val[sessionIndex];
			});
			return sessionsWithWb;
		});
	}

	combineWithRatings(sessionQuery: Observable<any>): Observable<any> {
		let sessionsWithRatings = {};
		let tempRatings = [];
		return sessionQuery.flatMap(session => {
			sessionsWithRatings = session;
			return this.db.list(`ratingsBySessions/${session.$key}`, {
				query: {
					orderByChild: 'time'
				}
			});
		})
		.flatMap(ratings => {
			tempRatings = ratings;
			return this.checkAndCombine(ratings.map(rating => this.userService.findUser(rating.$key)));
		})
		.map(users => {
			let finalRatings = [];
			users.forEach(user => {
				let tempRating = tempRatings.find(rating => rating.$key === user.$key);
				delete tempRating.exists;
				finalRatings.push(Object.assign({ user }, tempRating));
			});
			sessionsWithRatings['rating'] = finalRatings;
			return sessionsWithRatings;
		});
	}

	// find a single session and combine it with user data
	findSession(id: string): Observable<Session> {
		return this.combineWithRatings(
			this.combineWithUser(
				this.combineWithWb(
					this.db.object('sessions/' + id)
					.flatMap(val => val.$exists() ? Observable.of(val) : Observable.throw(`Session ${val.$key} does not exist`))
				)
			)
		).map(Session.fromJson);
	}

	// Find the session ids where the user is a tutor or a tutee. Note the info in stored in the user object.
	findMySessions(lastKey?: string | Subject<string>): Observable<Session[][]> {
		return Observable.combineLatest(
			this.authService.auth$.flatMap(state => {
				if (!state) {
					return [];
				}
				return this.combineArrWithUser(this.combineArrWithWb(this.db.list(`/users/${state.uid}/tutorSessions`, {query: {
					orderByKey: true,
					startAt: lastKey,
					limitToFirst: PAGE_SIZE
				}})
				.flatMap(ids => this.checkAndCombine(ids.map(id => this.db.object('sessions/' + id.$key))))));
			}).map(Session.fromJsonArray),
			this.authService.auth$.flatMap(state => {
				if (!state) {
					return [];
				}
				return this.combineArrWithUser(this.combineArrWithWb(this.db.list(`/users/${state.uid}/tuteeSessions`, {query: {
					orderByKey: true,
					startAt: lastKey,
					limitToFirst: PAGE_SIZE
				}})
				.flatMap(ids => this.checkAndCombine(ids.map(id => this.db.object('sessions/' + id.$key))))));
			}).map(Session.fromJsonArray)
		);
	};

	findUserSessions(uid: string): Observable<Session[][]> {
		return Observable.combineLatest(
			this.combineArrWithUser(this.combineArrWithWb(this.db.list(`/users/${uid}/tutorSessions`)
			.flatMap(ids => this.checkAndCombine(ids.map(id => this.db.object('sessions/' + id.$key))))))
			.flatMap(sessions => {
				return this.checkAndCombine(sessions.map(session => {
					return this.combineWithRatings(Observable.of(session));
				}));
			})
			.map(Session.fromJsonArray),
			this.combineArrWithUser(this.combineArrWithWb(this.db.list(`/users/${uid}/tuteeSessions`)
			.flatMap(ids => this.checkAndCombine(ids.map(id => this.db.object('sessions/' + id.$key))))))
			.flatMap(sessions => {
				return this.checkAndCombine(sessions.map(session => {
					return this.combineWithRatings(Observable.of(session));
				}));
			})
			.map(Session.fromJsonArray)
		);
	}

	// Returns all sessions. Sorry Jack.
	findAllSessions(): Observable<Session[]> {
		return this.combineArrWithUser(
			this.combineArrWithWb(
				this.db.list('sessions')
			)
		).map(Session.fromJsonArray);
	}

	// Find all of the sessions where the listed field is true.
	findPublicSessions(lastKey?: string | Subject<string>): Observable<Session[]> {
		return this.db.list('listedSessions', {
				query: {
					orderByKey: true,
					startAt: lastKey,
					limitToFirst: PAGE_SIZE
				}
			})
			.flatMap(ids => {
			return this.checkAndCombine(ids.map(id => this.findSession(id.$key)));
			})
			.map(Session.fromJsonArray);
	}

	// this function is not scalable when there are a lot of sessions because it queries sessions under single tags and compare them locally
	// Find session by tags, support multiple tags
	findSessionsByTags(tags: string[], page: number): Observable<Session[]> {
		return Observable.of(tags.map(tag => this.db.list('sessionsByTags/' + tag)))
			.flatMap(tags$arr => this.checkAndCombine(tags$arr))
			.map(sessionsByTag => {sessionsByTag = sessionsByTag.reduce((a, b) => a.concat(b));
				return sessionsByTag.map(session => this.findSession(session.$key)); })
			.flatMap(session$arr => this.checkAndCombine(session$arr))
			.map(Session.fromJsonArray)
			.map(sessions => {
				return sessions
					// get rid of duplicates
					.filter((session, index, arr) => {
						let newArr = arr.splice(arr.indexOf(session), 1);
						return newArr.includes(session);
					})
					// Only return sessions whose tags fully match the query
					.filter((session, index) => {
						return arraysEqual(session.tags, tags) && index <= (page + 1) * PAGE_SIZE;
					});
			});
	}

	// Supported proprties are tags, class, subject, grade
	findSessionsByProperty(prop: string, searchStr: string, lastKey?: string | Subject<string>): Observable<Session[]> | any {
		if (Session.prototype[prop] === undefined) {
			return Observable.throw('property is not defined in session');
		}
		let fbNode = 'sessionsBy' + prop[0].toUpperCase() + prop.slice(1, prop.length) + '/';
		return this.combineArrWithUser(
			this.combineArrWithWb(
				this.db.list(fbNode + searchStr, {query: {
					orderByKey: true,
					startAt: lastKey,
					limitToFirst: PAGE_SIZE
				}})
				// List of session ids --> list of session objects without user inserted
				.flatMap(ids => this.checkAndCombine(ids.map(id => {
					return this.db.object('sessions/' + id.$key);
				})))
			)
		).map(Session.fromJsonArray);
	}

	findSessionsByString(str: string): Observable<Session[]> {
		let scopes = ['classStr', 'title', 'subject'];
		return this.findAllSessions().map(sessions => {
			return sessions.filter(session => {
				return scopes.some(scope => {
					if (session[scope]) {
						return getEditDistance(session[scope], str) < 2;
					}
					return false;
				});
			});
		});

	}

	// Find sessions that fits the free times of the user.
	findSessionsByFreeTime(timesInDay: FreeTimes, lastKey?: string | Subject<string>): Observable<Session[][]> {
		let queryList: Observable<any>[] = [];
		let secFromMdn = function(m: moment.Moment): number {
			return m.startOf('day').diff(m);
		};
		for (let day in timesInDay) {
			if (timesInDay[day] !== undefined) {
				// this gets the day in week from the free times, and try to find a match in the same day in week next week
				let dayInNextWeek = moment().day(day);
				queryList.push(this.findSessionsByProperty('ywd', dayInNextWeek.format('YYYY-WW-E'), lastKey).map(sessions => {
					let sessionsList: Session[] = [];
					sessions.forEach(session => {
						if (session.grade === this.currentUser.grade) {
							timesInDay[day].forEach(time => {
								if (secFromMdn(moment(session.start, 'X')) <= secFromMdn(time.from)
									&& secFromMdn(moment(session.end, 'X')) >= secFromMdn(time.to)) {
									sessionsList.push(session);
								}
							});
						}
					});
					return sessionsList;
				}).map(Session.fromJsonArray));
			}
		}
		return this.checkAndCombine(queryList);
	}

	// Update the information of a session
	updateSession(sessionId: string, session: SessionOptions): Observable<any> {
		if (!this.uid) { return Observable.throw('Rip no login info'); };

		let sessionToSave: any = Object.assign({}, session);
		delete sessionToSave.whiteboard;

		let uidsToSave = {};
		session.tutees.forEach(uid => {
			if (uid !== this.uid) {
				uidsToSave[uid] = false;
			}
		});

		let dataToSave = {};
		let ywd = session.start.format('YYYY-WW-E');
		dataToSave['usersInSession/' + sessionId] = uidsToSave;
		dataToSave[`users/${this.uid}/tutorSessions/${sessionId}`] = true;
		session.tutees.forEach(uid => dataToSave[`users/${uid}/tuteeSessions/${sessionId}`] = true);
		if (session.whiteboard) {
			dataToSave[`whiteboardsBySessions/${sessionId}/${session.whiteboard}`] = true;
		}
		// below are only for the public sessions, because we want the private sessions to be unsearchable in the catalogs
		if (session.listed) {
			dataToSave[`listedSessions/${sessionId}`] = true;
			if (session.tags) {
				session.tags.forEach(tag => dataToSave[`sessionsByTags/${tag}/${sessionId}`] = true);
			}
			if (AllowedSubjects.find((val) => session.subject === val)) {
				dataToSave[`sessionsBySubject/${session.subject}/${sessionId}`] = true;
			}
			if (session.grade > 0 && session.grade <= 12) {
				dataToSave[`sessionsByGrade/${session.grade}/${sessionId}`] = true;
			}
			dataToSave[`sessionsByClassStr/${session.classStr}/${sessionId}`] = true;
			dataToSave[`sessionsByYwd/${ywd}/${sessionId}`] = true;
		}
		// Transform the arrays in the object to firebase-friendly objects
		sessionToSave.start = session.start.unix();
		sessionToSave.end = session.end.unix();
		sessionToSave.tutees = arrToObj(sessionToSave.tutees);
		sessionToSave.tags = arrToObj(sessionToSave.tags);
		// store the date of the session in year - week in year - day in week
		sessionToSave['ywd'] = ywd;
		dataToSave['sessions/' + sessionId] = sessionToSave;

		return this.firebaseUpdate(dataToSave)
			.flatMap(val => {
				return this.permissionsService.createPermission(sessionId, 'session', this.permForUsers(session.tutees, session.tutor));
			});
	}

	// Use the update function to create a session, and create a starting whiteboard and chat
	createSession(session: SessionOptions): Observable<any> {
		let wbId;
		let chatId;
		return this.whiteboardService.createWhiteboard(defaultWhiteboardOptions)
		.flatMap(wb => {
			wbId = wb.key;
			return this.chatService.createChat();
		})
		.flatMap(chat => {
			chatId = chat.getKey();
			const newSessionKey = this.sdkDb.child('sessions').push().key;
			session.whiteboard = wbId;
			session.chat = chatId;
			session.canceled = false;
			return this.updateSession(newSessionKey, session);
		})
		.flatMap(val => {
			return Observable.forkJoin(
				this.permissionsService.createPermission(wbId, 'whiteboard', this.permForUsers(session.tutees, session.tutor)),
				this.permissionsService.createPermission(chatId, 'chat', this.permForUsers(session.tutees, session.tutor))
			);
		});
	}

	// WIP:  create an anonymous session, for quick access and sharing of the whiteboard.
	createAnonSession(): Observable<any> {
		return Observable.from(undefined);
	}

	toggleListed(id: string): Observable<any> {
		return Observable.from(undefined);
	}

	// Delete a session.
	deleteSession(sessionId: string): Observable<any> {
		// calling update null on a location in the database will cause it to be deleted.
		if (!this.uid) { return Observable.throw('Rip no login info'); };
		return this.findSession(sessionId).take(1).flatMap((session: Session) => {
			let dataToSave = {};
			let ywd = session.start.format('YYYY-WW-E');
			dataToSave['usersInSession/' + sessionId] = null;
			dataToSave[`users/${this.uid}/tutorSessions/${sessionId}`] = null;
			session.tutees.forEach(user => dataToSave[`users/${user.$key}/tuteeSessions/${sessionId}`] = null);
			dataToSave[`whiteboardsBySessions/${sessionId}`] = null;
			// below are only for the public sessions, because we want the private sessions to be unsearchable in the catalogs
			if (session.listed) {
				dataToSave[`listedSessions/${sessionId}`] = null;
				session.tags.forEach(tag => dataToSave[`sessionsByTags/${tag}/${sessionId}`] = null);
				if (AllowedSubjects.find((val) => session.subject === val)) {
					dataToSave[`sessionsBySubject/${session.subject}/${sessionId}`] = null;
				}
				if (session.grade > 0 && session.grade <= 12) {
					dataToSave[`sessionsByGrade/${session.grade}/${sessionId}`] = null;
				}
				dataToSave[`sessionsByClassStr/${session.classStr}/${sessionId}}`] = null;
				dataToSave[`sessionsByYwd/${ywd}/${sessionId}`] = null;
			}

			// dataToSave['sessions/' + sessionId] = null;

			return this.firebaseUpdate(dataToSave);
				// .switchMap(val => {
				// 	return Observable.combineLatest([
				// 		this.permissionsService.deletePermission(sessionId, 'session'),
				// 		this.permissionsService.deletePermission(session.chat, 'chat'),
				// 		Observable.combineLatest(session.whiteboards.map(wb => this.permissionsService.deletePermission(wb.$key, 'whiteboard')))
				// 	])
				// });
		});
	}

	// Adds the user to the pool of online users in a session, and change the user's status to "inSession"
	joinSession(sessionId: string): Observable<any> {
		if (!this.uid) { return Observable.throw('Rip no login info'); }

		return this.findSession(sessionId).take(1)
		.flatMap((session: Session) => {
			// in case the user closes the tab
			this.sdkDb.child(`/usersInSession/${sessionId}/${this.uid}`).onDisconnect().set(false);
			this.connectedRef.on('value', (snap) => {
				if (snap.val() === false) {
					// if its passed session's ending time, take away the write permissions
					if (session.end.isSameOrBefore(moment())) {
						this.db.object(`chatPermission/${session.chat}/user/${this.uid}`).set({read: true, write: false});
						this.db.object(`sessionPermission/${sessionId}/user/${this.uid}`).set({read: true, write: false});
						session.whiteboards.forEach(wb => {
							this.db.object(`whiteboardPermission/${wb.$key}/user/${this.uid}`).set({read: true, write: false});
						});
					}
				}
			});

			let dataToSave = {};
			dataToSave[`/usersInSession/${sessionId}/${this.uid}`] = true;
			this.userService.changeStatus(UserStatus.IN_SESSION);
			return this.firebaseUpdate(dataToSave);
		});
	}

	// remove the user from the pool of online users for the session, and change his status to "online"
	leaveSession(sessionId: string): Observable<any> {
		let dataToSave = {};
		dataToSave[`/usersInSession/${sessionId}/${this.uid}`] = false;
		this.userService.changeStatus(UserStatus.ONLINE);
		return this.firebaseUpdate(dataToSave);
	}

	// get only the uids of users from the pool of online users for a session
	getOnlineUsers(sessionId): Observable<any[]> {
		return this.db.list('usersInSession/' + sessionId);
	}

	addWb(sessionId: string): Observable<any> {
		return this.findSession(sessionId).take(1)
			.flatMap(session => {
				return this.whiteboardService.createWhiteboard(defaultWhiteboardOptions).flatMap(wb => {
					let pushVal = {};
					pushVal[wb.key] = true;
					return this.promiseToObservable(this.db.list('whiteboardsBySessions/').update(sessionId, pushVal))
						.flatMap(val => {
							return this.permissionsService.createPermission(
								wb.key,
								'whiteboard',
								this.permForUsers(session.tutees.map(user => user.$key), session.tutor.$key)
							);
						});
				});
			});
	}

	deleteWb(sessionId: string, wbKey: string): Observable<any> {
		return this.promiseToObservable(this.db.list('whiteboardsBySessions/' + sessionId).remove(wbKey))
			.flatMap(val => {
				return this.promiseToObservable(this.db.list('whiteboards').remove(wbKey));
			})
			.switchMap(val => {
				return this.permissionsService.deletePermission(wbKey, 'whiteboard');
			});
	}

	addTutees(sessionId: string, tuteeId: string) {
		return this.findSession(sessionId).take(1)
			.flatMap((session: Session) => {
				let dataToSave = {};
				// stop the tutor from adding himself
				if (session.tutor.$key !== tuteeId) {
					if (session.tutees.length < session.max) {
						if (session.pending.some(user => user === tuteeId)) {
							dataToSave[`sessions/${sessionId}/pending/${tuteeId}`] = null;
							dataToSave[`sessions/${sessionId}/tutees/${tuteeId}`] = true;
							dataToSave[`users/${tuteeId}/tuteeSessions/${sessionId}`] = true;
							dataToSave[`usersInSession/${sessionId}/${tuteeId}`] = false;
							return this.firebaseUpdate(dataToSave)
							// give permission to all components for the user
							.switchMap(val => {
								return Observable.combineLatest([
									this.permissionsService.addScope(sessionId, 'session', { read: true, write: true }, 'user', tuteeId),
									this.permissionsService.addScope(session.chat, 'chat', { read: true, write: true }, 'user', tuteeId),
									Observable.combineLatest(session.whiteboards.map(wb => {
										return this.permissionsService.addScope(wb.$key, 'whiteboard', { read: true, write: true }, 'user', tuteeId);
									}))
								]);
							});
						}
						dataToSave[`sessions/${sessionId}/pending/${tuteeId}`] = firebase.database.ServerValue.TIMESTAMP;
						return this.firebaseUpdate(dataToSave);
					}
					return Observable.throw('session is already full');
				}
				return Observable.throw('you cannot add the tutor as a tutee');
			});
	}

	denyPending(sessionId: string, pendingId: string) {
		return this.findSession(sessionId)
			.take(1)
			.flatMap((session: Session) => {
				// If current user is not tutor, we do not have permission
				if (session.tutor.$key !== this.currentUser.$key) {
					return Observable.throw('You are the tutor of this session and cannot deny this user\'s enrollment!');
				}
				return this.promiseToObservable(this.db.object(`sessions/${sessionId}/pending/${pendingId}`).remove());
			});
	}

	removeTutees(sessionId: string, tuteeId: string) {
		let dataToSave = {};
		dataToSave[`sessions/${sessionId}/pending/${tuteeId}`] = null;
		dataToSave[`sessions/${sessionId}/tutees/${tuteeId}`] = null;
		dataToSave[`users/${tuteeId}/tuteeSessions/${sessionId}`] = null;
		dataToSave[`usersInSession/${sessionId}/${tuteeId}`] = null;
		return this.firebaseUpdate(dataToSave);
	}

	getPendingTutees(sessionId: string): Observable<any[]> {
		return this.findSession(sessionId)
			.flatMap((session: Session) => {
				return this.checkAndCombine(session.pending.map(uid => {
					return this.userService.findUser(uid);
				}));
			});
	}

	changeRating(sessionId: string, uid: string, rating: any): Observable<any> {
		return this.findSession(sessionId).take(1).flatMap(session => {
			if (!session.tutees.find(tutee => tutee.$key === this.uid)) { return Observable.throw('You are not participating in the session!'); }
			return this.promiseToObservable(this.db.object(`ratingsBySessions/${sessionId}/${uid}`)
			.set(Object.assign(rating, {time: firebase.database.ServerValue.TIMESTAMP})));
		});
	}
}

export interface SessionOptions {
	start: moment.Moment;
	end: moment.Moment;
	tutor: string;
	grade: number;
	classStr: string;
	subject: string;
	max: number;
	listed: boolean;
	title: string;
	desc: string;
	tutees: string[];
	tags: string[];
	// this is the initial whiteboard that gets created when a session is created
	whiteboard?: string;
	chat?: string;
	canceled: boolean;
}
