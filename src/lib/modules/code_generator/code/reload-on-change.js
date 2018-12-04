const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:${location.port}`);
ws.addEventListener('message', (evt) => {
  if(evt.data === 'outputDone') {
    location.reload(true);
  }
});
