export function postCurrentFile(file) {
  return new Promise(function(resolve) {
    localStorage.setItem('currentFile', JSON.stringify(file));
    resolve({response: {data: file}});
  });
}

export function fetchCurrentFile() {
  return new Promise(function(resolve) {
    resolve({response: {data: JSON.parse(localStorage.getItem('currentFile'))}});
  });
}

export function deleteCurrentFile() {
  return new Promise(function(resolve) {
    localStorage.removeItem('currentFile');
    resolve({});
  });
}

export function saveCredentials({token, host}) {
  const credentials = {token, host}
  return new Promise(function(resolve) {
    localStorage.setItem('credentials', JSON.stringify(credentials));
    resolve({response: {data: credentials}});
  });
}

export function fetchCredentials() {
  return new Promise(function(resolve) {
    const credentials = localStorage.getItem('credentials');
    resolve({response: {data: JSON.parse(credentials)}});
  });
}

export function logout() {
  return new Promise(function(resolve) {
    localStorage.clear();
    resolve({response: true});
  });
}
