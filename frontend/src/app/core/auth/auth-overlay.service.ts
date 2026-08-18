import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthOverlayService {
  readonly loginRequired = signal(false);

  open(): void {
    this.loginRequired.set(true);
  }

  close(): void {
    this.loginRequired.set(false);
  }
}
