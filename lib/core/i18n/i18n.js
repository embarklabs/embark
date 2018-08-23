const i18n = require('i18n');
const osLocale = require('os-locale');
const path = require('path');

const supported_languages = ['en', 'pt', 'fr', 'es'];
const default_language = 'en';

i18n.configure({
  locales: supported_languages,
  register: global,
  updateFiles: false,
  syncFiles: false,
  directory: path.join(__dirname, '../../../', 'locales')
});

function isSupported(locale) {
  return (supported_languages.indexOf(locale.substr(0, 2)) >= 0);
}

function setOrDetectLocale(locale) {
  const how = locale ? 'specified' : 'detected';
  let _locale = locale || osLocale.sync();
  _locale = _locale.substr(0, 2);
  if (_locale && !isSupported(_locale)) {
    console.warn(`===== locale ${_locale} ${how} but not supported, default: en =====`.yellow);
    return;
  }
  return i18n.setLocale(_locale);
}

i18n.setLocale(default_language);

module.exports = {
  i18n: i18n,
  setOrDetectLocale: setOrDetectLocale
};
