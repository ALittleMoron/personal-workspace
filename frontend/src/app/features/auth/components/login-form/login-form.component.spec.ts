import { ComponentFixture, TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { LoginFormComponent } from './login-form.component';
import { createI18nTestingValue } from '../../../../testing/i18n-testing';
import { I18nService } from '../../../../core/i18n/i18n.service';

describe('LoginFormComponent', () => {
  let fixture: ComponentFixture<LoginFormComponent>;
  let login: jest.Mock;

  beforeEach(async () => {
    login = jest.fn();

    await TestBed.configureTestingModule({
      imports: [LoginFormComponent],
      providers: [
        {
          provide: AuthSessionService,
          useValue: { login },
        },
        {
          provide: I18nService,
          useValue: createI18nTestingValue({
            'auth.login.username': 'Username',
            'auth.login.password': 'Password',
            'auth.login.submit': 'Sign in',
            'auth.login.submitting': 'Signing in',
            'auth.login.validationError': 'Fill in both fields.',
            'auth.login.invalidCredentials': 'Invalid credentials.',
            'auth.login.rateLimited': 'Too many attempts.',
            'auth.login.forbidden': 'Security verification failed.',
            'auth.login.serviceError': 'Service unavailable.',
          }),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginFormComponent);
    fixture.detectChanges();
  });

  it('focuses the username field when the form is shown', () => {
    const username = (fixture.nativeElement as HTMLElement).querySelector('input[name="username"]');

    expect(document.activeElement).toBe(username);
  });

  it('marks both required credential fields and exposes accessible feedback after invalid submission', () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(
      element.querySelector('input[name="username"]')?.getAttribute('required'),
    ).not.toBeNull();
    expect(
      element.querySelector('input[name="password"]')?.getAttribute('required'),
    ).not.toBeNull();
    expect(element.querySelector('input[name="username"]')?.getAttribute('autocomplete')).toBe(
      'username',
    );
    expect(element.querySelector('input[name="password"]')?.getAttribute('autocomplete')).toBe(
      'current-password',
    );
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Fill in both fields.');
    expect(login).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'Invalid credentials.'],
    [429, 'Too many attempts.'],
    [403, 'Security verification failed.'],
    [503, 'Service unavailable.'],
  ])('shows the corresponding safe login failure message for status %i', (status, message) => {
    login.mockReturnValueOnce(throwError(() => ({ status })));
    const component = fixture.componentInstance;
    component.form.setValue({ username: 'owner', password: 'secret' });

    component.submit();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent,
    ).toContain(message);
  });

  it('does not submit credentials twice while the first login is pending', () => {
    login.mockReturnValueOnce({ subscribe: jest.fn() });
    const component = fixture.componentInstance;
    component.form.setValue({ username: 'owner', password: 'secret' });

    component.submit();
    component.submit();

    expect(login).toHaveBeenCalledTimes(1);
  });
});
