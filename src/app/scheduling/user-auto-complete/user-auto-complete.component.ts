import { Component, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs/Rx';
import { UserService } from '../../shared/model/user.service';
import { User } from '../../shared/model/user';

@Component({
  selector: 'app-user-auto-complete',
  templateUrl: './user-auto-complete.component.html',
  styleUrls: ['./user-auto-complete.component.scss'],
	providers: [{
		provide: NG_VALUE_ACCESSOR,
		useExisting: forwardRef(() => UserAutoCompleteComponent),
		multi: true
	}]
})
export class UserAutoCompleteComponent implements OnInit, ControlValueAccessor {

	private selectedUsers: User[] = [];
	set userValue(users: User[]) {
		if (this.selectedUsers.length !== users.length) {
			this.selectedUsers = users;
			this.onChangeCallback(users);
		}
	};
	get userValue(): User[] {
		return this.selectedUsers;
	}
	userResults: User[] = [];
	searchStr: string = '';
	onSearchStr$ = new Subject<string>();

	onChangeCallback: any;

  constructor(private userService: UserService) {
	}

	ngOnInit() {
		this.onSearchStr$.debounceTime(150).subscribe(str => {
			this.userService.searchUsersByName(str).subscribe(users => {
				this.userResults = users;
			}, console.log)
		}, console.log)
	}

	onSearchKeyup(str: string) {
		if (str) {
			this.searchStr = str;
			this.onSearchStr$.next(str);
		}
	}

	addUser(i: number) {
		this.userValue.push(this.userResults[i]);
		this.userResults = [];
		this.searchStr = '';
	}

	containsUser(user: User, arr: User[]): boolean {
		return !!arr.find(user => user.$key === user.$key);
	}

	writeValue(value: User[]) {
		this.userValue = value;
	}

	registerOnChange(fn) {
		this.onChangeCallback = fn;
	}

	registerOnTouched() {}

}
