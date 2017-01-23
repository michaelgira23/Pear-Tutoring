import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../shared/model/session.service';
import { UserService } from '../shared/model/user.service';
import { User } from '../shared/model/user';
import { Session, SessionRating } from '../shared/model/session';

@Component({
	selector: 'app-user-details',
	templateUrl: './user-details.component.html',
	styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit {

	uid: string;
	userInfo: User;

	tutorSessions: Session[];
	tuteeSessions: Session[];

	get userRatings(): SessionRating[] {
		let allRatings: SessionRating[] = this.tutorSessions.map(session => {
			return session.rating.map(rating => {
				return Object.assign(rating, {session});
			});
		})
		.reduce((a, b) => {
			return a.concat(b);
		}, []);
		return allRatings.sort((a, b) => {
			return a.time.unix() - b.time.unix();
		});
	}

	get userAverageRating(): number {
		return this.userRatings
			.map(rating => {
				return rating.rating;
			})
			.reduce((a, b) => {
				return a + b;
			}, 0) / this.userRatings.length;
	}

	constructor(private sessionService: SessionService, private userService: UserService, private route: ActivatedRoute) { }

	ngOnInit() {
		this.uid = this.route.snapshot.params['uid'];
		this.sessionService.findUserSessions(this.uid)
		.subscribe(
			sessions => {
				this.tutorSessions = sessions[0];
				this.tuteeSessions = sessions[1]
			}
		);
		this.userService.findUser(this.uid).subscribe(
			user => {
				this.userInfo = user;
			}
		);
	}

}
