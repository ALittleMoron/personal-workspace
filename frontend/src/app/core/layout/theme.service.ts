import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'chosenTheme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<ThemeName>(this.readInitialTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  setTheme(theme: ThemeName): void {
    this.persistTheme(theme);
    this.theme.set(theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  private readInitialTheme(): ThemeName {
    const value = this.readStoredTheme();
    return value === 'dark' || value === 'light' ? value : 'light';
  }

  private readStoredTheme(): string | null {
    try {
      return this.storage()?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private persistTheme(theme: ThemeName): void {
    try {
      this.storage()?.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage is an optional enhancement; theme state still applies in memory and to the DOM.
    }
  }

  private applyTheme(theme: ThemeName): void {
    this.document.documentElement.setAttribute('data-bs-theme', theme);
  }

  private storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
