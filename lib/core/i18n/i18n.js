const i18n = require('i18n');
const osLocale = require('os-locale');
const path = require('path');

const supported_languages = ['en', 'pt', 'fr', 'es'];

i18n.configure({
  locales: supported_languages,
  register: global,
  updateFiles: false,
  directory: path.join(__dirname, '../../../', 'locales')
});

function isSupported(locale) {
  return (supported_languages.indexOf(locale.substr(0, 2)) >= 0);
}

function setLocale(locale) {
  i18n.setLocale(locale.substr(0, 2));
}

function setDefaultLocale() {
  osLocale().then(setLocale).catch();
}

function setOrDetectLocale(locale) {
  if (locale && !isSupported(locale)) {
    console.log("===== locale " + locale + " not supported =====");
  }
  if (locale) {
    return i18n.setLocale(locale.substr(0, 2));
  }
  setDefaultLocale();
}

setDefaultLocale();

module.exports = {
  i18n: i18n,
  setOrDetectLocale: setOrDetectLocale
};

