import { Component, OnInit } from '@angular/core';
import { PermissionsService, Permission, PermissionsType } from '../../shared/security/permissions.service';
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
		originalObj?: Object,
		session?: Permission,
		chat?: Permission,
		whiteboard?: Permission[]
	} = {};

	temp: any;
	permsTypes: Array<string> = ['session', 'chat', 'whiteboard']
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
				whiteboard$: Observable.combineLatest(session.whiteboards.map(id => this.permissionsService.getPermission(id.$key, 'whiteboard')))
			});
		})
		.subscribe(perms => {
			this.perms = new Proxy(perms, {
				get: (target, prop) => {
					if (prop === 'originalObj') {
						return target;
					}
					if (Array.isArray(target[prop])) {
						return false;
					}
					return target[prop];
				}
			});
		}, console.log);
	}

	togglePerm(uid: string) {
		this.dropdownList[uid] = !this.dropdownList[uid];
	}

	savePerms() {
		let queryList: Observable<any>[] = [];
		for (let type in this.perms.originalObj) {
			if (type in this.perms.originalObj) {
				if (Array.isArray(this.perms.originalObj[type])) {
					this.perms.originalObj[type].forEach(perm => {
						queryList.push(this.permissionsService.updatePermission(
							perm.$key,
							<PermissionsType> type,
							perm)
						);
					});
				} else {
					queryList.push(this.permissionsService.updatePermission(
						this.perms.originalObj[type].$key,
						<PermissionsType> type,
						this.perms.originalObj[type])
					);
				}
			}
		}

		Observable.combineLatest(queryList).subscribe(val => {
			console.log('permission updated');
		}, console.log);
	}

}
