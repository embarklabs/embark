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

export function postToken(data) {
  return new Promise(function(resolve) {
    localStorage.setItem('token', data.token);
    resolve({response: {data: data.token}});
  });
}

export function fetchToken({callback}) {
  callback = callback || function(){};
  return new Promise(function(resolve) {
    const token = localStorage.getItem('token');
    callback(null, token);
    resolve({response: {data: token}});
  });
}
