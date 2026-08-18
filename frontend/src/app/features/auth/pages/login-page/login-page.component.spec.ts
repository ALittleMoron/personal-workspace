import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { LoginPageComponent } from './login-page.component';
import { createI18nTestingValue } from '../../../../testing/i18n-testing';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let navigateByUrl: jest.Mock;

  beforeEach(async () => {
    navigateByUrl = jest.fn();
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: new Map([['returnUrl', '/admin-panel/resumes']]) },
          },
        },
        {
          provide: I18nService,
          useValue: createI18nTestingValue({
            'auth.login.title': 'Sign in',
            'auth.login.subtitle': 'Private workspace',
          }),
        },
        { provide: AuthSessionService, useValue: { login: jest.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
  });

  it('renders a standalone main landmark without public shell chrome', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('main')).not.toBeNull();
    expect(element.querySelector('app-site-header')).toBeNull();
    expect(element.querySelector('app-site-footer')).toBeNull();
    expect(element.querySelector('app-cookie-consent-banner')).toBeNull();
  });

  it('navigates to the safe return URL after sign-in', () => {
    fixture.componentInstance.onLogin();

    expect(navigateByUrl).toHaveBeenCalledWith('/admin-panel/resumes');
  });
});
