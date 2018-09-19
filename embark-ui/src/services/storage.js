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

export function postToken({token}) {
  return new Promise(function(resolve) {
    localStorage.setItem('token', token);
    resolve({response: {data: token}});
  });
}

export function fetchToken() {
  return new Promise(function(resolve) {
    const token = localStorage.getItem('token');
    resolve({response: {data: token}});
  });
}

export function logout() {
  return new Promise(function(resolve) {
    localStorage.clear();
    resolve({response: true});
  });
}
