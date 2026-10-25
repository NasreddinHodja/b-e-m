import {
  getLocale,
  locales,
  overwriteGetLocale,
  setLocale,
  type Locale
} from '#lib/paraglide/runtime.js';

/** `<html lang>` for each locale. */
const HTML_LANG: Record<Locale, string> = { 'pt-br': 'pt-BR', en: 'en' };

/**
 * The interface language. Paraglide resolves the first one (saved choice, then the browser's,
 * then Portuguese); after that `getLocale()` reads this rune, so every `m.*()` in a template
 * re-renders on a switch, without reloading the page and losing the session's state.
 */
class Language {
  current = $state<Locale>(getLocale());

  constructor() {
    overwriteGetLocale(() => this.current);
    this.#applyHtmlLang();
  }

  readonly all = locales;

  set(locale: Locale) {
    // Paraglide stores the choice (localStorage strategy); no reload, the rune does the rest.
    void setLocale(locale, { reload: false });
    this.current = locale;
    this.#applyHtmlLang();
  }

  #applyHtmlLang() {
    if (typeof document !== 'undefined') document.documentElement.lang = HTML_LANG[this.current];
  }
}

export const language = new Language();
