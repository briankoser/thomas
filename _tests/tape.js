const test = require('tape');

test('timing test', (t) => {
    t.plan(2);

    t.equal(typeof Date.now, 'function');
    var start = Date.now();

    setTimeout( () => {
        t.equal(Date.now() - start, 100);
    }, 100);
});