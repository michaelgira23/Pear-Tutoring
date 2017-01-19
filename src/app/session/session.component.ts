import { Component, OnInit, OnDestroy, ViewChildren, ViewChild, QueryList } from '@angular/core';
import { Subject, Observable } from 'rxjs/Rx';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../shared/model/session.service';
import { Session } from '../shared/model/session';
import { User } from '../shared/model/user';
import { UserService } from '../shared/model/user.service';
import { PermissionsService, Permission } from '../shared/security/permissions.service';
import { Whiteboard } from '../shared/model/whiteboard';
import { SidebarComponent } from '../shared/common/sidebar/sidebar.component';
import { SessionRatingModalComponent } from './session-rating/session-rating.component';
import { SessionPopup } from './session-popup';

@Component({
	selector: 'app-session',
	templateUrl: './session.component.html',
	styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit, OnDestroy {

	sessionId: string;
	sessionExist: boolean;
	sessionInfo: Session;
	onlineUsers: User[] = [];
	findSession$;
	perm: Permission;

	selectedWbIndex: number = 0;
	get selectedWb(): Whiteboard {
		return this.sessionInfo.whiteboards[this.selectedWbIndex];
	};

	// indicator for if the user has rated the session
	get rated(): boolean {
		return this.sessionInfo.rating ? !!this.sessionInfo.rating[this.sessionService.uid] : false;
	};

	@ViewChildren(SidebarComponent) sidebars: QueryList<SidebarComponent>;

	@ViewChild(SessionRatingModalComponent) ratingPopup: SessionRatingModalComponent;

	popup: string;

	constructor(
		private route: ActivatedRoute,
		private sessionService: SessionService,
		private userService: UserService,
		private permissionsService: PermissionsService,
		private router: Router
	) { }

	ngOnInit() {
		this.route.params.subscribe(params => {
			this.sessionId = params['id'];
			this.findSession$ = this.sessionService.findSession(this.sessionId).subscribe(session => {
				this.sessionExist = true;
				this.sessionInfo = session;
				this.permissionsService.getUserPermission(this.sessionId, 'session').subscribe(perm => {
					this.perm = perm;
					if (!perm.read) {
						console.log('You have been banned from the session');
						this.router.navigate(['my-sessions']);
					}
				}, console.log);
				this.sessionService.joinSession(this.sessionId).subscribe(data => {}, console.error,
				() => {
					this.sessionService.getOnlineUsers(this.sessionId).subscribe(userIds => {
						let allUsers = this.sessionInfo.tutees.concat(this.sessionInfo.tutor);
						// The online state is [uid]:boolean. i wanted to preserve the boolean that 
						// represented the online state so i didn't convert the uid into a user object
						let onlineUsers = [];
						userIds.forEach(userOnlineState => {
							if (userOnlineState.$value) {
								onlineUsers.push(allUsers.find(user => user.$key === userOnlineState.$key));
							}
						});
						this.onlineUsers = onlineUsers;
					}, console.error);
				});
			},
			err => {
				console.error(err);
				this.sessionExist = false;
			});
		}, console.error);
	}

	ngOnDestroy() {
		this.findSession$.unsubscribe();
		this.sessionService.leaveSession(this.sessionInfo.$key);
	}

	addWb() {
		this.sessionService.addWb(this.sessionId).subscribe(val => {
			if (this.selectedWbIndex > 0) {
				this.selectedWbIndex = this.sessionInfo.whiteboards.length - 1;
			}
			console.log('added Whiteboard');
		}, console.log);
	}

	deleteWb() {
		if (this.selectedWb || this.sessionInfo.whiteboards.length > 1) {
			this.sessionService.deleteWb(this.sessionId, this.selectedWb.$key).subscribe(val => {
				if (this.selectedWbIndex > 0) {
					this.selectedWbIndex -= 1;
				}
				console.log('deleted whiteboard');
			}, console.log);
		}
	}

	addTutee(user: User) {
		if (user.$key !== this.sessionInfo.tutor.$key) {
			this.sessionService.addTutees(this.sessionId, user.$key).subscribe(val => {
				console.log('request pending');
			}, err => {
				console.log(err);
				let tutees = Object.assign([], this.sessionInfo.tutees); this.sessionInfo.tutees = tutees;
			});
		}
	}

	removeTutee(user: User) {
		this.sessionService.removeTutees(this.sessionId, user.$key).subscribe(val => {
			console.log('removed tutee');
		}, console.log);
	}

	onSelectWb(index: number) {
		this.selectedWbIndex = index;
		this.sidebars.toArray()[2].close();
	}

	openPopup(type: string): Observable<SessionPopup> {
		this.popup = type;
		let popupRef$ = new Subject<SessionPopup>();
		setTimeout(() => {popupRef$.next(this[type + 'Popup']); }, 0);
		return popupRef$.asObservable();
	}

	closePopup(): void {
		this.popup = '';
	}
}
