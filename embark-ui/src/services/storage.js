export function addEditorTabs({file}) {
  return new Promise(resolve => {
    const editorTabs = findOrCreateEditorTabs();
    editorTabs.forEach(f => f.active = false);
    const alreadyAddedFile = editorTabs.find(f => f.name === file.name)
    if (alreadyAddedFile) {
      alreadyAddedFile.active = true;
      alreadyAddedFile.content = file.content;
    } else {
      file.active = true;
      editorTabs.push(file);
    }
    localStorage.setItem('editorTabs', JSON.stringify(editorTabs));
    resolve({response: {data: editorTabs}});
  });
}

export function fetchEditorTabs() {
  return new Promise(resolve => {
    resolve({response: {data: JSON.parse(localStorage.getItem('editorTabs'))}});
  });
}

export function removeEditorTabs({file}) {
  return new Promise(resolve => {
    const editorTabs = findOrCreateEditorTabs();
    const filtered = editorTabs.filter(value => value.name !== file.name);
    if (file.active && filtered.length) {
      filtered[0].active = true;
    }
    localStorage.setItem('editorTabs', JSON.stringify(filtered));
    resolve({response: {data: filtered}});
  });
}

export function saveCredentials({token, host}) {
  const credentials = {token, host};
  return new Promise(resolve => {
    localStorage.setItem('credentials', JSON.stringify(credentials));
    resolve({response: {data: credentials}});
  });
}

export function fetchCredentials() {
  return new Promise(resolve => {
    const credentials = localStorage.getItem('credentials');
    resolve({response: {data: JSON.parse(credentials)}});
  });
}

export function logout() {
  return new Promise(resolve => {
    localStorage.clear();
    resolve({response: true});
  });
}

export function changeTheme({theme}) {
  return new Promise(resolve => {
    localStorage.setItem('theme', theme);
    resolve({response: {data: theme}});
  });
}

export function fetchTheme() {
  return new Promise(resolve => resolve({response: {data: localStorage.getItem('theme')}}));
}


function findOrCreateEditorTabs() {
  return JSON.parse(localStorage.getItem('editorTabs')) || [];
}