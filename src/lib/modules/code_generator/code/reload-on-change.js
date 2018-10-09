const ws = new WebSocket(`ws://${location.hostname}:${location.port}`);
ws.addEventListener('message', (evt) => {
  if(evt.data === 'outputDone') {
    location.reload(true);
  }
});
