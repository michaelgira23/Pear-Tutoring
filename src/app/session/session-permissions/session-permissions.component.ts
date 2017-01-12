import { Component, OnInit } from '@angular/core';
import { PermissionsService, Permission } from '../../shared/security/permissions.service';
import { SessionService } from '../../shared/model/session.service';
import { Session } from '../../shared/model/session';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { combineLatestObj, objToArr } from '../../shared/common/utils';

@Component({
	selector: 'app-session-permissions',
	templateUrl: './session-permissions.component.html',
	styleUrls: ['./session-permissions.component.scss']
})
export class SessionPermissionsComponent implements OnInit {
	perms: {
		// a reference to the original self when used in a proxy
		originalObj: Object;
		session: Permission,
		chat: Permission,
		whiteboards: Permission[]
	};
	temp: any;
	get permsTypes(): Array<string> {
		return objToArr(this.perms);
	}
	sessionInfo: Session;

	dropdownList: Object = {};

	constructor(private permissionsService: PermissionsService, private route: ActivatedRoute, private sessions: SessionService) { }

	ngOnInit() {
		this.route.params.flatMap(params => {
			if (params['id']) {
				return this.sessions.findSession(params['id']);
			}
			return Observable.throw('cannot find session id');
		})
		.flatMap((session: Session) => {
			this.sessionInfo = session;
			return combineLatestObj({
				session$: this.permissionsService.getPermission(session.$key, 'session'),
				chat$: this.permissionsService.getPermission(session.chat, 'chat'),
				whiteboards$: Observable.combineLatest(session.whiteboards.map(id => this.permissionsService.getPermission(id.$key, 'whiteboard')))
			});
		})
		.subscribe(perms => {
			let originalObj = Object.assign({}, perms);
			this.perms = new Proxy(perms, {
				get: (target, prop) => {
					if (Array.isArray(target[prop])) {
						let tempObj: Permission = Object.assign(target[prop][0]);
						target[prop].forEach((perm: Permission) => {
							for (let uid in perm.user) {
								if (uid in perm.user) {
									for (let scope in perm.user[uid]) {
										if (scope in perm.user[uid]) {
											tempObj.user[uid][scope] = perm.user[uid][scope] || tempObj.user[uid][scope];
										}
									}
								}
							}
						})
						return tempObj;
					}
					return target[prop];
				}
			});
			this.perms.originalObj = originalObj;
			console.log(this.perms.originalObj)
		}, console.log);
	}

	togglePerm(uid: string) {
		this.dropdownList[uid] = !this.dropdownList[uid];
	}

}
