const functionMatcher = /^\/\%3Cfunction\%3E\/(.*)/;

self.addEventListener('fetch', ev => {
  try {
    const { pathname } = new URL(ev.request.url);
    const match = pathname.match(functionMatcher);

    if (match) {
      console.log('Calling function', match[1]);

      ev.respondWith(
        new Response(JSON.stringify({}), {
          headers: {'Content-Type': 'application/json'}
        }),
      );
    }
  }
  catch (e) {
    console.log(e);
  }
});
