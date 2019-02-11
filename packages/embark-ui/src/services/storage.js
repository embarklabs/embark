/* global localStorage */

export async function addEditorTabs({file}) {
  const editorTabs = findOrCreateEditorTabs();
  editorTabs.forEach(f => f.active = false);
  const alreadyAddedFile = editorTabs.find(f => f.name === file.name);
  if (alreadyAddedFile) {
    alreadyAddedFile.active = true;
    alreadyAddedFile.content = file.content;
  } else {
    file.active = true;
    editorTabs.push(file);
  }
  localStorage.setItem('editorTabs', JSON.stringify(editorTabs));
  return {response: {data: editorTabs}};
}

export async function fetchEditorTabs() {
  return {response: {data: JSON.parse(localStorage.getItem('editorTabs'))}};
}

export async function removeEditorTabs({file}) {
  const editorTabs = findOrCreateEditorTabs();
  const filtered = editorTabs.filter(value => value.name !== file.name);
  if (file.active && filtered.length) {
    filtered[0].active = true;
  }
  localStorage.setItem('editorTabs', JSON.stringify(filtered));
  return {response: {data: filtered}};
}

export async function saveCredentials({token, host}) {
  const credentials = {token, host};
  localStorage.setItem('credentials', JSON.stringify(credentials));
  return {response: {data: credentials}};
}

export async function fetchCredentials() {
  const credentials = localStorage.getItem('credentials');
  return {response: {data: JSON.parse(credentials)}};
}

export async function logout() {
  localStorage.clear();
  return {response: true};
}

export async function changeTheme({theme}) {
  localStorage.setItem('theme', theme);
  return {response: {data: theme}};
}

export async function fetchTheme() {
  return {response: {data: localStorage.getItem('theme')}};
}

function findOrCreateEditorTabs() {
  return JSON.parse(localStorage.getItem('editorTabs')) || [];
}
