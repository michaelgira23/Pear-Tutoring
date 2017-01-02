import { Component, OnInit, forwardRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, Subscription } from 'rxjs/Rx';
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
export class UserAutoCompleteComponent implements OnInit, ControlValueAccessor, OnDestroy {

	private selectedUsers: User[] = [];
	set userValue(users: User[]) {
		if (!users) {
			this.selectedUsers = [];
			if (this.onChangeCallback) {
				this.onChangeCallback(users);
			}
		} else if (this.selectedUsers.length !== users.length) {
			this.selectedUsers = users;
			if (this.onChangeCallback) {
				this.onChangeCallback(users);
			}
		}
		this.userResults = [];
		this.searchStr = '';
	};
	get userValue(): User[] {
		return this.selectedUsers;
	}
	userResults: User[] = [];
	searchStr: string = '';
	onSearchStr$ = new Subject<string>();
	searchStrSub: Subscription;

	onChangeCallback: any;

	@Output() onAddUser = new EventEmitter<User>();

	@Output() onRemoveUser = new EventEmitter<User>();

	dropdownOffset: number;

	constructor(private userService: UserService) {
	}

	ngOnInit() {
		this.searchStrSub = this.onSearchStr$.debounceTime(150).subscribe(str => {
			this.userService.searchUsersByName(str).subscribe(users => {
				this.userResults = users;
			}, console.log);
		}, console.log);
	}

	ngOnDestroy() {
		this.searchStrSub.unsubscribe();
	}

	onSearchKeyup(str: string) {
		if (str) {
			this.searchStr = str;
			this.onSearchStr$.next(str);
		} else {
			this.searchStr = '';
		}
	}

	addUser(e: MouseEvent, i: number) {
		e.stopPropagation();
		this.onAddUser.emit(this.userResults[i]);
		this.userValue = this.userValue.concat([this.userResults[i]]);
	}

	removeUser(i: number) {
		this.onRemoveUser.emit(this.selectedUsers[i]);
		this.userValue = this.userValue.slice(0, i).concat(this.userValue.slice(i + 1, this.userValue.length));
	}

	containsUser(user1: User, arr: User[]): boolean {
		return !!arr.find(user2 => user1.$key === user2.$key);
	}

	writeValue(value: User[]) {
		this.userValue = value;
	}

	registerOnChange(fn) {
		this.onChangeCallback = fn;
	}

	registerOnTouched() {}

}
