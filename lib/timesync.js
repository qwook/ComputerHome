
if (CLIENT) {
  var ts = timesync.create({
    server: '/timesync',
    interval: 1000
  });

  ts.sync();

  global.ts = ts;
}

