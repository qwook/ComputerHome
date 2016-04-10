
if (CLIENT) {
  var ts = timesync.create({
    server: '/timesync',
    interval: 10000
  });

  ts.sync();

  global.ts = ts;
}

